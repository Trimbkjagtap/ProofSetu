"""OCR provider interface + adapters.

The pipeline is fixture-first. Real OCR (Tesseract now; Textract later) plugs in
behind a single interface so the service can swap providers via OCR_PROVIDER
without changing anything downstream. Any provider failure raises OcrUnavailable
so the service can fall back to the deterministic fixture.
"""
from __future__ import annotations

import base64
import json
import logging
import os
from dataclasses import dataclass, field
from typing import List, Protocol, runtime_checkable

logger = logging.getLogger("extraction")


class OcrUnavailable(Exception):
    """Raised when a real OCR provider cannot run (missing dep, decode error…)."""


@dataclass
class OcrWord:
    text: str
    page: int
    x: float
    y: float
    width: float
    height: float
    confidence: float


@dataclass
class OcrResult:
    words: List[OcrWord] = field(default_factory=list)

    @property
    def text(self) -> str:
        """Joined text for classification/injection scanning only (never logged)."""
        return " ".join(w.text for w in self.words)


@runtime_checkable
class OcrProvider(Protocol):
    name: str

    def extract_words(self, content: bytes, content_type: str) -> OcrResult: ...


class TesseractOcrProvider:
    """Local, free OCR via pytesseract. Images only; PDFs raise OcrUnavailable
    (which triggers the fixture fallback) unless a rasterizer is added later.
    """

    name = "tesseract"

    def extract_words(self, content: bytes, content_type: str) -> OcrResult:
        ct = (content_type or "").split(";")[0].strip().lower()
        if ct == "application/pdf":
            raise OcrUnavailable("PDF rasterization not wired for Tesseract yet.")
        try:
            import io
            import os

            import pytesseract  # type: ignore
            from PIL import Image  # type: ignore
        except Exception as exc:  # pragma: no cover - depends on optional deps
            raise OcrUnavailable("pytesseract/Pillow not installed.") from exc

        # Allow pointing at the binary when it is not on PATH.
        cmd = os.getenv("TESSERACT_CMD")
        if cmd:
            pytesseract.pytesseract.tesseract_cmd = cmd

        try:
            image = Image.open(io.BytesIO(content))
            data = pytesseract.image_to_data(
                image, output_type=pytesseract.Output.DICT
            )
        except Exception as exc:  # pragma: no cover - runtime decode/engine errors
            raise OcrUnavailable("Tesseract failed to read the image.") from exc

        words: List[OcrWord] = []
        n = len(data.get("text", []))
        for i in range(n):
            text = (data["text"][i] or "").strip()
            if not text:
                continue
            try:
                conf = float(data["conf"][i])
            except (ValueError, TypeError):
                conf = -1.0
            if conf < 0:
                continue
            words.append(
                OcrWord(
                    text=text,
                    page=1,
                    x=float(data["left"][i]),
                    y=float(data["top"][i]),
                    width=float(data["width"][i]),
                    height=float(data["height"][i]),
                    confidence=conf / 100.0,  # Tesseract conf is 0-100
                )
            )
        if not words:
            raise OcrUnavailable("No text detected.")
        return OcrResult(words=words)


class GoogleVisionOcrProvider:
    """OCR via Google Cloud Vision DOCUMENT_TEXT_DETECTION (REST, API-key auth).

    Cloud-friendly (HTTPS only — works on Render). Returns word-level boxes so the
    existing mapper produces real sourceBoxes. PDFs are rasterized per page via
    pdf.py (PyMuPDF). Any failure raises OcrUnavailable -> fixture fallback.
    Never logs OCR text or PII.
    """

    name = "google"
    ENDPOINT = "https://vision.googleapis.com/v1/images:annotate"

    def __init__(self, api_key: str | None = None, timeout: float | None = None, poster=None) -> None:
        self._api_key = api_key if api_key is not None else os.getenv("GOOGLE_VISION_API_KEY")
        self._timeout = timeout or float(os.getenv("GOOGLE_VISION_TIMEOUT_SECONDS", "30"))
        # Injectable HTTP poster for tests: fn(payload: dict) -> response dict.
        self._poster = poster

    def extract_words(self, content: bytes, content_type: str) -> OcrResult:
        if not self._api_key and self._poster is None:
            raise OcrUnavailable("GOOGLE_VISION_API_KEY not set")

        ct = (content_type or "").split(";")[0].strip().lower()
        if ct == "application/pdf":
            from . import pdf

            try:
                pages = pdf.pdf_to_png_pages(content)
            except pdf.PdfRenderError as exc:
                raise OcrUnavailable("PDF rasterization failed") from exc
            images = list(enumerate(pages, start=1))  # (page_number, png_bytes)
        else:
            images = [(1, content)]

        words: List[OcrWord] = []
        for page_number, image_bytes in images:
            response = self._annotate(image_bytes)
            words.extend(self._parse_words(response, page_number))

        if not words:
            raise OcrUnavailable("No text detected.")
        return OcrResult(words=words)

    def _annotate(self, image_bytes: bytes) -> dict:
        payload = {
            "requests": [
                {
                    "image": {"content": base64.b64encode(image_bytes).decode("ascii")},
                    "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
                }
            ]
        }
        try:
            if self._poster is not None:  # test seam
                return self._poster(payload)

            import urllib.request

            url = f"{self.ENDPOINT}?key={self._api_key}"
            request = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(request, timeout=self._timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except OcrUnavailable:
            raise
        except Exception as exc:  # network/HTTP/timeout — never log document text
            logger.warning("google_vision_request_failed (falling back)")
            raise OcrUnavailable("Google Vision request failed") from exc

    def _parse_words(self, response: dict, page_number: int) -> List[OcrWord]:
        if not isinstance(response, dict):
            raise OcrUnavailable("Unexpected Google Vision response")
        responses = response.get("responses") or []
        first = responses[0] if responses else {}
        if first.get("error"):
            raise OcrUnavailable("Google Vision returned an error")

        # textAnnotations[0] is the full block; [1:] are individual words.
        annotations = first.get("textAnnotations") or []
        words: List[OcrWord] = []
        for ann in annotations[1:]:
            text = (ann.get("description") or "").strip()
            if not text:
                continue
            vertices = (ann.get("boundingPoly") or {}).get("vertices") or []
            # Google omits x/y keys when the value is 0 — default them.
            xs = [float(v.get("x", 0)) for v in vertices]
            ys = [float(v.get("y", 0)) for v in vertices]
            if not xs or not ys:
                continue
            x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
            words.append(
                OcrWord(
                    text=text,
                    page=page_number,
                    x=x0,
                    y=y0,
                    width=max(0.0, x1 - x0),
                    height=max(0.0, y1 - y0),
                    confidence=0.9,  # textAnnotations carry no per-word score
                )
            )
        return words


def get_ocr_provider(name: str) -> OcrProvider | None:
    """Return a real OCR provider, or None for the fixture path.

    Textract is intentionally not implemented tonight; requesting it falls back
    to the fixture (P0 stays green without AWS credentials).
    """
    key = (name or "fixture").strip().lower()
    if key == "tesseract":
        return TesseractOcrProvider()
    if key == "google":
        return GoogleVisionOcrProvider()
    # "textract" and "fixture" -> no live provider; service uses fixtures.
    return None

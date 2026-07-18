"""OCR provider interface + adapters.

The pipeline is fixture-first. Real OCR (Tesseract now; Textract later) plugs in
behind a single interface so the service can swap providers via OCR_PROVIDER
without changing anything downstream. Any provider failure raises OcrUnavailable
so the service can fall back to the deterministic fixture.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Protocol, runtime_checkable


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

            import pytesseract  # type: ignore
            from PIL import Image  # type: ignore
        except Exception as exc:  # pragma: no cover - depends on optional deps
            raise OcrUnavailable("pytesseract/Pillow not installed.") from exc

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


def get_ocr_provider(name: str) -> OcrProvider | None:
    """Return a real OCR provider, or None for the fixture path.

    Textract is intentionally not implemented tonight; requesting it falls back
    to the fixture (P0 stays green without AWS credentials).
    """
    key = (name or "fixture").strip().lower()
    if key == "tesseract":
        return TesseractOcrProvider()
    # "textract" and "fixture" -> no live provider; service uses fixtures.
    return None

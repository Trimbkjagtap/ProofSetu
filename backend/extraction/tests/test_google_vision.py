"""GoogleVisionOcrProvider tests — the HTTP call is mocked (no real API calls).

Covers word parsing, omitted zero-coordinate handling, error/HTTP failure ->
OcrUnavailable, PDF per-page numbering, and an end-to-end OCR_PROVIDER=google
service run asserting real (non-null) sourceBoxes from the existing mapper.
"""
from __future__ import annotations

import os

import pytest

from backend.extraction.ocr import GoogleVisionOcrProvider, OcrUnavailable, get_ocr_provider
from backend.extraction.schemas import DocumentType
from backend.extraction.service import ExtractionService

PNG = b"\x89PNG fake-bytes"
PDF = b"%PDF-1.4 fake-bytes"


def _word(text, x, y, w, h):
    return {
        "description": text,
        "boundingPoly": {
            "vertices": [
                {"x": x, "y": y},
                {"x": x + w, "y": y},
                {"x": x + w, "y": y + h},
                {"x": x, "y": y + h},
            ]
        },
    }


def _response(words):
    # textAnnotations[0] is the full-text block; [1:] are individual words.
    return {"responses": [{"textAnnotations": [{"description": "FULL"}] + words}]}


def _paystub_response():
    W = []
    W += [_word("Employer:", 60, 120, 90, 24), _word("Cambridge", 180, 120, 120, 24),
          _word("Community", 320, 120, 120, 24), _word("Services", 470, 120, 100, 24)]
    W += [_word("Employee:", 60, 175, 90, 24), _word("Jordan", 180, 175, 80, 24),
          _word("Rivera", 300, 175, 80, 24)]
    W += [_word("Pay", 60, 230, 40, 24), _word("Period", 110, 230, 70, 24),
          _word("Start:", 200, 230, 70, 24), _word("2026-04-01", 290, 230, 120, 24)]
    W += [_word("Pay", 60, 285, 40, 24), _word("Period", 110, 285, 70, 24),
          _word("End:", 200, 285, 60, 24), _word("2026-04-15", 290, 285, 120, 24)]
    W += [_word("Pay", 60, 340, 40, 24), _word("Frequency:", 110, 340, 120, 24),
          _word("Biweekly", 260, 340, 100, 24)]
    W += [_word("Gross", 60, 395, 70, 24), _word("Pay:", 150, 395, 60, 24),
          _word("$2,450.00", 240, 395, 110, 24)]
    return _response(W)


def _provider(response=None, poster=None):
    return GoogleVisionOcrProvider(api_key="test-key", poster=poster or (lambda payload: response))


# -- parsing ---------------------------------------------------------------
def test_parses_words_with_boxes():
    prov = _provider(_response([_word("Hello", 10, 20, 50, 15)]))
    result = prov.extract_words(PNG, "image/png")
    assert len(result.words) == 1
    w = result.words[0]
    assert w.text == "Hello" and w.page == 1
    assert (w.x, w.y, w.width, w.height) == (10, 20, 50, 15)
    assert w.confidence == 0.9


def test_missing_zero_coordinates_default_to_zero():
    # Google omits x/y keys when they are 0.
    ann = {"description": "Corner", "boundingPoly": {"vertices": [{}, {"x": 40}, {"x": 40, "y": 12}, {"y": 12}]}}
    prov = _provider(_response([ann]))
    w = prov.extract_words(PNG, "image/png").words[0]
    assert (w.x, w.y) == (0, 0)
    assert (w.width, w.height) == (40, 12)


# -- failure modes -> OcrUnavailable --------------------------------------
def test_api_error_response_raises_ocr_unavailable():
    prov = _provider({"responses": [{"error": {"code": 7, "message": "denied"}}]})
    with pytest.raises(OcrUnavailable):
        prov.extract_words(PNG, "image/png")


def test_no_text_raises_ocr_unavailable():
    prov = _provider(_response([]))
    with pytest.raises(OcrUnavailable):
        prov.extract_words(PNG, "image/png")


def test_http_failure_raises_ocr_unavailable():
    def boom(payload):
        raise RuntimeError("network down")

    prov = _provider(poster=boom)
    with pytest.raises(OcrUnavailable):
        prov.extract_words(PNG, "image/png")


def test_no_key_raises_ocr_unavailable():
    prov = GoogleVisionOcrProvider(api_key=None, poster=None)
    with pytest.raises(OcrUnavailable):
        prov.extract_words(PNG, "image/png")


# -- PDF per-page ----------------------------------------------------------
def test_pdf_ocr_assigns_correct_page_numbers(monkeypatch):
    monkeypatch.setattr("backend.extraction.pdf.pdf_to_png_pages", lambda content, **kw: [b"P1", b"P2"])
    calls = {"n": 0}

    def poster(payload):
        calls["n"] += 1
        label = "Alpha" if calls["n"] == 1 else "Beta"
        return _response([_word(label, 10, 10, 40, 20)])

    prov = _provider(poster=poster)
    result = prov.extract_words(PDF, "application/pdf")
    pages = {w.page for w in result.words}
    assert pages == {1, 2}
    assert {w.text for w in result.words} == {"Alpha", "Beta"}


# -- registration ----------------------------------------------------------
def test_get_ocr_provider_registers_google():
    assert isinstance(get_ocr_provider("google"), GoogleVisionOcrProvider)


# -- end-to-end through the service ----------------------------------------
def test_service_google_path_yields_real_source_boxes():
    prov = _provider(_paystub_response())
    svc = ExtractionService(ocr_provider=prov)  # OCR path; vision default is fixture
    wire = svc.extract("paystub.png", PNG, "image/png").to_wire()
    assert wire["documentType"] == "pay_stub"
    fields = {f["name"]: f for f in wire["fields"]}
    assert fields["gross_pay"]["value"] == 2450
    assert fields["pay_frequency"]["value"] == "biweekly"
    assert "Cambridge Community Services" in str(fields["employer_name"]["value"])
    # The whole point of Google Vision: real pixel source boxes, not None.
    assert fields["gross_pay"]["sourceBox"] is not None
    assert fields["gross_pay"]["sourceBox"]["width"] > 0


def test_service_google_fallback_to_fixture_on_error():
    def boom(payload):
        raise RuntimeError("down")

    svc = ExtractionService(ocr_provider=_provider(poster=boom))
    wire = svc.extract("paystub.png", PNG, "image/png").to_wire()
    # Fixture fallback ran (fixture pay-stub gross_pay), demo never hard-fails.
    assert {f["name"]: f for f in wire["fields"]}["gross_pay"]["value"] == 2450


@pytest.mark.skipif(
    not os.getenv("RUN_GOOGLE_VISION_TEST"),
    reason="set RUN_GOOGLE_VISION_TEST=1 and GOOGLE_VISION_API_KEY to hit the real API",
)
@pytest.mark.parametrize("image", ["pay_stub_demo.png", "government_id_demo.png"])
def test_real_google_vision_smoke(image):  # pragma: no cover - manual/local only
    import pathlib

    img = pathlib.Path(__file__).resolve().parents[3] / "data" / "synthetic" / image
    prov = GoogleVisionOcrProvider()
    result = prov.extract_words(img.read_bytes(), "image/png")
    assert result.words and all(w.width > 0 for w in result.words)

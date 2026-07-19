"""P1 mapper tests — exercise real-OCR mapping logic without the engine binary.

We simulate Tesseract-style word output for the synthetic pay stub and assert the
line-aware mapper extracts typed, allowlisted values. A final test runs the real
Tesseract adapter when the engine happens to be installed, and skips otherwise.
"""
from __future__ import annotations

import pathlib

import pytest

from backend.extraction.classifier import classify
from backend.extraction.mapper import _to_number, map_fields
from backend.extraction.ocr import OcrResult, OcrUnavailable, OcrWord, get_ocr_provider
from backend.extraction.schemas import DocumentType, FieldState


def _line(words_and_x, y, conf=0.9, h=24):
    """Build a list of OcrWords on one visual line at vertical position y."""
    return [
        OcrWord(text=t, page=1, x=x, y=y, width=len(t) * 11, height=h, confidence=conf)
        for (t, x) in words_and_x
    ]


def _paystub_ocr(conf=0.9) -> OcrResult:
    words = []
    words += _line([("Employer:", 60), ("Cambridge", 180), ("Community", 320), ("Services", 470)], 120, conf)
    words += _line([("Employee:", 60), ("Jordan", 180), ("Rivera", 300)], 175, conf)
    words += _line([("Pay", 60), ("Period", 110), ("Start:", 200), ("2026-04-01", 290)], 230, conf)
    words += _line([("Pay", 60), ("Period", 110), ("End:", 200), ("2026-04-15", 290)], 285, conf)
    words += _line([("Pay", 60), ("Frequency:", 110), ("Biweekly", 260)], 340, conf)
    words += _line([("Gross", 60), ("Pay:", 150), ("$2,450.00", 240)], 395, conf)
    return OcrResult(words=words)


def _fields_by_name(fields):
    return {f.name: f for f in fields}


def test_number_parsing():
    assert _to_number("$2,450.00") == 2450
    assert _to_number("1875") == 1875
    assert _to_number("480.50") == 480.5
    assert _to_number("n/a") is None


def test_classify_from_ocr_text():
    ocr = _paystub_ocr()
    assert classify("upload.png", ocr.text) == DocumentType.pay_stub


def test_mapper_extracts_typed_paystub_values():
    fields = _fields_by_name(map_fields(DocumentType.pay_stub, _paystub_ocr()))

    assert fields["gross_pay"].value == 2450  # currency parsed to int
    assert fields["gross_pay"].state == FieldState.unconfirmed
    assert fields["pay_frequency"].value == "biweekly"  # normalized to canonical
    assert fields["pay_period_start"].value == "2026-04-01"
    assert fields["pay_period_end"].value == "2026-04-15"
    assert "Cambridge Community Services" in str(fields["employer_name"].value)
    assert "Jordan Rivera" in str(fields["employee_name"].value)


def test_mapper_source_boxes_span_values():
    fields = _fields_by_name(map_fields(DocumentType.pay_stub, _paystub_ocr()))
    box = fields["gross_pay"].source_box
    assert box is not None and box.width > 0 and box.height > 0


def test_low_confidence_ocr_becomes_please_check():
    fields = _fields_by_name(map_fields(DocumentType.pay_stub, _paystub_ocr(conf=0.30)))
    assert fields["gross_pay"].state == FieldState.please_check
    assert fields["gross_pay"].value == 2450  # value kept, flagged not dropped


def test_missing_field_is_please_check():
    # OCR with only an employer line — everything else must be please_check/None.
    ocr = OcrResult(words=_line([("Employer:", 60), ("Acme", 180)], 120))
    fields = _fields_by_name(map_fields(DocumentType.pay_stub, ocr))
    assert fields["gross_pay"].value is None
    assert fields["gross_pay"].state == FieldState.please_check


def test_real_tesseract_on_synthetic_image_if_available():
    """Runs only when the Tesseract engine is installed; skips otherwise."""
    provider = get_ocr_provider("tesseract")
    assert provider is not None
    img = (
        pathlib.Path(__file__).resolve().parents[3]
        / "data"
        / "synthetic"
        / "pay_stub_demo.png"
    )
    if not img.exists():
        pytest.skip("synthetic image not generated")
    try:
        content = img.read_bytes()
        ocr = provider.extract_words(content, "image/png")
    except OcrUnavailable as exc:
        pytest.skip(f"Tesseract engine unavailable: {exc}")

    fields = _fields_by_name(map_fields(DocumentType.pay_stub, ocr))
    assert fields["gross_pay"].value == 2450

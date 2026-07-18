"""P2 government-ID tests.

Verifies the ID lane surfaces expiration_date (for the checklist's expired demo),
full name, and DOB — and that the ID number is reduced to last-4 only, with the
full number never present in the output.
"""
from __future__ import annotations

import json
import pathlib

import pytest

from backend.extraction.classifier import classify
from backend.extraction.mapper import map_fields
from backend.extraction.ocr import OcrResult, OcrUnavailable, OcrWord, get_ocr_provider
from backend.extraction.schemas import DocumentType, FieldState
from backend.extraction.service import ExtractionService

_FULL_ID = "A00047884821"  # fictional; only last-4 (4821) may leave the pipeline


def _line(words_and_x, y, conf=0.9, h=24):
    return [
        OcrWord(text=t, page=1, x=x, y=y, width=len(t) * 11, height=h, confidence=conf)
        for (t, x) in words_and_x
    ]


def _gov_id_ocr(conf=0.9) -> OcrResult:
    words = []
    words += _line([("STATE", 60), ("IDENTIFICATION", 160), ("CARD", 460)], 55, conf, 34)
    words += _line([("Full", 60), ("Name:", 120), ("Jordan", 220), ("Rivera", 330)], 120, conf)
    words += _line([("Date", 60), ("of", 120), ("Birth:", 160), ("1990-06-12", 260)], 175, conf)
    words += _line([("ID", 60), ("Number:", 100), (_FULL_ID, 230)], 230, conf)
    words += _line([("Expiration", 60), ("Date:", 210), ("2024-02-10", 310)], 285, conf)
    return OcrResult(words=words)


def _by_name(fields):
    return {f.name: f for f in fields}


def test_classify_government_id():
    ocr = _gov_id_ocr()
    assert classify("state_id.png", ocr.text) == DocumentType.government_id


def test_gov_id_fields_extracted():
    fields = _by_name(map_fields(DocumentType.government_id, _gov_id_ocr()))
    assert "Jordan Rivera" in str(fields["full_name"].value)
    assert fields["date_of_birth"].value == "1990-06-12"
    assert fields["expiration_date"].value == "2024-02-10"
    assert fields["expiration_date"].state == FieldState.unconfirmed


def test_gov_id_number_is_last4_only():
    fields = _by_name(map_fields(DocumentType.government_id, _gov_id_ocr()))
    assert fields["id_number_last4"].value == "4821"

    # The full ID number must never appear anywhere in the serialized output.
    blob = json.dumps([f.model_dump(by_alias=True) for f in fields.values()])
    assert _FULL_ID not in blob
    assert "0004788" not in blob  # no long ID substring leaks


def test_gov_id_fixture_also_last4_only():
    svc = ExtractionService(ocr_provider_name="fixture")
    resp = svc.extract("drivers_license.png", b"\x89PNG fake", "image/png")
    blob = json.dumps(resp.to_wire())
    assert "id_number" not in blob or "id_number_last4" in blob
    assert _FULL_ID not in blob


def test_real_tesseract_on_synthetic_id_if_available():
    """Runs only when the Tesseract engine is installed; skips otherwise."""
    provider = get_ocr_provider("tesseract")
    assert provider is not None
    img = (
        pathlib.Path(__file__).resolve().parents[3]
        / "data"
        / "synthetic"
        / "government_id_demo.png"
    )
    if not img.exists():
        pytest.skip("synthetic ID image not generated")
    try:
        ocr = provider.extract_words(img.read_bytes(), "image/png")
    except OcrUnavailable as exc:
        pytest.skip(f"Tesseract engine unavailable: {exc}")

    fields = _by_name(map_fields(DocumentType.government_id, ocr))
    assert fields["expiration_date"].value == "2024-02-10"
    assert fields["id_number_last4"].value == "4821"

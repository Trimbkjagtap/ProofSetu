"""P3 tests — benefit letter and bank statement lanes.

Added only after the required pay-stub lane is stable. Covers classification,
line-aware mapping, and amount typing for both document types.
"""
from __future__ import annotations

import pathlib

import pytest

from backend.extraction.classifier import classify
from backend.extraction.mapper import map_fields
from backend.extraction.ocr import OcrResult, OcrUnavailable, OcrWord, get_ocr_provider
from backend.extraction.schemas import DocumentType, FieldState


def _line(words_and_x, y, conf=0.9, h=24):
    return [
        OcrWord(text=t, page=1, x=x, y=y, width=len(t) * 11, height=h, confidence=conf)
        for (t, x) in words_and_x
    ]


def _by_name(fields):
    return {f.name: f for f in fields}


# -- benefit letter --------------------------------------------------------
def _benefit_ocr(conf=0.9) -> OcrResult:
    words = []
    words += _line([("BENEFIT", 60), ("AWARD", 200), ("LETTER", 320)], 55, conf, 34)
    words += _line([("Issuer:", 60), ("State", 180), ("Benefits", 280), ("Office", 400)], 120, conf)
    words += _line([("Recipient:", 60), ("Jordan", 200), ("Rivera", 320)], 175, conf)
    words += _line([("Benefit", 60), ("Type:", 160), ("SNAP", 260)], 230, conf)
    words += _line([("Monthly", 60), ("Amount:", 180), ("$480.00", 320)], 285, conf)
    words += _line([("Effective", 60), ("Date:", 200), ("2026-01-01", 300)], 340, conf)
    return OcrResult(words=words)


def test_classify_benefit_letter():
    assert classify("award.png", _benefit_ocr().text) == DocumentType.benefit_letter


def test_benefit_fields_extracted():
    fields = _by_name(map_fields(DocumentType.benefit_letter, _benefit_ocr()))
    assert "State Benefits Office" in str(fields["issuer"].value)
    assert "Jordan Rivera" in str(fields["recipient_name"].value)
    assert fields["benefit_type"].value == "SNAP"
    assert fields["monthly_amount"].value == 480  # currency typed to number
    assert fields["effective_date"].value == "2026-01-01"
    assert fields["monthly_amount"].state == FieldState.unconfirmed


# -- bank statement --------------------------------------------------------
def _bank_ocr(conf=0.9) -> OcrResult:
    words = []
    words += _line([("BANK", 60), ("STATEMENT", 180)], 55, conf, 34)
    words += _line([("Institution:", 60), ("Riverbank", 220), ("Credit", 360), ("Union", 460)], 120, conf)
    words += _line([("Account", 60), ("Holder:", 180), ("Jordan", 320), ("Rivera", 440)], 175, conf)
    words += _line([("Period", 60), ("Start:", 160), ("2026-03-01", 280)], 230, conf)
    words += _line([("Period", 60), ("End:", 160), ("2026-03-31", 280)], 285, conf)
    words += _line([("Ending", 60), ("Balance:", 180), ("$1,875.00", 340)], 340, conf)
    return OcrResult(words=words)


def test_classify_bank_statement():
    assert classify("statement.png", _bank_ocr().text) == DocumentType.bank_statement


def test_bank_fields_extracted():
    fields = _by_name(map_fields(DocumentType.bank_statement, _bank_ocr()))
    assert "Riverbank Credit Union" in str(fields["institution"].value)
    assert "Jordan Rivera" in str(fields["account_holder"].value)
    assert fields["period_start"].value == "2026-03-01"
    assert fields["period_end"].value == "2026-03-31"
    assert fields["ending_balance"].value == 1875  # currency typed to number


def test_bank_institution_not_polluted_by_title():
    # Regression: bare "bank"/"account" labels used to grab the title line.
    fields = _by_name(map_fields(DocumentType.bank_statement, _bank_ocr()))
    assert "STATEMENT" not in str(fields["institution"].value)
    assert "STATEMENT" not in str(fields["account_holder"].value)


# -- real engine (skips without Tesseract) ---------------------------------
@pytest.mark.parametrize(
    "doc_type,image,checks",
    [
        (DocumentType.benefit_letter, "benefit_letter_demo.png", {"monthly_amount": 480}),
        (DocumentType.bank_statement, "bank_statement_demo.png", {"ending_balance": 1875}),
    ],
)
def test_real_tesseract_if_available(doc_type, image, checks):
    provider = get_ocr_provider("tesseract")
    assert provider is not None
    img = pathlib.Path(__file__).resolve().parents[3] / "data" / "synthetic" / image
    if not img.exists():
        pytest.skip("synthetic image not generated")
    try:
        ocr = provider.extract_words(img.read_bytes(), "image/png")
    except OcrUnavailable as exc:
        pytest.skip(f"Tesseract engine unavailable: {exc}")
    fields = _by_name(map_fields(doc_type, ocr))
    for name, expected in checks.items():
        assert fields[name].value == expected

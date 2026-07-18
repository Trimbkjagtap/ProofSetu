"""P4 value-normalization tests: ISO dates + canonical pay frequency."""
from __future__ import annotations

import pytest

from backend.extraction.mapper import map_fields
from backend.extraction.normalize import normalize_date, normalize_frequency
from backend.extraction.ocr import OcrResult, OcrWord
from backend.extraction.schemas import DocumentType


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("2026-04-01", "2026-04-01"),
        ("04/01/2026", "2026-04-01"),
        ("4/1/2026", "2026-04-01"),
        ("April 1, 2026", "2026-04-01"),
        ("Feb 10, 2024", "2024-02-10"),
        ("2026/04/01", "2026-04-01"),
    ],
)
def test_normalize_date_formats(raw, expected):
    assert normalize_date(raw) == expected


def test_normalize_date_unparseable_returns_none():
    assert normalize_date("sometime next spring") is None
    assert normalize_date("") is None
    assert normalize_date(None) is None


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("Biweekly", "biweekly"),
        ("BI-WEEKLY", "biweekly"),
        ("bi weekly", "biweekly"),
        ("Fortnightly", "biweekly"),
        ("Weekly", "weekly"),
        ("Semi-Monthly", "semimonthly"),
        ("Monthly", "monthly"),
        ("Annual", "annually"),
        ("yearly", "annually"),
    ],
)
def test_normalize_frequency(raw, expected):
    assert normalize_frequency(raw) == expected


def test_normalize_frequency_unknown_returns_none():
    assert normalize_frequency("hourly-ish") is None


def _line(words_and_x, y, conf=0.9, h=24):
    return [
        OcrWord(text=t, page=1, x=x, y=y, width=len(t) * 11, height=h, confidence=conf)
        for (t, x) in words_and_x
    ]


def test_mapper_normalizes_dates_and_frequency_end_to_end():
    ocr = OcrResult(words=(
        _line([("Pay", 60), ("Period", 110), ("Start:", 200), ("04/01/2026", 300)], 120)
        + _line([("Pay", 60), ("Frequency:", 110), ("Bi-Weekly", 260)], 175)
    ))
    fields = {f.name: f for f in map_fields(DocumentType.pay_stub, ocr)}
    assert fields["pay_period_start"].value == "2026-04-01"
    assert fields["pay_frequency"].value == "biweekly"


def test_mapper_keeps_unparseable_date_raw():
    ocr = OcrResult(words=_line(
        [("Pay", 60), ("Period", 110), ("Start:", 200), ("springtime", 300)], 120
    ))
    fields = {f.name: f for f in map_fields(DocumentType.pay_stub, ocr)}
    assert fields["pay_period_start"].value == "springtime"  # kept for renter

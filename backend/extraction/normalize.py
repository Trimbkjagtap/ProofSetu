"""Value normalization for extracted fields.

Downstream members need clean, consistent inputs:
- Member 3 annualizes income from `pay_frequency` -> canonical vocabulary.
- Members 3/4 check recency and expiration from dates -> ISO 8601 (YYYY-MM-DD).

Normalization never invents data: if a value cannot be parsed, the original
string is kept unchanged so the renter can confirm or correct it.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

# US-style (MM/DD) is preferred first for ambiguous numeric dates in this demo.
_DATE_FORMATS = (
    "%Y-%m-%d",
    "%m/%d/%Y",
    "%m-%d-%Y",
    "%Y/%m/%d",
    "%m/%d/%y",
    "%B %d, %Y",
    "%b %d, %Y",
    "%B %d %Y",
    "%b %d %Y",
    "%d %B %Y",
    "%d %b %Y",
)

# Canonical pay-frequency vocabulary consumed by annualization.
_FREQUENCY_MAP = {
    "weekly": "weekly",
    "biweekly": "biweekly",
    "bi-weekly": "biweekly",
    "bi weekly": "biweekly",
    "fortnightly": "biweekly",
    "every two weeks": "biweekly",
    "semimonthly": "semimonthly",
    "semi-monthly": "semimonthly",
    "semi monthly": "semimonthly",
    "twice monthly": "semimonthly",
    "monthly": "monthly",
    "annually": "annually",
    "annual": "annually",
    "yearly": "annually",
}


def normalize_date(value: Optional[str]) -> Optional[str]:
    """Return an ISO 8601 date (YYYY-MM-DD), or None if it cannot be parsed."""
    if not value:
        return None
    text = str(value).strip().strip(".,")
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def normalize_frequency(value: Optional[str]) -> Optional[str]:
    """Return a canonical pay frequency, or None if the token is unknown."""
    if not value:
        return None
    return _FREQUENCY_MAP.get(str(value).strip().lower())

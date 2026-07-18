"""Deterministic calculation functions (Member 3).

These are pure Python. No model calls, no randomness, no I/O beyond the frozen
MTSP threshold table. They compute FACTS only and MUST NEVER return or imply a
verdict: eligible, approved, denied, qualified, pass, fail, score, or rank.

Contract reference: contracts/rules-response.json -> "calculation" object.
"""

from __future__ import annotations

import json
from pathlib import Path

# Frozen 2026 MTSP threshold table. Owned by Member 3; do not live-fetch.
_MTSP_PATH = Path(__file__).resolve().parents[2] / "data" / "reference" / "mtsp_2026.json"

# Pay-frequency multipliers used to annualize gross income. Frozen per the
# 2026 LIHTC corpus (chunk lihtc-2026-income-annualization).
_FREQUENCY_MULTIPLIERS = {
    "weekly": 52,
    "biweekly": 26,
    "bi_weekly": 26,
    "semimonthly": 24,
    "semi_monthly": 24,
    "monthly": 12,
    "annual": 1,
    "annually": 1,
    "yearly": 1,
}


class AbstainError(ValueError):
    """Raised when an input is missing or unknown so the caller can abstain
    rather than guess. The rules layer converts this into abstained=true."""


def annualize_income(amount, frequency):
    """Annualize a gross income amount for a given pay frequency.

    Returns an integer annual gross. Raises AbstainError when the amount is
    missing/invalid or the frequency is not in the frozen multiplier table
    (never guess a multiplier).
    """
    if amount is None:
        raise AbstainError("amount is missing")
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        raise AbstainError("amount is not numeric")
    if amount < 0:
        raise AbstainError("amount is negative")

    if not frequency:
        raise AbstainError("frequency is missing")
    key = str(frequency).strip().lower()
    if key not in _FREQUENCY_MULTIPLIERS:
        raise AbstainError(f"unknown pay frequency: {frequency!r}")

    return int(round(amount * _FREQUENCY_MULTIPLIERS[key]))


def count_household_income(confirmed_sources, frozen_rules=None):
    """Sum annualized income across confirmed household income sources.

    ``confirmed_sources`` is a list of dicts, each with at least
    ``{"amount": <number>, "frequency": <str>}``. Only confirmed sources should
    be passed in; unconfirmed/corrected-pending values are the frontend's
    concern. Raises AbstainError if there are no sources to count.
    """
    if not confirmed_sources:
        raise AbstainError("no confirmed income sources to count")

    total = 0
    for source in confirmed_sources:
        total += annualize_income(source.get("amount"), source.get("frequency"))
    return total


def lookup_mtsp_limit(metro, household_size, ami_pct=50, year=2026):
    """Look up the frozen MTSP income limit for a metro/household size/AMI%.

    Returns the integer threshold. Raises AbstainError when household size is
    missing or when no matching frozen row exists (never interpolate/guess).
    """
    if household_size is None:
        raise AbstainError("household size is missing")
    try:
        household_size = int(household_size)
    except (TypeError, ValueError):
        raise AbstainError("household size is not an integer")
    if household_size < 1:
        raise AbstainError("household size must be at least 1")

    table = _load_mtsp_table()
    if year != table["_meta"]["ruleYear"]:
        raise AbstainError(f"no frozen MTSP data for year {year}")

    metro_key = str(metro).strip().lower() if metro else ""
    metro_rows = table["thresholds"].get(metro_key)
    if metro_rows is None:
        raise AbstainError(f"no frozen MTSP data for metro {metro!r}")

    ami_rows = metro_rows.get(str(ami_pct))
    if ami_rows is None:
        raise AbstainError(f"no frozen MTSP data for AMI {ami_pct}%")

    limit = ami_rows.get(str(household_size))
    if limit is None:
        raise AbstainError(
            f"no frozen MTSP row for household size {household_size}"
        )
    return int(limit)


def compare_facts(counted, threshold):
    """Compare counted income to a threshold and return facts only.

    Returns ``{"counted", "threshold", "difference"}`` where difference =
    threshold - counted. Positive difference means counted income is below the
    limit; negative means above. This function intentionally returns NO verdict.
    """
    counted = int(round(float(counted)))
    threshold = int(round(float(threshold)))
    return {
        "counted": counted,
        "threshold": threshold,
        "difference": threshold - counted,
    }


def format_formula(amount, frequency):
    """Human-readable formula string, e.g. "$2,650 x 12"."""
    key = str(frequency).strip().lower()
    multiplier = _FREQUENCY_MULTIPLIERS.get(key)
    if multiplier is None:
        raise AbstainError(f"unknown pay frequency: {frequency!r}")
    return f"${int(round(float(amount))):,} x {multiplier}"


def _load_mtsp_table():
    with _MTSP_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)

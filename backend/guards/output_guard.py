"""Output guard (Member 4) — the authoritative gate against verdict language.

Scans user-facing text for forbidden eligibility/score/rank language. Members'
own layers may guard too, but this is the global gate applied to every response
(see backend/guards/middleware.py). Whole-word matching only.
"""
from __future__ import annotations

import re

# Forbidden verdict/score/rank tokens (contracts/README "Forbidden output language").
FORBIDDEN_TOKENS = (
    "eligible",
    "ineligible",
    "approved",
    "denied",
    "disqualified",
    "likelihood",
    "recommend",
    "recommendation",
    "ranking",
    "rank",
    "qualified",
    "pass",
    "fail",
)

# Safe collocations that must NOT trip the guard. "A qualified human decides" is
# the mandated refusal language, so neutralize these phrases before checking.
ALLOWED_PHRASES = (
    "qualified human",
    "qualified housing professional",
    "qualified professional",
)


def _neutralize(text: str) -> str:
    lowered = str(text).lower()
    for phrase in ALLOWED_PHRASES:
        lowered = lowered.replace(phrase, " ")
    return lowered


def contains_verdict(text: str) -> bool:
    """True if text contains a forbidden verdict token (whole-word match)."""
    lowered = _neutralize(text)
    return any(re.search(rf"\b{re.escape(t)}\b", lowered) for t in FORBIDDEN_TOKENS)


def assert_no_verdict(text: str) -> None:
    """Raise ValueError if text contains forbidden verdict language."""
    lowered = _neutralize(text)
    for token in FORBIDDEN_TOKENS:
        if re.search(rf"\b{re.escape(token)}\b", lowered):
            raise ValueError(f"forbidden verdict token in output: {token!r}")

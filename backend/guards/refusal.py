"""Eligibility refusal (Member 4).

RealDoor stops at readiness. When a renter asks whether they are eligible /
approved / qualified, return the mandated safe refusal instead of any verdict
(handbook 13.4). Informational questions about the rules are NOT refused — those
go to the rules service to be grounded and cited.
"""
from __future__ import annotations

import re

SAFE_REFUSAL = (
    "RealDoor cannot determine eligibility. It can show the published rule, the "
    "information you confirmed, and the deterministic calculation. A qualified "
    "housing professional makes the final decision."
)

DISCLAIMER = "This comparison does not determine eligibility."

# Personal-verdict phrasings ("am I ...", "do I ...") — NOT informational
# questions like "what are the eligibility rules?" (those stay groundable).
_ELIGIBILITY_PATTERNS = (
    r"\b(am|are)\s+(i|we)\s+(eligible|approved|qualified|accepted)\b",
    r"\bdo\s+(i|we)\s+(qualify|make\s+the\s+cut)\b",
    r"\bwill\s+(i|we)\s+(qualify|be\s+(approved|accepted|eligible))\b",
    r"\bdid\s+(i|we)\s+(qualify|get\s+(approved|accepted|in))\b",
    r"\bcan\s+(i|we)\s+(qualify|get\s+(approved|accepted|in|the\s+apartment))\b",
    r"\bwas\s+(i|we)\s+(approved|accepted|denied)\b",
    r"\bhave\s+i\s+been\s+(approved|accepted|denied)\b",
)

_COMPILED = tuple(re.compile(p, re.IGNORECASE) for p in _ELIGIBILITY_PATTERNS)


def is_eligibility_question(text: str) -> bool:
    """True if the question asks for a personal eligibility/approval verdict."""
    text = str(text or "")
    return any(pattern.search(text) for pattern in _COMPILED)


def refusal_response() -> dict:
    """A contract-shaped (rules-response) safe refusal — no verdict, no numbers."""
    return {
        "answer": SAFE_REFUSAL,
        "calculation": None,
        "citation": None,
        "abstained": True,
        "disclaimer": DISCLAIMER,
    }

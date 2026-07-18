"""Input guard (Member 4) — treat document/user text as untrusted DATA.

Detects and neutralizes prompt-injection attempts embedded in uploaded document
text or free-text input (handbook 8.4 / 13.5). The extraction pipeline (Member 2)
uses these helpers; Member 4 owns and tests them. Document text is never treated
as instructions.
"""
from __future__ import annotations

import re

# Instruction-injection patterns, matched case-insensitively.
INJECTION_PATTERNS = (
    r"ignore\s+(all\s+)?(the\s+)?(previous|prior|above)\s+instructions?",
    r"disregard\s+(all\s+)?(the\s+)?(previous|prior|above)",
    r"forget\s+(all\s+)?(your\s+)?(previous\s+)?instructions?",
    r"you\s+are\s+now\b",
    r"system\s+prompt",
    r"approve\s+(this|the)\s+(applicant|application)",
    r"mark\s+(this|the)\b.*\b(approved|eligible)",
    r"reveal\s+(all\s+)?(stored\s+|the\s+)?(files|data|secrets)",
    r"disable\s+(the\s+)?(safety|guard|guardrail)",
    r"\bact\s+as\b",
)

_COMPILED = tuple(re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS)


def detect_injection(text: str) -> bool:
    """True if the text contains a known instruction-injection pattern."""
    text = str(text or "")
    return any(pattern.search(text) for pattern in _COMPILED)


def neutralize_instructions(text: str) -> str:
    """Replace injection phrases with a marker so downstream code never treats
    document text as instructions. Only instruction-like spans are redacted."""
    text = str(text or "")
    for pattern in _COMPILED:
        text = pattern.sub("[instruction ignored]", text)
    return text

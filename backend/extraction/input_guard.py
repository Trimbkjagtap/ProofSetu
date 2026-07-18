"""Input guard: treat all document text as untrusted, quoted data.

Document text is DATA, never instructions. This module detects common
prompt-injection patterns so we can emit a *content-free* safety event. It never
changes system behavior — the allowlist already restricts what leaves the
pipeline, so a malicious document can only ever yield allowlisted fields.
"""
from __future__ import annotations

import re

# Patterns are matched only to record that an injection attempt was seen.
# We do NOT act on them and we never log the matched text.
_INJECTION_PATTERNS = (
    r"ignore\s+(all\s+|the\s+|your\s+)?(previous|prior|above)\s+instructions",
    r"disregard\s+(all\s+|the\s+|your\s+)?(previous|prior)\s+instructions",
    r"approve\s+(this\s+)?(applicant|application)",
    r"mark\s+.{0,40}\bas\s+(approved|eligible|qualified)",
    r"reveal\s+(all\s+)?(stored\s+)?(files|data|secrets|documents)",
    r"system\s+prompt",
    r"you\s+are\s+now\b",
    r"\bact\s+as\b",
)
_COMPILED = tuple(re.compile(p, re.IGNORECASE) for p in _INJECTION_PATTERNS)


def detect_injection(text: str | None) -> bool:
    """Return True if the untrusted text contains a known injection pattern.

    The return value is a boolean only — the offending text is never surfaced.
    """
    if not text:
        return False
    return any(pattern.search(text) for pattern in _COMPILED)

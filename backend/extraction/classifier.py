"""Document router / classifier.

Selects exactly ONE allowlist schema from filename hints and OCR text keywords.
Defaults to pay_stub (the required P0 lane) when signals are weak.
"""
from __future__ import annotations

from .schemas import DocumentType

_KEYWORDS: dict[DocumentType, tuple[str, ...]] = {
    DocumentType.pay_stub: ("pay stub", "paystub", "pay period", "gross pay", "earnings"),
    DocumentType.government_id: ("driver", "license", "identification", "passport", "id card", "date of birth"),
    DocumentType.benefit_letter: ("benefit", "snap", "social security", "award letter", "assistance"),
    DocumentType.bank_statement: ("bank", "statement", "account", "balance", "deposit"),
}


def classify(filename: str | None, text: str | None) -> DocumentType:
    haystack = f"{filename or ''} {text or ''}".lower()
    best_type = DocumentType.pay_stub
    best_score = 0
    for doc_type, keywords in _KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in haystack)
        if score > best_score:
            best_score = score
            best_type = doc_type
    return best_type

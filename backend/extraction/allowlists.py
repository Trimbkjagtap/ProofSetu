"""Field allowlists per document type (data minimization).

Do not extract, infer, store, or display any field not in this allowlist.
Never store a full SSN or full government ID number — government_id exposes
`id_number_last4` only.
"""
from __future__ import annotations

from typing import Iterable, List

from .schemas import DocumentType, ExtractedField

ALLOWLISTS: dict[DocumentType, tuple[str, ...]] = {
    DocumentType.pay_stub: (
        "employer_name",
        "employee_name",
        "pay_period_start",
        "pay_period_end",
        "gross_pay",
        "pay_frequency",
    ),
    DocumentType.benefit_letter: (
        "issuer",
        "recipient_name",
        "benefit_type",
        "monthly_amount",
        "effective_date",
    ),
    DocumentType.bank_statement: (
        "institution",
        "account_holder",
        "period_start",
        "period_end",
        "ending_balance",
    ),
    DocumentType.government_id: (
        "full_name",
        "date_of_birth",  # only if allowed by the program
        "id_number_last4",  # NEVER the full ID number
        "expiration_date",
    ),
}


def allowlisted_fields(doc_type: DocumentType) -> tuple[str, ...]:
    return ALLOWLISTS[doc_type]


def is_allowlisted(doc_type: DocumentType, field_name: str) -> bool:
    return field_name in ALLOWLISTS[doc_type]


def filter_to_allowlist(
    doc_type: DocumentType, fields: Iterable[ExtractedField]
) -> List[ExtractedField]:
    """Drop any field not on the allowlist for this document type."""
    allowed = set(ALLOWLISTS[doc_type])
    return [f for f in fields if f.name in allowed]

"""Deterministic fixture adapter — the required fallback (P0).

Returns known, synthetic extraction responses with pre-recorded source boxes so
the frontend can render the full evidence/correction flow before any real OCR
exists, and so the demo stays stable if a vision/OCR provider is slow or errors.

All values are SYNTHETIC. No real PII. Government ID exposes last-4 only.
"""
from __future__ import annotations

from typing import Callable, List

from .schemas import (
    DocumentStatus,
    DocumentType,
    ExtractedField,
    ExtractionResponse,
    FieldState,
    SourceBox,
)


def _f(name, value, confidence, page, x, y, w, h) -> ExtractedField:
    state = FieldState.unconfirmed if (value is not None and confidence >= 0.5) else FieldState.please_check
    return ExtractedField(
        name=name,
        value=value,
        confidence=confidence,
        state=state,
        source_box=SourceBox(page=page, x=x, y=y, width=w, height=h),
    )


def _pay_stub_fields() -> List[ExtractedField]:
    # gross_pay value (2450) and its box match contracts/extraction-response.json.
    return [
        _f("employer_name", "Cambridge Community Services", 0.94, 1, 70, 120, 260, 28),
        _f("employee_name", "Jordan Rivera", 0.93, 1, 70, 160, 220, 28),
        _f("pay_period_start", "2026-04-01", 0.90, 1, 70, 210, 130, 24),
        _f("pay_period_end", "2026-04-15", 0.90, 1, 230, 210, 130, 24),
        _f("gross_pay", 2450, 0.82, 1, 410, 520, 150, 35),
        _f("pay_frequency", "biweekly", 0.88, 1, 70, 300, 140, 24),
    ]


def _government_id_fields() -> List[ExtractedField]:
    # expiration_date is in the past to drive the "expired ID" checklist demo.
    return [
        _f("full_name", "Jordan Rivera", 0.95, 1, 90, 140, 240, 30),
        _f("date_of_birth", "1990-06-12", 0.91, 1, 90, 190, 150, 24),
        _f("id_number_last4", "4821", 0.89, 1, 90, 240, 120, 24),  # last-4 only
        _f("expiration_date", "2024-02-10", 0.90, 1, 90, 290, 150, 24),
    ]


def _benefit_letter_fields() -> List[ExtractedField]:
    return [
        _f("issuer", "State Benefits Office", 0.92, 1, 70, 120, 240, 28),
        _f("recipient_name", "Jordan Rivera", 0.93, 1, 70, 170, 220, 28),
        _f("benefit_type", "SNAP", 0.88, 1, 70, 220, 160, 24),
        _f("monthly_amount", 480, 0.85, 1, 400, 220, 120, 30),
        _f("effective_date", "2026-01-01", 0.90, 1, 70, 270, 150, 24),
    ]


def _bank_statement_fields() -> List[ExtractedField]:
    return [
        _f("institution", "Riverbank Credit Union", 0.93, 1, 70, 120, 260, 28),
        _f("account_holder", "Jordan Rivera", 0.92, 1, 70, 170, 220, 28),
        _f("period_start", "2026-03-01", 0.90, 1, 70, 220, 130, 24),
        _f("period_end", "2026-03-31", 0.90, 1, 230, 220, 130, 24),
        _f("ending_balance", 1875, 0.86, 1, 400, 270, 130, 30),
    ]


_BUILDERS: dict[DocumentType, Callable[[], List[ExtractedField]]] = {
    DocumentType.pay_stub: _pay_stub_fields,
    DocumentType.government_id: _government_id_fields,
    DocumentType.benefit_letter: _benefit_letter_fields,
    DocumentType.bank_statement: _bank_statement_fields,
}


def build_fixture(doc_type: DocumentType, document_id: str) -> ExtractionResponse:
    """Fresh ExtractionResponse for a document type with pre-recorded evidence."""
    fields = _BUILDERS[doc_type]()
    return ExtractionResponse(
        document_id=document_id,
        document_type=doc_type,
        status=DocumentStatus.needs_confirmation,
        fields=fields,
    )

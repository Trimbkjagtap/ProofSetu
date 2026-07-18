"""Feature registry contribution for the extraction module.

Member 4 owns the canonical `GET /features` endpoint (no hidden proxies: every
extracted field is published with its purpose and retention). This module
provides the extraction half as content-free metadata — field names, purpose,
and retention only. No document values or PII are ever included here.
"""
from __future__ import annotations

from typing import List

from .allowlists import ALLOWLISTS

# All extracted fields are ephemeral and session-scoped.
RETENTION = "session-scoped; deleted on session delete or TTL expiry"

# Plain-language purpose per allowlisted field (renter-facing transparency).
_PURPOSE: dict[str, str] = {
    # pay_stub
    "employer_name": "Income source and identity",
    "employee_name": "Identity match for income",
    "pay_period_start": "Income recency check",
    "pay_period_end": "Income recency check",
    "gross_pay": "Deterministic income calculation",
    "pay_frequency": "Income annualization",
    # benefit_letter
    "issuer": "Benefit source",
    "recipient_name": "Identity match for benefit",
    "benefit_type": "Benefit classification",
    "monthly_amount": "Deterministic income calculation",
    "effective_date": "Benefit recency check",
    # bank_statement
    "institution": "Asset source",
    "account_holder": "Identity match for account",
    "period_start": "Statement recency check",
    "period_end": "Statement recency check",
    "ending_balance": "Asset value reference",
    # government_id
    "full_name": "Identity",
    "id_number_last4": "Identity reference (last 4 digits only; full number never stored)",
    "expiration_date": "Document validity check",
}


def feature_registry() -> List[dict]:
    """Content-free metadata for every field extraction can produce.

    Shape: [{"documentType", "field", "purpose", "retention"}, ...].
    Member 4 merges this into the canonical /features response.
    """
    registry: List[dict] = []
    for doc_type, field_names in ALLOWLISTS.items():
        for name in field_names:
            registry.append(
                {
                    "documentType": doc_type.value,
                    "field": name,
                    "purpose": _PURPOSE.get(name, "Application readiness"),
                    "retention": RETENTION,
                }
            )
    return registry

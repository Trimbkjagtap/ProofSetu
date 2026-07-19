"""Gold-checklist engine (Member 4).

Deterministic CONFIGURATION, not an LLM. Given a renter's confirmed profile and
an authored checklist, compute each item's status:
    present | missing | expiring | expired
plus a plain-language fixHint. Output matches contracts/checklist-response.json.
"""
from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path
from typing import Optional

_CONFIG_PATH = Path(__file__).resolve().parent / "gold_checklist.json"


def load_config() -> dict:
    with _CONFIG_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


def _parse_date(value) -> Optional[date]:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def _status_for(item: dict, doc: Optional[dict], today: date) -> tuple[str, str]:
    """Return (status, fixHint) for one authored item given its matching doc."""
    label = item["label"]
    if doc is None:
        return "missing", f"Upload {label.lower()}."

    validity = item.get("validity", {})

    # Identity documents: judged by expiration date.
    if validity.get("mustNotBeExpired"):
        expires = _parse_date(doc.get("expirationDate"))
        if expires is None:
            return "present", ""
        if expires < today:
            return "expired", f"Upload {label.lower()} that has not expired."
        warn_days = validity.get("expiringWithinDays", 30)
        if expires <= today + timedelta(days=warn_days):
            return "expiring", f"{label} expires soon — upload a current one before certification."
        return "present", ""

    # Income/asset documents: judged by recency (how old the document is).
    recency_days = validity.get("recencyDays")
    if recency_days:
        doc_date = _parse_date(doc.get("documentDate") or doc.get("effectiveDate"))
        if doc_date is None:
            return "present", ""
        age = (today - doc_date).days
        if age > recency_days:
            return "expired", f"Upload a more recent {label.lower()} (dated within {recency_days} days)."
        warn_after = recency_days - validity.get("expiringWarnDays", 30)
        if age > warn_after:
            return "expiring", f"Your {label.lower()} is getting old — a newer one may be needed before certification."
        return "present", ""

    return "present", ""


def evaluate_checklist(
    profile: dict,
    today: Optional[date] = None,
    config: Optional[dict] = None,
) -> dict:
    """Return the checklist-response contract for a confirmed profile."""
    today = today or date.today()
    config = config or load_config()

    docs_by_type = {d.get("documentType"): d for d in profile.get("documents", [])}
    items = []

    for item in config.get("items", []):
        doc = docs_by_type.get(item["documentType"])
        # Skip optional documents the renter simply hasn't provided.
        if doc is None and not item.get("required", False):
            continue
        status, fix_hint = _status_for(item, doc, today)
        items.append(
            {
                "documentType": item["documentType"],
                "label": item["label"],
                "required": bool(item.get("required", False)),
                "status": status,
                "fixHint": fix_hint,
            }
        )

    # Display-only certifications (no extraction pipeline; shown when required).
    provided = set(profile.get("providedDisplayItems", []))
    for item in config.get("displayOnly", []):
        present = item["documentType"] in provided
        if not present and not item.get("required", False):
            continue
        items.append(
            {
                "documentType": item["documentType"],
                "label": item["label"],
                "required": bool(item.get("required", False)),
                "status": "present" if present else "missing",
                "fixHint": "" if present else f"Provide the {item['label'].lower()}.",
            }
        )

    return {"items": items}


# Maps each allowlisted field name to the document type it belongs to, so a flat
# confirmed profile can be turned into a documents-with-dates view.
_FIELD_TO_DOCTYPE = {
    "employer_name": "pay_stub", "employee_name": "pay_stub",
    "pay_period_start": "pay_stub", "pay_period_end": "pay_stub",
    "gross_pay": "pay_stub", "pay_frequency": "pay_stub",
    "full_name": "government_id", "id_number_last4": "government_id",
    "expiration_date": "government_id", "date_of_birth": "government_id",
    "institution": "bank_statement", "account_holder": "bank_statement",
    "period_start": "bank_statement", "period_end": "bank_statement",
    "ending_balance": "bank_statement",
    "issuer": "benefit_letter", "recipient_name": "benefit_letter",
    "benefit_type": "benefit_letter", "monthly_amount": "benefit_letter",
    "effective_date": "benefit_letter",
}

# The validity date each document type is judged by: (engine key, source field).
_DOC_DATE = {
    "government_id": ("expirationDate", "expiration_date"),
    "pay_stub": ("documentDate", "pay_period_end"),
    "bank_statement": ("documentDate", "period_end"),
    "benefit_letter": ("effectiveDate", "effective_date"),
}


def profile_from_confirmed_fields(fields: list) -> dict:
    """Turn a flat confirmed-profile field list into a documents-with-dates profile
    the checklist can evaluate. A document type is present once any of its fields is
    confirmed; its validity date is read from the relevant confirmed field.
    """
    by_name = {f.get("name"): f.get("value") for f in (fields or [])}
    present_types = {
        _FIELD_TO_DOCTYPE[f["name"]]
        for f in (fields or [])
        if f.get("name") in _FIELD_TO_DOCTYPE
    }
    documents = []
    for doc_type in present_types:
        doc = {"documentType": doc_type}
        out_key, src_field = _DOC_DATE.get(doc_type, (None, None))
        if out_key and by_name.get(src_field):
            doc[out_key] = by_name[src_field]
        documents.append(doc)
    return {"documents": documents, "providedDisplayItems": []}


def demo_profile(today: Optional[date] = None) -> dict:
    """A synthetic confirmed profile that reproduces the acceptance demo:
    a recent pay stub (present), an expired ID (expired), no bank statement
    (missing), and an outstanding income certification (missing). Used until
    live extraction + a confirmed profile are wired in.
    """
    today = today or date.today()
    return {
        "documents": [
            {"documentType": "pay_stub", "documentDate": (today - timedelta(days=20)).isoformat()},
            {"documentType": "government_id", "expirationDate": (today - timedelta(days=200)).isoformat()},
        ],
        "providedDisplayItems": [],
    }

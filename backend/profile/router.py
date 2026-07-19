"""GET /profile — return the renter's CONFIRMED profile only (Member 4).

Until PATCH /documents/{doc_id}/fields is wired (Member 2 + 4), a session with no
stored profile falls back to a demo confirmed profile so the frontend has data to
render. Never returns unconfirmed/please_check fields.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query

from backend.profile.store import profile_store

router = APIRouter(tags=["profile"])


def _demo_confirmed_fields() -> list[dict]:
    return [
        {"name": "employee_name", "value": "Jordan Rivera", "state": "confirmed"},
        {"name": "gross_pay", "value": 2650, "state": "corrected"},
        {"name": "pay_frequency", "value": "monthly", "state": "confirmed"},
        {"name": "full_name", "value": "Jordan Rivera", "state": "confirmed"},
        {"name": "id_number_last4", "value": "4821", "state": "confirmed"},
    ]


@router.get("/profile")
def get_profile(session_id: Optional[str] = Query(None)) -> dict:
    fields = None
    if session_id:
        fields = profile_store.get_profile(session_id)
    if not fields:
        # TODO(integration): remove the demo fallback once PATCH populates profiles.
        fields = _demo_confirmed_fields()
    return {
        "sessionId": session_id,
        "confirmedFieldsOnly": True,
        # household size is renter-entered on the frontend, not stored server-side.
        "householdSize": 0,
        "fields": fields,  # kept for backward compatibility
        # `confirmedFields` matches the frontend's ProfileResponse shape.
        "confirmedFields": [
            {
                "documentId": f.get("documentId", ""),
                "name": f.get("name"),
                "value": f.get("value"),
                "state": f.get("state"),
            }
            for f in fields
        ],
    }

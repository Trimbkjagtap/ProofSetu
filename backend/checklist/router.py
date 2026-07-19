"""GET /checklist — authored gold checklist with deterministic statuses (Member 4).

Evaluates the renter's CONFIRMED session profile when a session_id is given;
falls back to the demo profile otherwise so the endpoint always returns something.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from backend.checklist.engine import (
    demo_profile,
    evaluate_checklist,
    profile_from_confirmed_fields,
)
from backend.profile.store import profile_store

router = APIRouter(tags=["checklist"])


@router.get("/checklist")
def get_checklist(
    program: str = Query("lihtc"),
    session_id: Optional[str] = Query(None),
) -> dict:
    if program != "lihtc":
        raise HTTPException(status_code=404, detail="Only the 'lihtc' program is supported.")
    today = date.today()

    profile = None
    if session_id:
        confirmed = profile_store.get_profile(session_id)
        if confirmed:
            profile = profile_from_confirmed_fields(confirmed)

    # No session / no confirmed data yet -> demo profile so the UI still renders.
    if profile is None:
        profile = demo_profile(today)

    return evaluate_checklist(profile, today=today)

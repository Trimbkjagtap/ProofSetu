"""GET /checklist — authored gold checklist with deterministic statuses (Member 4)."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException, Query

from backend.checklist.engine import demo_profile, evaluate_checklist

router = APIRouter(tags=["checklist"])


@router.get("/checklist")
def get_checklist(program: str = Query("lihtc")) -> dict:
    if program != "lihtc":
        raise HTTPException(status_code=404, detail="Only the 'lihtc' program is supported.")
    today = date.today()
    # TODO(integration): when a confirmed profile exists for the session, evaluate
    # against it (GET /profile). Until extraction + profile are wired, use the demo
    # profile so the endpoint returns the demo's missing/expired items.
    profile = demo_profile(today)
    return evaluate_checklist(profile, today=today)

"""FastAPI router for POST /rules/query (Member 3).

Member 4 mounts this in backend/main.py with:

    from backend.rules.router import router as rules_router
    app.include_router(rules_router)

The router is a thin adapter: it validates the request and delegates to
backend.rules.service.answer_rule_query, which returns the exact
contracts/rules-response.json shape. All logic lives in service.py so it stays
unit-testable without FastAPI installed.
"""

from __future__ import annotations

from pydantic import BaseModel  # provided by backend deps (Member 4 env)
from fastapi import APIRouter

from .service import answer_rule_query

router = APIRouter(prefix="/rules", tags=["rules"])


class ConfirmedIncome(BaseModel):
    amount: float
    frequency: str


class RuleQuery(BaseModel):
    question: str
    confirmedIncome: ConfirmedIncome | None = None
    metro: str | None = None
    householdSize: int | None = None
    amiPct: int = 50
    year: int = 2026


@router.post("/query")
def rules_query(body: RuleQuery):
    confirmed = None
    if body.confirmedIncome is not None:
        confirmed = {
            "amount": body.confirmedIncome.amount,
            "frequency": body.confirmedIncome.frequency,
        }
    result = answer_rule_query(
        question=body.question,
        confirmed_income=confirmed,
        metro=body.metro,
        household_size=body.householdSize,
        ami_pct=body.amiPct,
        year=body.year,
    )
    # Drop internal-only keys before returning.
    result.pop("_reason", None)
    return result

"""GET /features — feature registry (Member 4).

Publishes every field the system may extract, why it is used, and how long it is
kept. This is the "no hidden proxies" transparency control (handbook 10.4).
"""
from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter

from backend.config import settings

router = APIRouter(tags=["features"])

_REGISTRY_PATH = Path(__file__).resolve().parent / "features.json"


def _load_registry() -> dict:
    with _REGISTRY_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


@router.get("/features")
def get_features() -> dict:
    data = _load_registry()
    return {
        "sessionTtlSeconds": settings.SESSION_TTL_SECONDS,
        "retention": data["retention"],
        "deleteControl": data["deleteControl"],
        "features": data["features"],
    }

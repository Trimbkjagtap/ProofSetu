"""FastAPI router for the extraction endpoints.

Member 4 mounts this router in backend/main.py (see docs/handoffs/member-2.md).
This module never edits main.py; it only exposes `router`.

    POST  /documents                     upload + classify + extract
    PATCH /documents/{doc_id}/fields     confirm/correct a field (Member 2 + 4)
    GET   /extraction/health             liveness for this module
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse

from .errors import ExtractionError
from .features import feature_registry
from .schemas import FieldCorrection
from .service import service

# Soft dependency on Member 4's confirmed-profile store. When the backend app is
# assembled (main.py), PATCH confirmations flow into the same profile_store that
# GET /profile reads. Absent (standalone dev), extraction still works.
try:  # pragma: no cover - exercised only when the full backend is present
    from backend.profile.store import profile_store
except Exception:  # pragma: no cover
    profile_store = None

router = APIRouter(tags=["extraction"])


@router.get("/extraction/health")
def health() -> dict:
    return {"status": "ok", "module": "extraction"}


@router.get("/extraction/features")
def features() -> dict:
    """Extraction's content-free field metadata for Member 4's /features registry."""
    return {"features": feature_registry()}


@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
) -> JSONResponse:
    content = await file.read()
    try:
        response = service.extract(file.filename, content, file.content_type, session_id)
    except ExtractionError as exc:
        return JSONResponse(status_code=exc.status_code, content=exc.to_wire())
    return JSONResponse(status_code=201, content=response.to_wire())


@router.patch("/documents/{doc_id}/fields")
def patch_field(doc_id: str, correction: FieldCorrection) -> JSONResponse:
    try:
        response = service.confirm_field(doc_id, correction)
    except ExtractionError as exc:
        return JSONResponse(status_code=exc.status_code, content=exc.to_wire())

    # Integration (Member 2 + 4): push the renter-verified field into the shared
    # profile store so GET /profile returns confirmed values for this session.
    session_id = service.session_for(doc_id)
    if profile_store is not None and session_id:
        field = next((f for f in response.fields if f.name == correction.name), None)
        if field is not None:
            profile_store.upsert_field(
                session_id,
                {"name": field.name, "value": field.value, "state": field.state.value},
            )

    body = response.to_wire()
    body["derivedStale"] = service.is_stale(doc_id)  # signal to recompute downstream
    return JSONResponse(status_code=200, content=body)

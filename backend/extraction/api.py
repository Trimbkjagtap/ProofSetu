"""FastAPI router for the extraction endpoints.

Member 4 mounts this router in backend/main.py (see docs/handoffs/member-2.md).
This module never edits main.py; it only exposes `router`.

    POST  /documents                     upload + classify + extract
    PATCH /documents/{doc_id}/fields     confirm/correct a field (Member 2 + 4)
    GET   /extraction/health             liveness for this module
"""
from __future__ import annotations

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse

from .errors import ExtractionError
from .features import feature_registry
from .schemas import FieldCorrection
from .service import service

router = APIRouter(tags=["extraction"])


@router.get("/extraction/health")
def health() -> dict:
    return {"status": "ok", "module": "extraction"}


@router.get("/extraction/features")
def features() -> dict:
    """Extraction's content-free field metadata for Member 4's /features registry."""
    return {"features": feature_registry()}


@router.post("/documents")
async def upload_document(file: UploadFile = File(...)) -> JSONResponse:
    content = await file.read()
    try:
        response = service.extract(file.filename, content, file.content_type)
    except ExtractionError as exc:
        return JSONResponse(status_code=exc.status_code, content=exc.to_wire())
    return JSONResponse(status_code=201, content=response.to_wire())


@router.patch("/documents/{doc_id}/fields")
def patch_field(doc_id: str, correction: FieldCorrection) -> JSONResponse:
    try:
        response = service.confirm_field(doc_id, correction)
    except ExtractionError as exc:
        return JSONResponse(status_code=exc.status_code, content=exc.to_wire())
    body = response.to_wire()
    body["derivedStale"] = service.is_stale(doc_id)  # signal to recompute downstream
    return JSONResponse(status_code=200, content=body)

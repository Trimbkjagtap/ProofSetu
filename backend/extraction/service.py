"""ExtractionService — orchestrates the pipeline.

upload -> file validation -> input guard -> OCR words/coordinates
      -> document classifier -> type allowlist -> field mapper
      -> confidence + source box -> unconfirmed response
      -> renter correction/confirmation -> confirmed profile

Fixture-first: when OCR_PROVIDER is `fixture`/`textract` (no local provider) or a
real provider fails, the deterministic fixture is returned. A confirmed
correction marks the document's derived results stale for downstream members.
"""
from __future__ import annotations

import logging
import os
import uuid
from typing import Dict

from . import fixtures
from .allowlists import filter_to_allowlist
from .classifier import classify
from .errors import ExtractionError
from .input_guard import detect_injection
from .mapper import map_fields
from .ocr import OcrUnavailable, get_ocr_provider
from .schemas import (
    DocumentStatus,
    ExtractedField,
    ExtractionResponse,
    FieldCorrection,
    FieldState,
)
from .validation import validate_upload

logger = logging.getLogger("extraction")


class ExtractionService:
    def __init__(self, ocr_provider_name: str | None = None) -> None:
        self._ocr_provider_name = ocr_provider_name or os.getenv("OCR_PROVIDER", "fixture")
        # In-memory doc store for the dev/integration PATCH flow. Session-scoped
        # persistence is Member 4's store adapter; this is a local fallback only.
        self._docs: Dict[str, ExtractionResponse] = {}
        self._stale: Dict[str, bool] = {}

    # -- POST /documents -------------------------------------------------
    def extract(
        self, filename: str | None, content: bytes, content_type: str | None
    ) -> ExtractionResponse:
        validate_upload(filename, content_type, content)

        document_id = f"doc_{uuid.uuid4().hex[:8]}"
        provider = get_ocr_provider(self._ocr_provider_name)

        if provider is None:
            response = self._extract_via_fixture(filename, document_id)
        else:
            try:
                response = self._extract_via_ocr(provider, filename, content, content_type, document_id)
            except OcrUnavailable:
                # Graceful OCR error -> deterministic fixture fallback.
                logger.warning("ocr_unavailable provider=%s doc=%s (using fixture)", provider.name, document_id)
                response = self._extract_via_fixture(filename, document_id)

        self._docs[document_id] = response
        self._stale[document_id] = False
        return response

    def _extract_via_fixture(self, filename: str | None, document_id: str) -> ExtractionResponse:
        doc_type = classify(filename, None)
        return fixtures.build_fixture(doc_type, document_id)

    def _extract_via_ocr(
        self, provider, filename, content, content_type, document_id
    ) -> ExtractionResponse:
        ocr = provider.extract_words(content, content_type or "")

        # Input guard: text is untrusted data. Record a content-free event only.
        if detect_injection(ocr.text):
            logger.warning("prompt_injection_detected doc=%s (ignored)", document_id)

        doc_type = classify(filename, ocr.text)
        fields = map_fields(doc_type, ocr)
        fields = filter_to_allowlist(doc_type, fields)  # defense in depth
        return ExtractionResponse(
            document_id=document_id,
            document_type=doc_type,
            status=DocumentStatus.needs_confirmation,
            fields=fields,
        )

    # -- PATCH /documents/{doc_id}/fields (Member 2 + 4 integration) -----
    def confirm_field(self, document_id: str, correction: FieldCorrection) -> ExtractionResponse:
        doc = self._docs.get(document_id)
        if doc is None:
            raise ExtractionError("document_not_found", "Unknown document id.", status_code=404)

        target: ExtractedField | None = next((f for f in doc.fields if f.name == correction.name), None)
        if target is None:
            raise ExtractionError("field_not_found", "Field not on this document.", status_code=404)

        if correction.action == "correct":
            target.value = correction.value
            target.state = FieldState.corrected
        else:
            target.state = FieldState.confirmed

        # Confirming/correcting a value invalidates downstream calculations.
        self._stale[document_id] = True

        if all(f.state in (FieldState.confirmed, FieldState.corrected) for f in doc.fields):
            doc.status = DocumentStatus.confirmed
        return doc

    def is_stale(self, document_id: str) -> bool:
        """True when a confirmation/correction means downstream results are stale."""
        return self._stale.get(document_id, False)

    def get_document(self, document_id: str) -> ExtractionResponse | None:
        return self._docs.get(document_id)


# Module-level singleton for the router/dev app.
service = ExtractionService()

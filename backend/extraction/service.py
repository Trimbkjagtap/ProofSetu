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
    def __init__(self, ocr_provider_name: str | None = None, ocr_provider=None) -> None:
        self._ocr_provider_name = ocr_provider_name or os.getenv("OCR_PROVIDER", "fixture")
        # Optional injected provider (used by tests to exercise the OCR path
        # without the Tesseract binary). Overrides OCR_PROVIDER when set.
        self._ocr_provider_override = ocr_provider
        # In-memory doc store for the dev/integration PATCH flow. Session-scoped
        # persistence is Member 4's store adapter; this is a local fallback only.
        self._docs: Dict[str, ExtractionResponse] = {}
        self._stale: Dict[str, bool] = {}
        # doc_id -> session_id, so PATCH can route confirmed fields to the
        # session's profile (Member 4's profile_store).
        self._doc_session: Dict[str, str] = {}
        # Content-free safety events (no document text ever stored here).
        self._safety_events: list[dict] = []

    # -- POST /documents -------------------------------------------------
    def extract(
        self,
        filename: str | None,
        content: bytes,
        content_type: str | None,
        session_id: str | None = None,
    ) -> ExtractionResponse:
        validate_upload(filename, content_type, content)

        document_id = f"doc_{uuid.uuid4().hex[:8]}"
        if session_id:
            self._doc_session[document_id] = session_id
        provider = self._ocr_provider_override or get_ocr_provider(self._ocr_provider_name)

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

        # Input guard: text is untrusted data. Record a content-free event only;
        # the offending text is never logged or stored. Behavior does not change.
        if detect_injection(ocr.text):
            self._record_safety_event(document_id, "prompt_injection")

        doc_type = classify(filename, ocr.text)
        fields = map_fields(doc_type, ocr)
        fields = filter_to_allowlist(doc_type, fields)  # defense in depth

        # Defense in depth: never let injection-like text ride out as a
        # confirmable value. Flag it for the renter instead of trusting it.
        for f in fields:
            if isinstance(f.value, str) and detect_injection(f.value):
                f.value = None
                f.state = FieldState.please_check
                self._record_safety_event(document_id, "suspicious_field_value")

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

    def session_for(self, document_id: str) -> str | None:
        return self._doc_session.get(document_id)

    def confirmed_fields(self, document_id: str) -> list[ExtractedField]:
        """Return only renter-verified fields (confirmed or corrected).

        Helper for Member 4's GET /profile, which returns the confirmed profile
        only. Unconfirmed/please_check fields are excluded.
        """
        doc = self._docs.get(document_id)
        if doc is None:
            return []
        return [
            f for f in doc.fields
            if f.state in (FieldState.confirmed, FieldState.corrected)
        ]

    # -- content-free safety events --------------------------------------
    def _record_safety_event(self, document_id: str, event_type: str) -> None:
        # Store ONLY the document id and event type — never the offending text.
        self._safety_events.append({"documentId": document_id, "type": event_type})
        logger.warning("safety_event type=%s doc=%s", event_type, document_id)

    def safety_events(self) -> list[dict]:
        """Content-free safety events for the audit trail (no document text)."""
        return list(self._safety_events)

    def injection_detected(self, document_id: str) -> bool:
        return any(
            e["documentId"] == document_id and e["type"] == "prompt_injection"
            for e in self._safety_events
        )


# Module-level singleton for the router/dev app.
service = ExtractionService()

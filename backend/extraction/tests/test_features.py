"""Integration-helper tests: feature registry + confirmed-profile helper."""
from __future__ import annotations

import json

from fastapi.testclient import TestClient

from backend.extraction.allowlists import ALLOWLISTS
from backend.extraction.dev_app import app
from backend.extraction.features import feature_registry
from backend.extraction.schemas import FieldCorrection, FieldState
from backend.extraction.service import ExtractionService

client = TestClient(app)


def test_feature_registry_covers_every_allowlisted_field():
    registry = feature_registry()
    pairs = {(e["documentType"], e["field"]) for e in registry}
    for doc_type, fields in ALLOWLISTS.items():
        for name in fields:
            assert (doc_type.value, name) in pairs


def test_feature_registry_entries_have_purpose_and_retention():
    for entry in feature_registry():
        assert entry["purpose"].strip()
        assert entry["retention"].strip()


def test_feature_registry_is_content_free():
    # Metadata only — no document values / PII should ever appear here.
    blob = json.dumps(feature_registry()).lower()
    assert "jordan" not in blob
    assert "2450" not in blob


def test_id_number_purpose_states_last4_only():
    entry = next(e for e in feature_registry() if e["field"] == "id_number_last4")
    assert "last 4" in entry["purpose"].lower()


def test_features_endpoint():
    r = client.get("/extraction/features")
    assert r.status_code == 200
    assert len(r.json()["features"]) == sum(len(v) for v in ALLOWLISTS.values())


def test_confirmed_fields_returns_only_verified():
    svc = ExtractionService(ocr_provider_name="fixture")
    resp = svc.extract("paystub.pdf", b"%PDF-1.4 fake", "application/pdf")
    doc_id = resp.document_id

    # Nothing confirmed yet.
    assert svc.confirmed_fields(doc_id) == []

    svc.confirm_field(doc_id, FieldCorrection(name="gross_pay", action="correct", value=2650))
    svc.confirm_field(doc_id, FieldCorrection(name="employer_name", action="confirm"))

    confirmed = {f.name: f for f in svc.confirmed_fields(doc_id)}
    assert set(confirmed) == {"gross_pay", "employer_name"}
    assert confirmed["gross_pay"].state == FieldState.corrected
    assert confirmed["employer_name"].state == FieldState.confirmed


def test_confirmed_fields_unknown_doc_is_empty():
    svc = ExtractionService(ocr_provider_name="fixture")
    assert svc.confirmed_fields("doc_missing") == []

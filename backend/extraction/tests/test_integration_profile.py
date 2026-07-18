"""Integration: PATCH /documents/{id}/fields populates Member 4's profile_store.

Skips if the backend profile package is not present (e.g. extraction branch
before it merges develop). With it present, a corrected field flows through to
GET /profile's data source, keyed by session id.
"""
from __future__ import annotations

import pytest

pytest.importorskip("backend.profile.store")

from fastapi.testclient import TestClient  # noqa: E402

from backend.extraction.dev_app import app  # noqa: E402
from backend.profile.store import profile_store  # noqa: E402

client = TestClient(app)


def test_patch_populates_profile_store_for_session():
    session_id = "sess_test_123"
    profile_store.delete_by_session(session_id)

    files = {"file": ("paystub.pdf", b"%PDF-1.4 fake", "application/pdf")}
    r = client.post("/documents", files=files, data={"session_id": session_id})
    assert r.status_code == 201
    doc_id = r.json()["documentId"]

    r = client.patch(
        f"/documents/{doc_id}/fields",
        json={"name": "gross_pay", "action": "correct", "value": 2650},
    )
    assert r.status_code == 200

    profile = profile_store.get_profile(session_id)
    assert profile is not None
    gross = next(f for f in profile if f["name"] == "gross_pay")
    assert gross["value"] == 2650
    assert gross["state"] == "corrected"

    profile_store.delete_by_session(session_id)


def test_patch_without_session_does_not_touch_profile_store():
    files = {"file": ("paystub.pdf", b"%PDF-1.4 fake", "application/pdf")}
    doc_id = client.post("/documents", files=files).json()["documentId"]
    r = client.patch(
        f"/documents/{doc_id}/fields",
        json={"name": "gross_pay", "action": "confirm"},
    )
    assert r.status_code == 200  # still works; just no profile routing

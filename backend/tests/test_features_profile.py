from fastapi.testclient import TestClient

from backend.main import app
from backend.profile.store import profile_store

client = TestClient(app)


# --- GET /features (feature registry / transparency) ---
def test_features_lists_fields_with_purpose_and_retention():
    body = client.get("/features").json()
    assert body["features"], "registry should list fields"
    for f in body["features"]:
        assert {"name", "documentType", "purpose", "retention"} <= set(f.keys())
    assert "retention" in body and "deleteControl" in body


def test_features_enforce_data_minimization():
    names = {f["name"] for f in client.get("/features").json()["features"]}
    # Never publish full identifiers or DOB.
    assert "date_of_birth" not in names
    assert "ssn" not in names
    assert "id_number" not in names  # only id_number_last4 is allowed
    assert "id_number_last4" in names


def test_features_delete_control_points_to_session_delete():
    body = client.get("/features").json()
    assert body["deleteControl"]["method"] == "DELETE"
    assert "/session/" in body["deleteControl"]["path"]


# --- GET /profile ---
def test_profile_returns_confirmed_fields_only():
    body = client.get("/profile").json()
    assert body["confirmedFieldsOnly"] is True
    assert all(f.get("state") in ("confirmed", "corrected") for f in body["fields"])


def test_profile_reflects_stored_session_profile():
    session_id = client.post("/session").json()["sessionId"]
    profile_store.set_profile(
        session_id, [{"name": "full_name", "value": "Jordan", "state": "confirmed"}]
    )
    body = client.get(f"/profile?session_id={session_id}").json()
    assert [f["name"] for f in body["fields"]] == ["full_name"]


def test_profile_store_drops_unconfirmed_on_set():
    session_id = "sess_test_profile"
    profile_store.set_profile(
        session_id,
        [
            {"name": "a", "value": 1, "state": "confirmed"},
            {"name": "b", "value": 2, "state": "unconfirmed"},
        ],
    )
    assert [f["name"] for f in profile_store.get_profile(session_id)] == ["a"]


def test_profile_flushed_on_session_delete():
    session_id = client.post("/session").json()["sessionId"]
    profile_store.set_profile(
        session_id, [{"name": "full_name", "value": "Jordan", "state": "confirmed"}]
    )
    client.delete(f"/session/{session_id}")
    assert profile_store.get_profile(session_id) is None

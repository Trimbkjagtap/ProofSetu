from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_create_session_returns_id_and_ttl():
    response = client.post("/session")
    assert response.status_code == 200
    body = response.json()
    assert body["sessionId"].startswith("sess_")
    assert body["consent"] is True
    assert body["ttlSeconds"] > 0
    assert "expiresAt" in body


def test_delete_session_removes_it():
    created = client.post("/session").json()
    session_id = created["sessionId"]

    deleted = client.delete(f"/session/{session_id}")
    assert deleted.status_code == 200
    assert deleted.json() == {"status": "deleted", "sessionId": session_id}


def test_delete_unknown_session_returns_404():
    response = client.delete("/session/sess_does_not_exist")
    assert response.status_code == 404

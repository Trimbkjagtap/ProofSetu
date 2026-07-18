from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_cors_allows_any_vercel_origin():
    r = client.get("/health", headers={"Origin": "https://proofsetu-abc123.vercel.app"})
    assert r.headers.get("access-control-allow-origin") == "https://proofsetu-abc123.vercel.app"


def test_cors_allows_localhost_dev():
    r = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_does_not_allow_unknown_origin():
    r = client.get("/health", headers={"Origin": "https://evil.example.com"})
    assert r.headers.get("access-control-allow-origin") is None

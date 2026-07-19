from datetime import date, timedelta

from fastapi.testclient import TestClient

from backend.checklist.engine import evaluate_checklist
from backend.main import app

client = TestClient(app)

TODAY = date(2026, 7, 18)
ALLOWED_STATUSES = {"present", "missing", "expiring", "expired"}


def _profile():
    return {
        "documents": [
            {"documentType": "pay_stub", "documentDate": (TODAY - timedelta(days=10)).isoformat()},
            {"documentType": "government_id", "expirationDate": (TODAY - timedelta(days=30)).isoformat()},
        ],
        "providedDisplayItems": [],
    }


def _by_type(result):
    return {i["documentType"]: i for i in result["items"]}


def test_expired_id_and_missing_bank_statement():
    items = _by_type(evaluate_checklist(_profile(), today=TODAY))
    assert items["government_id"]["status"] == "expired"
    assert items["bank_statement"]["status"] == "missing"
    assert items["pay_stub"]["status"] == "present"


def test_expiring_id_within_window():
    profile = {"documents": [
        {"documentType": "government_id", "expirationDate": (TODAY + timedelta(days=10)).isoformat()},
    ]}
    items = _by_type(evaluate_checklist(profile, today=TODAY))
    assert items["government_id"]["status"] == "expiring"


def test_stale_pay_stub_is_expired():
    profile = {"documents": [
        {"documentType": "pay_stub", "documentDate": (TODAY - timedelta(days=200)).isoformat()},
    ]}
    items = _by_type(evaluate_checklist(profile, today=TODAY))
    assert items["pay_stub"]["status"] == "expired"


def test_items_have_exact_contract_keys_and_valid_status():
    result = evaluate_checklist(_profile(), today=TODAY)
    for item in result["items"]:
        assert set(item.keys()) == {"documentType", "label", "required", "status", "fixHint"}
        assert item["status"] in ALLOWED_STATUSES


def test_endpoint_returns_checklist():
    response = client.get("/checklist?program=lihtc")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body and len(body["items"]) > 0


def test_endpoint_rejects_unknown_program():
    response = client.get("/checklist?program=section8")
    assert response.status_code == 404

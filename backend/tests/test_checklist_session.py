from datetime import date, timedelta

from fastapi.testclient import TestClient

from backend.checklist.engine import profile_from_confirmed_fields
from backend.main import app
from backend.profile.store import profile_store

client = TestClient(app)
TODAY = date.today()


def test_profile_from_confirmed_fields_maps_docs_and_dates():
    fields = [
        {"name": "gross_pay", "value": 2650, "state": "corrected"},
        {"name": "pay_period_end", "value": "2026-06-30", "state": "confirmed"},
        {"name": "expiration_date", "value": "2024-02-10", "state": "confirmed"},
    ]
    docs = {d["documentType"]: d for d in profile_from_confirmed_fields(fields)["documents"]}
    assert docs["pay_stub"]["documentDate"] == "2026-06-30"
    assert docs["government_id"]["expirationDate"] == "2024-02-10"
    assert "bank_statement" not in docs  # no bank fields confirmed


def test_checklist_reflects_session_confirmed_documents():
    session_id = client.post("/session").json()["sessionId"]
    profile_store.set_profile(
        session_id,
        [
            {"name": "pay_period_end", "value": (TODAY - timedelta(days=10)).isoformat(), "state": "confirmed"},
            {"name": "expiration_date", "value": "2024-02-10", "state": "confirmed"},  # expired
        ],
    )
    items = {
        i["documentType"]: i["status"]
        for i in client.get(f"/checklist?program=lihtc&session_id={session_id}").json()["items"]
    }
    assert items["pay_stub"] == "present"        # recent
    assert items["government_id"] == "expired"   # past expiration
    assert items["bank_statement"] == "missing"  # required, not uploaded


def test_checklist_without_session_falls_back_to_demo():
    items = {
        i["documentType"]: i["status"]
        for i in client.get("/checklist?program=lihtc").json()["items"]
    }
    assert items["government_id"] == "expired"
    assert items["bank_statement"] == "missing"

from fastapi.testclient import TestClient

from backend.packet.assembler import confirmed_only
from backend.main import app

client = TestClient(app)


def test_confirmed_only_drops_unconfirmed():
    fields = [
        {"name": "a", "value": 1, "state": "confirmed"},
        {"name": "b", "value": 2, "state": "corrected"},
        {"name": "c", "value": 3, "state": "unconfirmed"},
        {"name": "d", "value": 4, "state": "please_check"},
    ]
    kept = {f["name"] for f in confirmed_only(fields)}
    assert kept == {"a", "b"}


def test_create_packet_returns_contract_shape():
    resp = client.post("/packet")
    assert resp.status_code == 200
    body = resp.json()
    assert body["packetId"].startswith("packet_")
    assert body["status"] == "ready_for_preview"
    assert body["confirmedFieldsOnly"] is True
    assert body["includedDocuments"] == ["pay_stub", "government_id"]
    assert body["downloadUrl"] == f"/packet/{body['packetId']}/pdf"


def test_packet_preview_has_confirmed_fields_only():
    packet_id = client.post("/packet").json()["packetId"]
    preview = client.get(f"/packet/{packet_id}").json()
    names = {f["name"] for f in preview["fields"]}
    assert "employee_name" in names
    assert "ocr_raw_text" not in names  # unconfirmed field was dropped


def test_pdf_download_and_status_becomes_downloaded():
    packet_id = client.post("/packet").json()["packetId"]
    pdf = client.get(f"/packet/{packet_id}/pdf")
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert pdf.content[:4] == b"%PDF"
    assert client.get(f"/packet/{packet_id}").json()["status"] == "downloaded"


def test_html_fallback_is_accessible_and_safe():
    packet_id = client.post("/packet").json()["packetId"]
    html = client.get(f"/packet/{packet_id}/html")
    assert html.status_code == 200
    assert "<h1>" in html.text
    assert "renter-controlled" in html.text


def test_unknown_packet_pdf_404():
    assert client.get("/packet/packet_missing/pdf").status_code == 404


def test_session_delete_flushes_packet():
    session_id = client.post("/session").json()["sessionId"]
    packet_id = client.post(
        "/packet",
        json={
            "sessionId": session_id,
            "fields": [{"name": "full_name", "value": "Jordan Rivera", "state": "confirmed"}],
            "includedDocuments": ["government_id"],
        },
    ).json()["packetId"]
    assert client.get(f"/packet/{packet_id}").status_code == 200

    client.delete(f"/session/{session_id}")
    assert client.get(f"/packet/{packet_id}").status_code == 404

"""Packet endpoints (Member 4): POST /packet, GET /packet/{id}[/pdf|/html].

Renter-controlled: assembled from confirmed fields only; the renter previews and
initiates the download. This NEVER auto-sends to any email or provider.
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel

from backend.packet.assembler import assemble_packet
from backend.packet.render import render_html, render_pdf
from backend.packet.store import packet_store

router = APIRouter(tags=["packet"])


class PacketField(BaseModel):
    name: str
    value: object = None
    state: str = "unconfirmed"


class PacketRequest(BaseModel):
    sessionId: Optional[str] = None
    fields: List[PacketField] = []
    includedDocuments: List[str] = []


def _demo_request() -> dict:
    """Demo packet inputs until live extraction + confirmed profile are wired.
    Note the unconfirmed 'ocr_raw_text' field — the assembler drops it, proving
    only confirmed fields ever enter a packet.
    """
    return {
        "sessionId": None,
        "fields": [
            {"name": "employee_name", "value": "Jordan Rivera", "state": "confirmed"},
            {"name": "gross_pay", "value": 2650, "state": "corrected"},
            {"name": "pay_frequency", "value": "monthly", "state": "confirmed"},
            {"name": "full_name", "value": "Jordan Rivera", "state": "confirmed"},
            {"name": "id_number_last4", "value": "4821", "state": "confirmed"},
            {"name": "ocr_raw_text", "value": "dropped: not confirmed", "state": "unconfirmed"},
        ],
        "includedDocuments": ["pay_stub", "government_id"],
    }


def _contract(packet_id: str, record: dict) -> dict:
    return {
        "packetId": packet_id,
        "status": record["status"],
        "includedDocuments": record["includedDocuments"],
        "confirmedFieldsOnly": True,
        "downloadUrl": f"/packet/{packet_id}/pdf",
    }


@router.post("/packet")
def create_packet(body: Optional[PacketRequest] = None) -> dict:
    if body is None or (not body.fields and not body.includedDocuments):
        data = _demo_request()
        session_id, fields, docs = data["sessionId"], data["fields"], data["includedDocuments"]
    else:
        session_id = body.sessionId
        fields = [f.model_dump() for f in body.fields]
        docs = body.includedDocuments

    record = assemble_packet(session_id, fields, docs)
    packet_id = packet_store.create(record)
    return _contract(packet_id, record)


@router.get("/packet/{packet_id}")
def get_packet(packet_id: str) -> dict:
    record = packet_store.get(packet_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Packet not found.")
    result = _contract(packet_id, record)
    result["fields"] = record["fields"]  # preview needs the confirmed fields
    return result


@router.get("/packet/{packet_id}/html", response_class=HTMLResponse)
def get_packet_html(packet_id: str) -> HTMLResponse:
    record = packet_store.get(packet_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Packet not found.")
    return HTMLResponse(render_html(record))


@router.get("/packet/{packet_id}/pdf")
def get_packet_pdf(packet_id: str):
    record = packet_store.get(packet_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Packet not found.")
    try:
        pdf_bytes = render_pdf(record)
    except Exception:  # pragma: no cover - fallback if the PDF lib fails
        return HTMLResponse(render_html(record))
    packet_store.set_status(packet_id, "downloaded")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{packet_id}.pdf"'},
    )

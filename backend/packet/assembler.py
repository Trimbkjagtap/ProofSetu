"""Assemble a renter packet from CONFIRMED fields only. Never auto-sends.

The renter previews and initiates any download/share. This module enforces the
"confirmed fields only" rule: anything still unconfirmed or flagged please_check
is dropped before it can enter a packet.
"""
from __future__ import annotations

from typing import List, Optional

# A field counts as renter-confirmed only in these states (contracts vocabulary).
_CONFIRMED_STATES = {"confirmed", "corrected"}


def confirmed_only(fields: List[dict]) -> List[dict]:
    """Keep only renter-confirmed/corrected fields; drop unconfirmed/please_check."""
    kept = []
    for field in fields or []:
        state = str(field.get("state", "")).lower()
        if state in _CONFIRMED_STATES:
            kept.append(
                {"name": field.get("name"), "value": field.get("value"), "state": state}
            )
    return kept


def assemble_packet(
    session_id: Optional[str],
    fields: List[dict],
    included_documents: List[str],
) -> dict:
    """Build a packet record: confirmed fields only, status ready_for_preview."""
    return {
        "sessionId": session_id,
        "status": "ready_for_preview",
        "includedDocuments": list(included_documents or []),
        "confirmedFieldsOnly": True,
        "fields": confirmed_only(fields),
    }

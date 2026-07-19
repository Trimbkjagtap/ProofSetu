"""In-memory confirmed-profile store (Member 4).

Holds the renter-confirmed fields per session. Populated later by
PATCH /documents/{doc_id}/fields (Member 2 + 4 integration); read by GET /profile,
the checklist, and the packet. Flushed on session delete (handbook: delete clears
extracted fields).
"""
from __future__ import annotations

from typing import Dict, List, Optional

_CONFIRMED_STATES = {"confirmed", "corrected"}


class ProfileStore:
    def __init__(self) -> None:
        self._profiles: Dict[str, List[dict]] = {}

    def set_profile(self, session_id: str, fields: List[dict]) -> None:
        """Replace the confirmed fields for a session (confirmed/corrected only)."""
        self._profiles[session_id] = [
            f for f in fields if str(f.get("state", "")).lower() in _CONFIRMED_STATES
        ]

    def upsert_field(self, session_id: str, field: dict) -> None:
        """Add or update one confirmed field (used by PATCH integration later)."""
        if str(field.get("state", "")).lower() not in _CONFIRMED_STATES:
            return
        fields = self._profiles.setdefault(session_id, [])
        for existing in fields:
            if existing.get("name") == field.get("name"):
                existing.update(field)
                return
        fields.append(field)

    def get_profile(self, session_id: str) -> Optional[List[dict]]:
        return self._profiles.get(session_id)

    def delete_by_session(self, session_id: str) -> bool:
        return self._profiles.pop(session_id, None) is not None


# One shared profile store for the process.
profile_store = ProfileStore()

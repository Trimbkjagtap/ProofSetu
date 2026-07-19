"""In-memory packet store (Member 4). Same simplicity as the session store."""
from __future__ import annotations

import uuid
from typing import Dict, Optional


class PacketStore:
    def __init__(self) -> None:
        self._packets: Dict[str, dict] = {}

    def create(self, record: dict) -> str:
        packet_id = "packet_" + uuid.uuid4().hex[:12]
        record["packetId"] = packet_id
        self._packets[packet_id] = record
        return packet_id

    def get(self, packet_id: str) -> Optional[dict]:
        return self._packets.get(packet_id)

    def set_status(self, packet_id: str, status: str) -> None:
        if packet_id in self._packets:
            self._packets[packet_id]["status"] = status

    def delete(self, packet_id: str) -> bool:
        return self._packets.pop(packet_id, None) is not None

    def delete_by_session(self, session_id: str) -> int:
        """Flush every packet belonging to a session (called on session delete)."""
        to_remove = [pid for pid, rec in self._packets.items() if rec.get("sessionId") == session_id]
        for pid in to_remove:
            self._packets.pop(pid, None)
        return len(to_remove)


# One shared packet store for the process.
packet_store = PacketStore()

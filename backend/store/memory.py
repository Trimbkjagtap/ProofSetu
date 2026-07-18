"""In-memory session store — the zero-dependency default and demo fallback.

Data lives in a plain dict inside the running process. It disappears when the
server restarts, which is fine for a single-instance demo. For anything longer
lived, switch SESSION_BACKEND=upstash.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

from models.session import Session
from store.base import SessionStore


def _now() -> datetime:
    return datetime.now(timezone.utc)


class MemoryStore(SessionStore):
    def __init__(self, ttl_seconds: int) -> None:
        self._ttl = ttl_seconds
        self._sessions: Dict[str, Session] = {}

    def create_session(self) -> Session:
        now = _now()
        session = Session(
            id="sess_" + uuid.uuid4().hex[:12],
            created_at=now,
            expires_at=now + timedelta(seconds=self._ttl),
            consent=True,
        )
        self._sessions[session.id] = session
        return session

    def get_session(self, session_id: str) -> Optional[Session]:
        session = self._sessions.get(session_id)
        if session is None:
            return None
        if _now() >= session.expires_at:
            # Expired — flush it so it can never be read again.
            self._sessions.pop(session_id, None)
            return None
        return session

    def delete_session(self, session_id: str) -> bool:
        return self._sessions.pop(session_id, None) is not None

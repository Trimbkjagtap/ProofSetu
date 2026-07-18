"""Upstash Redis session store — wired later (P1).

The interface is defined now so main.py can depend on the abstraction. Until
this is implemented, keep SESSION_BACKEND=memory. Implementing it means calling
the Upstash REST API (SET with EX for TTL, GET, DEL) using
UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.
"""
from typing import Optional

from backend.models.session import Session
from backend.store.base import SessionStore

_NOT_READY = "UpstashStore is not implemented yet; use SESSION_BACKEND=memory."


class UpstashStore(SessionStore):
    def __init__(self, url: str, token: str, ttl_seconds: int) -> None:
        self._url = url
        self._token = token
        self._ttl = ttl_seconds

    def create_session(self) -> Session:  # pragma: no cover - not implemented yet
        raise NotImplementedError(_NOT_READY)

    def get_session(self, session_id: str) -> Optional[Session]:  # pragma: no cover
        raise NotImplementedError(_NOT_READY)

    def delete_session(self, session_id: str) -> bool:  # pragma: no cover
        raise NotImplementedError(_NOT_READY)

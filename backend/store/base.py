"""Storage interface for sessions.

Every backend (memory, Upstash) implements this same set of methods, so the
rest of the app never needs to know which one is active. This is the "adapter"
pattern: swap the implementation, keep the interface.
"""
from abc import ABC, abstractmethod
from typing import Optional

from models.session import Session


class SessionStore(ABC):
    @abstractmethod
    def create_session(self) -> Session:
        """Create a new consented session with a TTL and return it."""

    @abstractmethod
    def get_session(self, session_id: str) -> Optional[Session]:
        """Return the session if it exists and has not expired, else None."""

    @abstractmethod
    def delete_session(self, session_id: str) -> bool:
        """Delete all data for a session. Return True if something was deleted."""

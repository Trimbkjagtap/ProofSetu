"""Session model — one renter's anonymous, time-limited workspace."""
from datetime import datetime

from pydantic import BaseModel


class Session(BaseModel):
    id: str
    created_at: datetime
    expires_at: datetime
    consent: bool = True

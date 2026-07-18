"""PII minimization helpers.

Never store or log full SSNs or full government ID numbers. Reduce ID numbers to
the last four digits before they enter any field, response, log, or store.
"""
from __future__ import annotations

import re
from typing import Optional


def last4(raw_id: Optional[str]) -> Optional[str]:
    """Return the last four digits of an ID number, or None if unavailable.

    The full value is never returned, stored, or logged.
    """
    if not raw_id:
        return None
    digits = re.sub(r"\D", "", str(raw_id))
    if len(digits) < 4:
        return None
    return digits[-4:]

"""RealDoor document extraction module (Member 2).

Public surface for integration:
    from backend.extraction.api import router as extraction_router
"""
from .api import router  # noqa: F401
from .service import ExtractionService, service  # noqa: F401

__all__ = ["router", "ExtractionService", "service"]

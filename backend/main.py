"""RealDoor backend — FastAPI app entry point (Member 4 / integration owner).

Run locally from the REPOSITORY ROOT:
    source backend/.venv/bin/activate
    uvicorn backend.main:app --reload
Then open http://localhost:8000/docs for the interactive API page.

Router wiring: this app owns the session + checklist endpoints directly, and
mounts other members' routers when their packages are present (they light up
automatically once their PRs merge into develop).
"""
import importlib
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.store.factory import get_store
from backend.checklist.router import router as checklist_router
from backend.packet.router import router as packet_router
from backend.packet.store import packet_store
from backend.guards.middleware import OutputGuardMiddleware

log = logging.getLogger("realdoor")

app = FastAPI(title="RealDoor API", version="0.1.0")

# Output guard is inner; CORS is added last so it stays OUTERMOST — CORS headers
# then appear on every response, including the guard's short-circuit refusals.
app.add_middleware(OutputGuardMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# One shared session store for the process (in-memory by default).
store = get_store()

# --- Member 4's own routers (always present on this branch) ---
app.include_router(checklist_router)
app.include_router(packet_router)


@app.get("/health")
def health() -> dict:
    """Liveness check. Ping this to wake the server before a demo."""
    return {
        "status": "ok",
        "service": "realdoor-backend",
        "sessionBackend": settings.SESSION_BACKEND,
    }


@app.post("/session")
def create_session() -> dict:
    """Create an anonymous, consented session with a TTL (the Consent step)."""
    session = store.create_session()
    return {
        "sessionId": session.id,
        "consent": session.consent,
        "expiresAt": session.expires_at.isoformat(),
        "ttlSeconds": settings.SESSION_TTL_SECONDS,
    }


@app.delete("/session/{session_id}")
def delete_session(session_id: str) -> dict:
    """Delete all data for a session (the renter's 'delete everything' control)."""
    deleted = store.delete_session(session_id)
    packet_store.delete_by_session(session_id)  # flush any packets for this session
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found or already deleted.")
    return {"status": "deleted", "sessionId": session_id}


# --- Other members' routers: mounted only if their package has merged ---
def _try_include(module_path: str, attr: str = "router") -> None:
    """Include a router if its module exists; skip quietly if not merged yet."""
    try:
        module = importlib.import_module(module_path)
    except ImportError:
        log.info("Router %s not present yet; skipping (wired on integration).", module_path)
        return
    app.include_router(getattr(module, attr))
    log.info("Mounted router: %s", module_path)


_try_include("backend.rules.router")      # Member 3 — POST /rules/query
_try_include("backend.extraction.api")    # Member 2 — POST /documents

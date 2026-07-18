"""RealDoor backend — FastAPI app entry point (Member 4 / integration owner).

Run locally from the backend/ directory:
    uvicorn main:app --reload
Then open http://localhost:8000/docs for the interactive API page.

Other members register their routers here via include_router (see backend/README.md);
they do not edit their route wiring anywhere else.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from store.factory import get_store

app = FastAPI(title="RealDoor API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# One shared session store for the process (in-memory by default).
store = get_store()


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
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found or already deleted.")
    return {"status": "deleted", "sessionId": session_id}

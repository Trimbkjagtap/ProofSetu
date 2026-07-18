"""Central backend configuration, read from environment variables.

Keeping all env access in one place means the rest of the code never calls
os.getenv directly — it just imports `settings`.
"""
import os


def _csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    # Session storage: "memory" (default, no external service) or "upstash".
    SESSION_BACKEND: str = os.getenv("SESSION_BACKEND", "memory")
    SESSION_TTL_SECONDS: int = int(os.getenv("SESSION_TTL_SECONDS", "3600"))

    # Upstash Redis (only used when SESSION_BACKEND=upstash).
    UPSTASH_REDIS_REST_URL: str = os.getenv("UPSTASH_REDIS_REST_URL", "")
    UPSTASH_REDIS_REST_TOKEN: str = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")

    # Exact frontend origins allowed to call this API. Falls back to local dev.
    CORS_ORIGINS: list[str] = _csv(os.getenv("CORS_ORIGINS", "")) or [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "10"))


settings = Settings()

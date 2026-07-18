"""Pick the session store implementation based on configuration."""
from config import settings
from store.base import SessionStore
from store.memory import MemoryStore
from store.upstash import UpstashStore


def get_store() -> SessionStore:
    if settings.SESSION_BACKEND == "upstash":
        return UpstashStore(
            url=settings.UPSTASH_REDIS_REST_URL,
            token=settings.UPSTASH_REDIS_REST_TOKEN,
            ttl_seconds=settings.SESSION_TTL_SECONDS,
        )
    return MemoryStore(ttl_seconds=settings.SESSION_TTL_SECONDS)

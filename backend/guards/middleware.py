"""Global output-guard + eligibility-refusal middleware (Member 4).

Two safety gates on every request:
1. If a rules question asks for a personal eligibility verdict, short-circuit
   with the mandated safe refusal (it never reaches a verdict path).
2. Scan every JSON response for forbidden verdict language; if any leaks,
   replace it with the safe refusal and log a content-free safety event.
"""
from __future__ import annotations

import json
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from backend.guards.output_guard import contains_verdict
from backend.guards.refusal import is_eligibility_question, refusal_response

log = logging.getLogger("realdoor.guards")

# Request bodies on these paths carry a renter question we should screen.
_QUESTION_PATHS = {"/rules/query"}
# Skip scanning API-schema/doc responses (never renter-facing content).
_SKIP_SCAN_PREFIXES = ("/openapi", "/docs", "/redoc")


class OutputGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Gate 1 (input side): eligibility questions -> mandated refusal.
        if request.method == "POST" and request.url.path in _QUESTION_PATHS:
            question = ""
            body = await request.body()
            if body:
                try:
                    question = json.loads(body).get("question", "")
                except (ValueError, AttributeError):
                    question = ""
            if is_eligibility_question(question):
                log.info("output guard: eligibility question -> safe refusal")
                return JSONResponse(refusal_response())

        response = await call_next(request)

        # Gate 2 (output side): scan JSON responses for verdict language.
        content_type = response.headers.get("content-type", "")
        if content_type.startswith("application/json") and not request.url.path.startswith(
            _SKIP_SCAN_PREFIXES
        ):
            raw = b""
            async for chunk in response.body_iterator:
                raw += chunk
            if contains_verdict(raw.decode("utf-8", errors="ignore")):
                log.warning("output guard blocked forbidden verdict language in response")
                return JSONResponse(refusal_response())
            headers = dict(response.headers)
            headers.pop("content-length", None)  # rebuilt from content
            return Response(
                content=raw,
                status_code=response.status_code,
                headers=headers,
                media_type=response.media_type,
            )

        return response

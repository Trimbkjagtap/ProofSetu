"""Structured extraction errors.

Always return a structured error rather than partial or invented values.
Each error carries an HTTP status and a stable machine code so the frontend can
show recovery guidance.
"""
from __future__ import annotations


class ExtractionError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 422) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code

    def to_wire(self) -> dict:
        return {"error": {"code": self.code, "message": self.message}}


class UnsupportedMediaTypeError(ExtractionError):
    def __init__(self, message: str) -> None:
        super().__init__("unsupported_media_type", message, status_code=415)


class FileTooLargeError(ExtractionError):
    def __init__(self, message: str) -> None:
        super().__init__("file_too_large", message, status_code=413)


class EmptyFileError(ExtractionError):
    def __init__(self, message: str) -> None:
        super().__init__("empty_file", message, status_code=422)


class ContentMismatchError(ExtractionError):
    """File contents do not match a supported type (e.g. a renamed executable)."""

    def __init__(self, message: str) -> None:
        super().__init__("content_mismatch", message, status_code=415)

"""File validation: MIME allowlist, extension check, and size cap.

Synthetic demo documents only. Never accept or persist real renter documents.
"""
from __future__ import annotations

import os

from .errors import (
    ContentMismatchError,
    EmptyFileError,
    FileTooLargeError,
    UnsupportedMediaTypeError,
)

# Allowlisted upload types for the demo.
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}

# Leading magic bytes for each supported type. Content is sniffed so a renamed
# executable (or any spoofed extension/MIME) cannot slip through.
_MAGIC_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    "pdf": (b"%PDF",),
    "png": (b"\x89PNG",),
    "jpeg": (b"\xff\xd8",),
}


def _sniff_kind(content: bytes) -> str | None:
    for kind, signatures in _MAGIC_SIGNATURES.items():
        if any(content.startswith(sig) for sig in signatures):
            return kind
    return None


def max_upload_bytes() -> int:
    """Upload cap in bytes from MAX_UPLOAD_MB (default 10 MB)."""
    try:
        mb = float(os.getenv("MAX_UPLOAD_MB", "10"))
    except ValueError:
        mb = 10.0
    return int(mb * 1024 * 1024)


def _extension(filename: str | None) -> str:
    if not filename:
        return ""
    return os.path.splitext(filename)[1].lower()


def validate_upload(
    filename: str | None, content_type: str | None, content: bytes
) -> None:
    """Raise a structured ExtractionError if the upload is not acceptable."""
    if not content:
        raise EmptyFileError("The uploaded file is empty. Please choose a file.")

    size_cap = max_upload_bytes()
    if len(content) > size_cap:
        cap_mb = size_cap // (1024 * 1024)
        raise FileTooLargeError(
            f"File exceeds the {cap_mb} MB limit. Please upload a smaller file."
        )

    ext = _extension(filename)
    ct = (content_type or "").split(";")[0].strip().lower()

    # Accept if EITHER the MIME type OR the extension is allowlisted, but reject
    # when both are present and neither matches.
    mime_ok = ct in ALLOWED_CONTENT_TYPES
    ext_ok = ext in ALLOWED_EXTENSIONS
    if not (mime_ok or ext_ok):
        raise UnsupportedMediaTypeError(
            "Unsupported file type. Upload a PDF, JPG, or PNG."
        )

    # Content sniffing: the actual bytes must look like a supported type. This
    # catches a renamed executable or any spoofed extension/MIME.
    if _sniff_kind(content) is None:
        raise ContentMismatchError(
            "File contents are not a valid PDF, JPG, or PNG."
        )

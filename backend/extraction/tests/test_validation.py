"""File-validation hardening tests.

Content is sniffed by magic bytes, so a spoofed extension/MIME (e.g. a renamed
executable) is rejected even when the filename and content-type look allowed.
"""
from __future__ import annotations

import pytest

from backend.extraction.errors import (
    ContentMismatchError,
    EmptyFileError,
    FileTooLargeError,
    UnsupportedMediaTypeError,
)
from backend.extraction.validation import max_upload_bytes, validate_upload


def test_valid_pdf_png_jpeg_signatures_accepted():
    validate_upload("a.pdf", "application/pdf", b"%PDF-1.7 ...")
    validate_upload("b.png", "image/png", b"\x89PNG\r\n\x1a\n....")
    validate_upload("c.jpg", "image/jpeg", b"\xff\xd8\xff\xe0 jfif")


def test_renamed_executable_rejected_despite_pdf_extension():
    # Looks like a PDF by name + MIME, but the bytes are an EXE ("MZ").
    with pytest.raises(ContentMismatchError):
        validate_upload("malware.pdf", "application/pdf", b"MZ\x90\x00 this is an exe")


def test_content_mismatch_unknown_signature_rejected():
    with pytest.raises(ContentMismatchError):
        validate_upload("image.png", "image/png", b"GIF89a not a png")


def test_unsupported_extension_and_mime_rejected():
    with pytest.raises(UnsupportedMediaTypeError):
        validate_upload("x.exe", "application/x-msdownload", b"%PDF still exe ext")


def test_empty_file_rejected():
    with pytest.raises(EmptyFileError):
        validate_upload("a.pdf", "application/pdf", b"")


def test_oversized_file_rejected():
    big = b"%PDF" + b"0" * (max_upload_bytes() + 1)
    with pytest.raises(FileTooLargeError):
        validate_upload("a.pdf", "application/pdf", big)

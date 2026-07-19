"""PDF -> PNG rasterization via PyMuPDF (fitz).

PyMuPDF bundles its own binaries (pip-installable), so this works on Render with
no system packages (poppler/tesseract not required). Handles digital and scanned
PDFs uniformly by rendering pages to images for the vision model.
"""
from __future__ import annotations

from typing import List


class PdfRenderError(Exception):
    """Raised when a PDF cannot be opened or rendered (triggers fixture fallback)."""


def pdf_to_png_pages(content: bytes, max_pages: int = 2, dpi: int = 170) -> List[bytes]:
    """Render the first `max_pages` pages of a PDF to PNG bytes.

    Capped for cost control. Raises PdfRenderError on any failure so callers can
    fall back to the fixture.
    """
    try:
        import fitz  # PyMuPDF
    except Exception as exc:  # pragma: no cover - depends on optional dep
        raise PdfRenderError("pymupdf (fitz) is not installed") from exc

    zoom = dpi / 72.0
    pages: List[bytes] = []
    try:
        with fitz.open(stream=content, filetype="pdf") as doc:
            matrix = fitz.Matrix(zoom, zoom)
            for index, page in enumerate(doc):
                if index >= max_pages:
                    break
                pixmap = page.get_pixmap(matrix=matrix)
                pages.append(pixmap.tobytes("png"))
    except Exception as exc:
        raise PdfRenderError("failed to render PDF") from exc

    if not pages:
        raise PdfRenderError("PDF produced no pages")
    return pages

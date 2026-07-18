"""Map OCR words -> allowlisted fields with confidence + source box.

Real OCR mapping is intentionally conservative: a value is only assigned when it
is found near a known label with adequate confidence. Anything uncertain becomes
`please_check` with value=None — never a silent guess. The fixture path remains
the reliable demo source; this exists so the live P1 pipeline is honest.
"""
from __future__ import annotations

from typing import List, Optional

from .allowlists import allowlisted_fields
from .ocr import OcrResult, OcrWord
from .pii import last4
from .schemas import DocumentType, ExtractedField, FieldState, SourceBox

CONFIDENCE_THRESHOLD = 0.5

# Label tokens that tend to precede each allowlisted value on a document.
_FIELD_LABELS: dict[str, tuple[str, ...]] = {
    "employer_name": ("employer", "company"),
    "employee_name": ("employee", "name"),
    "gross_pay": ("gross", "gross pay"),
    "pay_frequency": ("frequency", "biweekly", "weekly", "monthly"),
    "full_name": ("name",),
    "expiration_date": ("exp", "expires", "expiration"),
    "id_number_last4": ("id", "license", "number"),
}


def finalize_field(
    name: str,
    value,
    confidence: float,
    source_box: Optional[SourceBox],
) -> ExtractedField:
    """Assemble a field, downgrading to please_check when weak or missing.

    Never returns an invented value: low confidence keeps the read value but
    flags it; a missing value is None + please_check.
    """
    if value is None or confidence < CONFIDENCE_THRESHOLD:
        state = FieldState.please_check
    else:
        state = FieldState.unconfirmed
    # ID numbers are always reduced to last-4 before leaving the mapper.
    if name == "id_number_last4":
        value = last4(str(value)) if value is not None else None
        if value is None:
            state = FieldState.please_check
    return ExtractedField(
        name=name,
        value=value,
        confidence=max(0.0, min(1.0, confidence)),
        state=state,
        source_box=source_box,
    )


def _find_value_for(label_tokens: tuple[str, ...], words: List[OcrWord]) -> Optional[OcrWord]:
    lowered = [(w.text.lower(), w) for w in words]
    for i, (txt, _) in enumerate(lowered):
        if any(tok in txt for tok in label_tokens):
            # Take the next word on the line as the candidate value.
            if i + 1 < len(lowered):
                return lowered[i + 1][1]
    return None


def map_fields(doc_type: DocumentType, ocr: OcrResult) -> List[ExtractedField]:
    """Best-effort mapping of OCR output to the allowlist for this doc type."""
    out: List[ExtractedField] = []
    for name in allowlisted_fields(doc_type):
        labels = _FIELD_LABELS.get(name)
        candidate = _find_value_for(labels, ocr.words) if labels else None
        if candidate is None:
            out.append(finalize_field(name, None, 0.0, None))
            continue
        box = SourceBox(
            page=candidate.page,
            x=candidate.x,
            y=candidate.y,
            width=candidate.width,
            height=candidate.height,
        )
        out.append(finalize_field(name, candidate.text, candidate.confidence, box))
    return out

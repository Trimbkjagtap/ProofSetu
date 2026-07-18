"""Map OCR words -> allowlisted fields with confidence + source box.

Real OCR mapping is conservative and honest: a value is only assigned when it is
found on the same text line as a known label with adequate confidence, and
amount fields must parse to a number. Anything uncertain becomes `please_check`
with value=None — never a silent guess. The fixture path remains the reliable
demo source; this makes the live P1 pipeline trustworthy.
"""
from __future__ import annotations

import re
from typing import List, Optional

from .allowlists import allowlisted_fields
from .ocr import OcrResult, OcrWord
from .pii import last4
from .schemas import DocumentType, ExtractedField, FieldState, SourceBox

CONFIDENCE_THRESHOLD = 0.5

# Amount fields must parse to a number or they become please_check.
_AMOUNT_FIELDS = {"gross_pay", "monthly_amount", "ending_balance"}

# Label tokens that precede each allowlisted value on a document line.
_FIELD_LABELS: dict[str, tuple[str, ...]] = {
    # pay_stub
    "employer_name": ("employer", "company"),
    "employee_name": ("employee",),
    "pay_period_start": ("period start", "pay period start", "start"),
    "pay_period_end": ("period end", "pay period end", "end"),
    "gross_pay": ("gross pay", "gross"),
    "pay_frequency": ("frequency", "pay frequency"),
    # benefit_letter
    "issuer": ("issuer", "issued by", "from"),
    "recipient_name": ("recipient", "beneficiary"),
    "benefit_type": ("benefit type", "benefit", "program"),
    "monthly_amount": ("monthly amount", "monthly", "amount"),
    "effective_date": ("effective",),
    # bank_statement
    "institution": ("institution", "bank"),
    "account_holder": ("account holder", "holder", "account"),
    "period_start": ("period start", "statement period", "from"),
    "period_end": ("period end", "to"),
    "ending_balance": ("ending balance", "balance"),
    # government_id (multi-word labels first so the value excludes the label)
    "full_name": ("full name", "name"),
    "date_of_birth": ("date of birth", "dob", "birth"),
    "id_number_last4": ("id number", "id no", "license number", "license", "number", "id"),
    "expiration_date": ("expiration date", "expiration", "expires", "exp"),
}

# Tokens that identify a pay frequency regardless of a nearby label.
_FREQUENCY_TOKENS = ("weekly", "biweekly", "bi-weekly", "semimonthly", "monthly", "annually")


def _to_number(text: str):
    """Parse a currency/amount string to int or float, or None if not numeric."""
    cleaned = re.sub(r"[^0-9.]", "", text.replace(",", ""))
    if not cleaned or cleaned == ".":
        return None
    try:
        value = float(cleaned)
    except ValueError:
        return None
    return int(value) if value.is_integer() else value


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
    if name == "id_number_last4":
        value = last4(str(value)) if value is not None else None

    if name in _AMOUNT_FIELDS and value is not None and not isinstance(value, (int, float)):
        value = _to_number(str(value))

    if value is None or value == "" or confidence < CONFIDENCE_THRESHOLD:
        state = FieldState.please_check
    else:
        state = FieldState.unconfirmed

    return ExtractedField(
        name=name,
        value=value,
        confidence=max(0.0, min(1.0, confidence)),
        state=state,
        source_box=source_box,
    )


def _group_lines(words: List[OcrWord]) -> List[List[OcrWord]]:
    """Cluster words into visual lines by vertical position, then sort by x."""
    if not words:
        return []
    ordered = sorted(words, key=lambda w: (w.page, w.y, w.x))
    lines: List[List[OcrWord]] = []
    current: List[OcrWord] = [ordered[0]]
    for word in ordered[1:]:
        ref = current[-1]
        tol = max(ref.height, 10) * 0.6
        same_line = word.page == ref.page and abs(word.y - ref.y) <= tol
        if same_line:
            current.append(word)
        else:
            lines.append(sorted(current, key=lambda w: w.x))
            current = [word]
    lines.append(sorted(current, key=lambda w: w.x))
    return lines


def _span_box(words: List[OcrWord]) -> Optional[SourceBox]:
    if not words:
        return None
    x0 = min(w.x for w in words)
    y0 = min(w.y for w in words)
    x1 = max(w.x + w.width for w in words)
    y1 = max(w.y + w.height for w in words)
    return SourceBox(page=words[0].page, x=x0, y=y0, width=x1 - x0, height=y1 - y0)


def _value_after_label(line: List[OcrWord], label_tokens: tuple[str, ...]):
    """Return (value_str, confidence, box) for tokens following a label on a line.

    Labels are matched on WHOLE words (a label of "id" will not match inside
    "identification"), so the value never captures part of a label token.
    """
    # Normalized word view for whole-word label matching.
    norm = [w.text.lower().strip(":.,") for w in line]
    for label in label_tokens:
        label_words = label.split()
        span = len(label_words)
        for start in range(0, len(line) - span + 1):
            if norm[start:start + span] != label_words:
                continue
            value_words = [w for w in line[start + span:] if w.text.strip(":").strip()]
            if not value_words:
                continue  # label present but no value on this line; keep looking
            value_str = " ".join(w.text for w in value_words).strip(": ").strip()
            conf = sum(w.confidence for w in value_words) / len(value_words)
            return value_str, conf, _span_box(value_words)
    return None


def map_fields(doc_type: DocumentType, ocr: OcrResult) -> List[ExtractedField]:
    """Best-effort, line-aware mapping of OCR output to the allowlist."""
    lines = _group_lines(ocr.words)
    out: List[ExtractedField] = []

    for name in allowlisted_fields(doc_type):
        # pay_frequency: match a known frequency token anywhere.
        if name == "pay_frequency":
            found = None
            for word in ocr.words:
                if word.text.lower() in _FREQUENCY_TOKENS:
                    found = word
                    break
            if found is not None:
                out.append(finalize_field(name, found.text, found.confidence, _span_box([found])))
            else:
                out.append(finalize_field(name, None, 0.0, None))
            continue

        labels = _FIELD_LABELS.get(name)
        result = None
        if labels:
            for line in lines:
                result = _value_after_label(line, labels)
                if result is not None:
                    break
        if result is None:
            out.append(finalize_field(name, None, 0.0, None))
        else:
            value_str, conf, box = result
            out.append(finalize_field(name, value_str, conf, box))
    return out

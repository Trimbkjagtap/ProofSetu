"""Pydantic models for the extraction response contract.

These mirror `contracts/extraction-response.json` EXACTLY. Property names are
frozen: `documentId`, `documentType`, `sourceBox` are camelCase in JSON. Do not
rename without team approval (Member 4 edits contracts/).
"""
from __future__ import annotations

from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

# Allowed values are frozen in contracts/README.md (status vocabulary).


class FieldState(str, Enum):
    unconfirmed = "unconfirmed"
    confirmed = "confirmed"
    corrected = "corrected"
    please_check = "please_check"


class DocumentStatus(str, Enum):
    uploading = "uploading"
    processing = "processing"
    needs_confirmation = "needs_confirmation"
    confirmed = "confirmed"
    needs_attention = "needs_attention"


class DocumentType(str, Enum):
    pay_stub = "pay_stub"
    benefit_letter = "benefit_letter"
    bank_statement = "bank_statement"
    government_id = "government_id"


# A field value may be a string (dates, names), a number (amounts), or null when
# a value could not be read confidently. Never invent a value.
FieldValue = Union[str, int, float, None]


class SourceBox(BaseModel):
    """Bounding box locating a value on the source document (evidence)."""

    model_config = ConfigDict(populate_by_name=True)

    page: int
    x: float
    y: float
    width: float
    height: float


class ExtractedField(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    value: FieldValue = None
    confidence: float = Field(ge=0.0, le=1.0)
    state: FieldState = FieldState.unconfirmed
    source_box: Optional[SourceBox] = Field(default=None, alias="sourceBox")


class ExtractionResponse(BaseModel):
    """Response for POST /documents. Serialize with `by_alias=True` for the wire."""

    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(alias="documentId")
    document_type: DocumentType = Field(alias="documentType")
    status: DocumentStatus = DocumentStatus.needs_confirmation
    fields: List[ExtractedField] = Field(default_factory=list)

    def to_wire(self) -> dict:
        """camelCase dict matching the frozen contract exactly."""
        return self.model_dump(by_alias=True, mode="json")


class FieldCorrection(BaseModel):
    """Body for PATCH /documents/{doc_id}/fields (Member 2 + 4 integration).

    `action=confirm` accepts the extracted value; `action=correct` replaces it
    with `value`. Either way the field is renter-verified and downstream results
    become stale (see ExtractionService.confirm_field).
    """

    model_config = ConfigDict(populate_by_name=True)

    name: str
    action: str = "confirm"  # "confirm" | "correct"
    value: FieldValue = None

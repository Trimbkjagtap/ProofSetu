"""Safety tests for dynamic-mode PII redaction (backend/extraction/vision.py).

Dynamic extraction returns arbitrary fields, so the redaction guard must never
let a full SSN / government-ID / account number through.
"""
from backend.extraction.vision import _build_dynamic_schema, _redact_pii


def test_full_ssn_is_reduced_to_last4():
    out = _redact_pii("ssn", "123-45-6789")
    assert out.endswith("6789")
    assert "123" not in out and "45" not in out


def test_bare_9_digit_ssn_field_redacted():
    assert _redact_pii("social_security_number", "123456789") == "****6789"


def test_long_account_number_redacted():
    assert _redact_pii("account_number", "1234567890123") == "****0123"


def test_normal_amounts_and_dates_are_kept():
    assert _redact_pii("gross_pay", "3,880.00") == "3,880.00"
    assert _redact_pii("pay_period", "11/17/2025 - 11/30/2025") == "11/17/2025 - 11/30/2025"
    assert _redact_pii("employer_name", "Elite Home Automation Inc.") == "Elite Home Automation Inc."


def test_none_stays_none():
    assert _redact_pii("anything", None) is None


def test_dynamic_schema_is_array_of_fields():
    schema = _build_dynamic_schema()
    assert schema["properties"]["fields"]["type"] == "array"
    item = schema["properties"]["fields"]["items"]
    assert set(item["required"]) == {"name", "value", "confidence"}

"""Unit tests for Iceberg Lakehouse record mapping."""

from datetime import datetime, timezone
from decimal import Decimal

from app.storage.mapping import (
    extract_failure_details,
    to_clean_iceberg_dict,
    to_dlq_iceberg_dict,
)


def test_to_clean_iceberg_dict_valid():
    raw = {
        "event_id": "evt-001",
        "transaction_id": "tx-001",
        "event_time": "2026-09-13T12:00:00Z",
        "customer_id": "cust-1",
        "product_id": "prod-100",
        "quantity": 2,
        "unit_price": 29.99,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0",
        "metadata": {"batch": 1},
    }
    result = to_clean_iceberg_dict(raw)
    assert result["event_id"] == "evt-001"
    assert result["transaction_id"] == "tx-001"
    assert result["unit_price"] == Decimal("29.99")
    assert result["quantity"] == 2
    assert result["metadata"] == '{"batch": 1}'
    assert isinstance(result["event_time"], datetime)


def test_extract_failure_details_duplicate():
    errors = ["Duplicate event_id 'evt-999' already processed (DQ-006)"]
    failed_rules, messages, category = extract_failure_details(errors)
    assert "DQ-006" in failed_rules
    assert category == "DUPLICATE"


def test_extract_failure_details_schema_violation():
    errors = ["Missing schema_version (DQ-008)"]
    failed_rules, messages, category = extract_failure_details(errors)
    assert "DQ-008" in failed_rules
    assert category == "SCHEMA_VIOLATION"


def test_to_dlq_iceberg_dict():
    raw = {
        "event_id": "evt-bad",
        "transaction_id": "tx-bad",
        "quantity": "not_an_int",
    }
    errors = ["Field 'quantity' must be an integer (DQ-002)"]
    dlq = to_dlq_iceberg_dict(raw, errors)
    assert dlq["event_id"] == "evt-bad"
    assert dlq["transaction_id"] == "tx-bad"
    assert dlq["failure_category"] == "VALIDATION_FAILED"
    assert "DQ-002" in dlq["failed_rules"]
    assert dlq["recoverable"] is True

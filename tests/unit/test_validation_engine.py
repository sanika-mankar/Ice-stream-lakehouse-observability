"""Tests for the Validation Engine and rules."""

from app.validation.business_rules import PositivePriceValidator, ValidStatusValidator
from app.validation.engine import ValidationEngine
from app.validation.registry import ValidationRegistry
from app.validation.required_fields import RequiredFieldsValidator
from app.validation.types import TypeValidator


def get_test_engine() -> ValidationEngine:
    """Helper to create a fully configured engine for testing."""
    registry = ValidationRegistry()
    registry.register(RequiredFieldsValidator())
    registry.register(TypeValidator())
    registry.register(PositivePriceValidator())
    registry.register(ValidStatusValidator())
    return ValidationEngine(registry)


def test_validation_engine_valid_data():
    """Test engine with a perfectly valid transaction dictionary."""
    engine = get_test_engine()
    data = {
        "event_id": "123",
        "transaction_id": "TXN-1",
        "customer_id": "CUST-1",
        "product_id": "PROD-1",
        "quantity": 2,
        "unit_price": 99.99,
        "currency": "USD",
        "status": "COMPLETED",
    }

    result = engine.validate_event(data)

    assert result.is_valid is True
    assert len(result.errors) == 0
    assert len(result.failed_rules) == 0


def test_missing_required_fields():
    """Test DQ-001 RequiredFieldsValidator."""
    engine = get_test_engine()
    data = {
        "event_id": "123",
        # missing transaction_id
        "customer_id": "CUST-1",
        "product_id": "PROD-1",
        "quantity": 2,
        "unit_price": 99.99,
        "currency": "USD",
        "status": "COMPLETED",
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    assert "DQ-001" in result.failed_rules
    assert "transaction_id" in result.rule_details["DQ-001"]


def test_invalid_types():
    """Test DQ-002 TypeValidator."""
    engine = get_test_engine()
    data = {
        "event_id": "123",
        "transaction_id": "TXN-1",
        "customer_id": "CUST-1",
        "product_id": "PROD-1",
        "quantity": "two",  # Invalid type, should be int
        "unit_price": "expensive",  # Invalid type, should be numeric
        "currency": "USD",
        "status": "COMPLETED",
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    assert "DQ-002" in result.failed_rules


def test_negative_price():
    """Test DQ-003 PositivePriceValidator."""
    engine = get_test_engine()
    data = {
        "event_id": "123",
        "transaction_id": "TXN-1",
        "customer_id": "CUST-1",
        "product_id": "PROD-1",
        "quantity": 2,
        "unit_price": -50.00,  # Negative price
        "currency": "USD",
        "status": "COMPLETED",
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    assert "DQ-003" in result.failed_rules


def test_invalid_status():
    """Test DQ-004 ValidStatusValidator."""
    engine = get_test_engine()
    data = {
        "event_id": "123",
        "transaction_id": "TXN-1",
        "customer_id": "CUST-1",
        "product_id": "PROD-1",
        "quantity": 2,
        "unit_price": 99.99,
        "currency": "USD",
        "status": "UNKNOWN_STATE",  # Invalid status
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    assert "DQ-004" in result.failed_rules


def test_multiple_failures():
    """Test multiple validation errors on a single event."""
    engine = get_test_engine()
    data = {
        "event_id": "123",
        # missing transaction_id (DQ-001)
        "customer_id": "CUST-1",
        "product_id": "PROD-1",
        "quantity": "two",  # invalid type (DQ-002)
        "unit_price": -10.0,  # negative price (DQ-003)
        "currency": "USD",
        "status": "UNKNOWN_STATE",  # invalid status (DQ-004)
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    # All 4 rules should have failed
    assert "DQ-001" in result.failed_rules
    assert "DQ-002" in result.failed_rules
    assert "DQ-003" in result.failed_rules
    assert "DQ-004" in result.failed_rules

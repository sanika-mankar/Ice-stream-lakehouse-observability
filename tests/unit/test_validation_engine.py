"""Tests for the canonical Validation Engine and rules (DQ-001..DQ-008)."""

from app.validation.business_rules import EnumValidator, RangeValidator
from app.validation.engine import ValidationEngine
from app.validation.registry import ValidationRegistry
from app.validation.required_fields import NullRequiredFieldValidator, RequiredFieldsValidator
from app.validation.schema import SchemaMismatchValidator, SchemaVersionValidator
from app.validation.types import TypeValidator


def get_test_engine() -> ValidationEngine:
    """Helper to create a fully configured canonical engine for testing."""
    registry = ValidationRegistry()
    registry.register(RequiredFieldsValidator())      # DQ-001
    registry.register(NullRequiredFieldValidator())  # DQ-002
    registry.register(TypeValidator())               # DQ-003
    registry.register(RangeValidator())              # DQ-004
    registry.register(EnumValidator())               # DQ-005
    registry.register(SchemaMismatchValidator())     # DQ-007
    registry.register(SchemaVersionValidator())      # DQ-008
    return ValidationEngine(registry)


def test_validation_engine_valid_data():
    """Test engine with a valid transaction dictionary."""
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
        "payment_method": "CREDIT_CARD",
        "source": "pos",
        "schema_version": "1.0",
    }

    result = engine.validate_event(data)

    assert result.is_valid is True
    assert len(result.errors) == 0
    assert len(result.failed_rules) == 0


def test_missing_required_fields_dq001():
    """Test DQ-001 REQUIRED_FIELD_MISSING."""
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
        "schema_version": "1.0",
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    assert "DQ-001" in result.failed_rules
    assert "transaction_id" in result.rule_details["DQ-001"]


def test_null_required_field_dq002():
    """Test DQ-002 NULL_REQUIRED_FIELD."""
    engine = get_test_engine()
    data = {
        "event_id": "123",
        "transaction_id": "TXN-1",
        "customer_id": None,  # Key present but None
        "product_id": "PROD-1",
        "quantity": 2,
        "unit_price": 99.99,
        "currency": "USD",
        "status": "COMPLETED",
        "schema_version": "1.0",
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    assert "DQ-002" in result.failed_rules
    assert "customer_id" in result.rule_details["DQ-002"]


def test_invalid_types_dq003():
    """Test DQ-003 INVALID_TYPE."""
    engine = get_test_engine()
    data = {
        "event_id": "123",
        "transaction_id": "TXN-1",
        "customer_id": "CUST-1",
        "product_id": "PROD-1",
        "quantity": "two",  # Invalid type
        "unit_price": "expensive",  # Invalid type
        "currency": "USD",
        "status": "COMPLETED",
        "schema_version": "1.0",
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    assert "DQ-003" in result.failed_rules


def test_invalid_range_dq004():
    """Test DQ-004 INVALID_RANGE."""
    engine = get_test_engine()
    data = {
        "event_id": "123",
        "transaction_id": "TXN-1",
        "customer_id": "CUST-1",
        "product_id": "PROD-1",
        "quantity": 0,  # Invalid: <= 0
        "unit_price": -50.00,  # Invalid: negative
        "currency": "USD",
        "status": "COMPLETED",
        "schema_version": "1.0",
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    assert "DQ-004" in result.failed_rules


def test_invalid_enum_dq005():
    """Test DQ-005 INVALID_ENUM."""
    engine = get_test_engine()
    data = {
        "event_id": "123",
        "transaction_id": "TXN-1",
        "customer_id": "CUST-1",
        "product_id": "PROD-1",
        "quantity": 2,
        "unit_price": 99.99,
        "currency": "FAKE_CURRENCY",  # Invalid enum
        "status": "UNKNOWN_STATE",  # Invalid enum
        "schema_version": "1.0",
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    assert "DQ-005" in result.failed_rules


def test_schema_mismatch_dq007():
    """Test DQ-007 SCHEMA_MISMATCH."""
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
        "schema_version": "1.0",
        "unauthorized_extra_column": "drift",  # Unauthorized field
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    assert "DQ-007" in result.failed_rules


def test_unknown_schema_version_dq008():
    """Test DQ-008 UNKNOWN_SCHEMA_VERSION."""
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
        "schema_version": "99.0",  # Unsupported version
    }

    result = engine.validate_event(data)

    assert result.is_valid is False
    assert "DQ-008" in result.failed_rules

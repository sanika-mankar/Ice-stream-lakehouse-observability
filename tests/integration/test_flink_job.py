import json
import pytest

from app.validation.business_rules import EnumValidator, RangeValidator
from app.validation.engine import ValidationEngine
from app.validation.registry import ValidationRegistry
from app.validation.required_fields import NullRequiredFieldValidator, RequiredFieldsValidator
from app.validation.schema import SchemaMismatchValidator, SchemaVersionValidator
from app.validation.types import TypeValidator


def test_flink_validation_logic():
    """Tests the canonical validation logic matching Flink's ValidateAndParseMap."""
    registry = ValidationRegistry()
    registry.register(RequiredFieldsValidator())      # DQ-001
    registry.register(NullRequiredFieldValidator())  # DQ-002
    registry.register(TypeValidator())               # DQ-003
    registry.register(RangeValidator())              # DQ-004
    registry.register(EnumValidator())               # DQ-005
    registry.register(SchemaMismatchValidator())     # DQ-007
    registry.register(SchemaVersionValidator())      # DQ-008
    engine = ValidationEngine(registry)

    # 1. Valid event
    valid_event = {
        "event_id": "evt-123",
        "transaction_id": "tx-123",
        "event_time": "2026-08-31T20:00:00Z",
        "schema_version": "1.0",
        "customer_id": "c-1",
        "product_id": "p-1",
        "quantity": 1,
        "unit_price": 99.99,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT_CARD",
        "source": "pos",
    }

    res = engine.validate_event(valid_event)
    assert res.is_valid is True

    # Simulation of Flink's ValidateAndParseMap.map
    def simulate_flink_map(value_str):
        try:
            data = json.loads(value_str)
            if not isinstance(data, dict):
                return {"is_valid": False, "errors": ["Schema mismatch (DQ-007)"]}
            result = engine.validate_event(data)
            return {"is_valid": result.is_valid, "errors": result.errors}
        except json.JSONDecodeError as e:
            return {"is_valid": False, "errors": [f"Invalid JSON: {str(e)} (DQ-007)"]}

    # 2. DQ-001: Missing required field
    missing_field_event = valid_event.copy()
    del missing_field_event["customer_id"]
    res = simulate_flink_map(json.dumps(missing_field_event))
    assert res["is_valid"] is False
    assert any("DQ-001" in err for err in res["errors"])

    # 3. DQ-002: NULL required field
    null_field_event = valid_event.copy()
    null_field_event["customer_id"] = None
    res = simulate_flink_map(json.dumps(null_field_event))
    assert res["is_valid"] is False
    assert any("DQ-002" in err for err in res["errors"])

    # 4. DQ-003: Invalid type
    invalid_type_event = valid_event.copy()
    invalid_type_event["quantity"] = "three"
    res = simulate_flink_map(json.dumps(invalid_type_event))
    assert res["is_valid"] is False
    assert any("DQ-003" in err for err in res["errors"])

    # 5. DQ-004: Negative price (invalid range)
    neg_price_event = valid_event.copy()
    neg_price_event["unit_price"] = -10.0
    res = simulate_flink_map(json.dumps(neg_price_event))
    assert res["is_valid"] is False
    assert any("DQ-004" in err for err in res["errors"])

    # 6. DQ-005: Invalid status (enum)
    invalid_status_event = valid_event.copy()
    invalid_status_event["status"] = "UNKNOWN_STATUS"
    res = simulate_flink_map(json.dumps(invalid_status_event))
    assert res["is_valid"] is False
    assert any("DQ-005" in err for err in res["errors"])

    # 7. DQ-007: Schema mismatch (extra unauthorized field)
    mismatch_event = valid_event.copy()
    mismatch_event["extra_rogue_column"] = "unexpected"
    res = simulate_flink_map(json.dumps(mismatch_event))
    assert res["is_valid"] is False
    assert any("DQ-007" in err for err in res["errors"])

    # 8. DQ-008: Unknown schema version
    unknown_schema_event = valid_event.copy()
    unknown_schema_event["schema_version"] = "99.0"
    res = simulate_flink_map(json.dumps(unknown_schema_event))
    assert res["is_valid"] is False
    assert any("DQ-008" in err for err in res["errors"])

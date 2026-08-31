import json
import pytest
from app.validation.engine import ValidationEngine
from app.validation.registry import ValidationRegistry
from app.validation.required_fields import RequiredFieldsValidator
from app.validation.types import TypeValidator
from app.validation.business_rules import PositivePriceValidator, ValidStatusValidator

def test_flink_validation_logic():
    """
    Since Docker/PyFlink might not be available in all CI environments,
    this tests the exact core logic that Flink's ValidateAndParseMap executes.
    """
    registry = ValidationRegistry()
    registry.register(RequiredFieldsValidator())
    registry.register(TypeValidator())
    registry.register(PositivePriceValidator())
    registry.register(ValidStatusValidator())
    engine = ValidationEngine(registry)
    
    # 1. Valid event
    valid_event = {
        "event_id": "evt-123",
        "event_time": "2026-08-31T20:00:00Z",
        "schema_version": "1.0",
        "customer_id": "c-1",
        "product_id": "p-1",
        "quantity": 1,
        "unit_price": 99.99,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "CREDIT"
    }
    
    res = engine.validate_event(valid_event)
    assert res.is_valid == True
    
    # 2. Schema unknown
    unknown_schema_event = valid_event.copy()
    unknown_schema_event["schema_version"] = "2.0"
    # This logic is inside the Flink map wrapper, so let's simulate the wrapper
    
    def simulate_flink_map(value_str):
        data = json.loads(value_str)
        schema_version = data.get("schema_version")
        if not schema_version:
            return {"is_valid": False, "errors": ["Missing schema_version (DQ-008)"]}
        if schema_version != "1.0":
            return {"is_valid": False, "errors": [f"Unknown schema_version '{schema_version}' (DQ-008)"]}
            
        result = engine.validate_event(data)
        return {"is_valid": result.is_valid, "errors": result.errors}

    assert simulate_flink_map(json.dumps(unknown_schema_event))["is_valid"] == False
    
    # 3. Missing required field
    missing_field_event = valid_event.copy()
    del missing_field_event["customer_id"]
    res = simulate_flink_map(json.dumps(missing_field_event))
    assert res["is_valid"] == False
    assert any("customer_id" in err for err in res["errors"])
    
    # 4. Invalid type
    invalid_type_event = valid_event.copy()
    invalid_type_event["quantity"] = "three"
    res = simulate_flink_map(json.dumps(invalid_type_event))
    assert res["is_valid"] == False
    
    # 5. Invalid status (enum)
    invalid_status_event = valid_event.copy()
    invalid_status_event["status"] = "UNKNOWN_STATUS"
    res = simulate_flink_map(json.dumps(invalid_status_event))
    assert res["is_valid"] == False
    
    # 6. Negative price (range)
    neg_price_event = valid_event.copy()
    neg_price_event["unit_price"] = -10.0
    res = simulate_flink_map(json.dumps(neg_price_event))
    assert res["is_valid"] == False

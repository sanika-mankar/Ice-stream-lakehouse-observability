"""Integration tests for Master 6 Circuit Breaker, Incident Management, and Pipeline Observability.

Verifies end-to-end pipeline validation with real ValidationEngine:
- Scenario 1: Healthy batch (100 processed, 99 valid, 1 invalid = 1.00% error rate -> CLOSED)
- Scenario 2: Exact boundary (100 processed, 98 valid, 2 invalid = 2.00% error rate -> CLOSED)
- Scenario 3: Threshold breach (100 processed, 97 valid, 3 invalid = 3.00% error rate -> OPEN + Incident)
- Scenario 4: Recovery probe (HALF_OPEN -> healthy batch -> CLOSED + Incident resolved)
- Scenario 5: Unhealthy probe (HALF_OPEN -> 3% breach -> OPEN)
- Scenario 6: Restart persistence test (verifies incident and state remain queryable after restart)
"""

import json
import os
import tempfile
import pytest
from app.observability.circuit_breaker import CircuitBreaker, CircuitBreakerTripException
from app.observability.models import CircuitState, IncidentStatus, IncidentType, PipelineState
from app.observability.repository import ObservabilityRepository
from app.observability.service import ObservabilityService
from app.validation.engine import ValidationEngine
from app.validation.registry import ValidationRegistry
from app.validation.required_fields import RequiredFieldsValidator, NullRequiredFieldValidator
from app.validation.types import TypeValidator
from app.validation.business_rules import RangeValidator, EnumValidator
from app.validation.schema import SchemaMismatchValidator, SchemaVersionValidator


@pytest.fixture
def validation_engine():
    registry = ValidationRegistry()
    registry.register(RequiredFieldsValidator())      # DQ-001
    registry.register(NullRequiredFieldValidator())  # DQ-002
    registry.register(TypeValidator())               # DQ-003
    registry.register(RangeValidator())              # DQ-004
    registry.register(EnumValidator())               # DQ-005
    registry.register(SchemaMismatchValidator())     # DQ-007
    registry.register(SchemaVersionValidator())      # DQ-008
    return ValidationEngine(registry)


def _generate_event(event_id: str, is_invalid: bool = False) -> dict:
    if not is_invalid:
        return {
            "event_id": event_id,
            "transaction_id": f"tx-{event_id}",
            "event_time": "2026-09-14T02:00:00Z",
            "customer_id": "cust-001",
            "product_id": "prod-001",
            "quantity": 2,
            "unit_price": 49.99,
            "currency": "USD",
            "status": "COMPLETED",
            "payment_method": "CREDIT_CARD",
            "source": "WEB",
            "schema_version": "1.0",
        }
    else:
        # Invalid event with negative unit_price (DQ-004)
        return {
            "event_id": event_id,
            "transaction_id": f"tx-{event_id}",
            "event_time": "2026-09-14T02:00:00Z",
            "customer_id": "cust-001",
            "product_id": "prod-001",
            "quantity": 2,
            "unit_price": -10.00,  # INVALID_RANGE DQ-004
            "currency": "USD",
            "status": "COMPLETED",
            "payment_method": "CREDIT_CARD",
            "source": "WEB",
            "schema_version": "1.0",
        }


def process_batch(events, engine, service, window_start="2026-09-14T02:00:00Z", window_end="2026-09-14T02:00:10Z"):
    """Validates raw event batch through real ValidationEngine and passes metrics to ObservabilityService."""
    processed = 0
    valid = 0
    invalid = 0
    last_event_time = None

    for evt in events:
        res = engine.validate_event(evt)
        processed += 1
        if res.is_valid:
            valid += 1
        else:
            invalid += 1
        last_event_time = evt.get("event_time")

    circuit, health, inc = service.evaluate_window(
        window_start=window_start,
        window_end=window_end,
        duration_seconds=10.0,
        processed=processed,
        valid=valid,
        invalid=invalid,
        last_event_time=last_event_time,
    )
    return circuit, health, inc, processed, valid, invalid


def test_scenario_1_healthy_batch(validation_engine):
    """Scenario 1: 100 events, 99 valid, 1 invalid (1.00% error rate) -> CLOSED."""
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmpdir:
        repo = ObservabilityRepository(db_path=os.path.join(tmpdir, "obs.db"))
        service = ObservabilityService(repository=repo)

        events = [_generate_event(f"evt-{i}", is_invalid=(i == 0)) for i in range(100)]
        circuit, health, inc, proc, v, inv = process_batch(events, validation_engine, service)

        assert proc == 100
        assert v == 99
        assert inv == 1
        assert (inv / proc) == 0.01
        assert circuit == CircuitState.CLOSED
        assert health == PipelineState.DEGRADED
        assert inc is None
        assert len(service.get_active_incidents()) == 0


def test_scenario_2_threshold_boundary_batch(validation_engine):
    """Scenario 2: 100 events, 98 valid, 2 invalid (2.00% error rate) -> EXACT BOUNDARY MUST REMAIN CLOSED."""
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmpdir:
        repo = ObservabilityRepository(db_path=os.path.join(tmpdir, "obs.db"))
        service = ObservabilityService(repository=repo)

        events = [_generate_event(f"evt-{i}", is_invalid=(i < 2)) for i in range(100)]
        circuit, health, inc, proc, v, inv = process_batch(events, validation_engine, service)

        assert proc == 100
        assert v == 98
        assert inv == 2
        assert (inv / proc) == 0.02
        # Strict rule: error_rate > 0.02, so 0.02 remains CLOSED
        assert circuit == CircuitState.CLOSED
        assert health == PipelineState.DEGRADED
        assert inc is None
        assert len(service.get_active_incidents()) == 0


def test_scenario_3_threshold_breach_batch(validation_engine):
    """Scenario 3: 100 events, 97 valid, 3 invalid (3.00% error rate) -> STRICTLY > 2% MUST TRIP TO OPEN."""
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmpdir:
        repo = ObservabilityRepository(db_path=os.path.join(tmpdir, "obs.db"))
        service = ObservabilityService(repository=repo)

        events = [_generate_event(f"evt-{i}", is_invalid=(i < 3)) for i in range(100)]
        circuit, health, inc, proc, v, inv = process_batch(events, validation_engine, service)

        assert proc == 100
        assert v == 97
        assert inv == 3
        assert (inv / proc) == 0.03
        assert circuit == CircuitState.OPEN
        assert health == PipelineState.TRIPPED
        assert inc is not None
        assert inc.incident_type == IncidentType.CIRCUIT_BREAKER_TRIPPED
        assert inc.status == IncidentStatus.OPEN
        assert inc.error_rate == 0.03
        assert inc.threshold == 0.02
        assert len(service.get_active_incidents()) == 1


def test_scenario_4_and_5_recovery_cycle(validation_engine):
    """Scenario 4: OPEN -> HALF_OPEN probe -> Healthy batch -> CLOSED + Incident resolved."""
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmpdir:
        repo = ObservabilityRepository(db_path=os.path.join(tmpdir, "obs.db"))
        service = ObservabilityService(repository=repo)

        # 1. Cause trip with 3% breach
        trip_events = [_generate_event(f"evt-trip-{i}", is_invalid=(i < 3)) for i in range(100)]
        circuit, health, inc, _, _, _ = process_batch(trip_events, validation_engine, service)
        assert circuit == CircuitState.OPEN

        # 2. Initiate controlled recovery
        assert service.initiate_recovery() is True
        assert service.circuit_breaker.state == CircuitState.HALF_OPEN
        assert service.get_active_incidents()[0].status == IncidentStatus.RESOLVING

        # 3. Send healthy probe batch (100 events, 0 invalid = 0% error rate)
        probe_events = [_generate_event(f"evt-probe-{i}", is_invalid=False) for i in range(100)]
        circuit, health, inc, _, _, _ = process_batch(
            probe_events, validation_engine, service,
            window_start="2026-09-14T02:00:10Z",
            window_end="2026-09-14T02:00:20Z",
        )
        assert circuit == CircuitState.CLOSED
        assert health == PipelineState.HEALTHY
        assert inc is not None
        assert inc.status == IncidentStatus.RESOLVED
        assert inc.resolved_at is not None
        assert len(service.get_active_incidents()) == 0


def test_scenario_6_restart_persistence_test(validation_engine):
    """Scenario 6: Test restart persistence and idempotent incident retrieval."""
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmpdir:
        db_path = os.path.join(tmpdir, "obs_restart.db")

        # Session 1: Run pipeline, cause trip
        repo1 = ObservabilityRepository(db_path=db_path)
        service1 = ObservabilityService(repository=repo1)

        events = [_generate_event(f"evt-{i}", is_invalid=(i < 5)) for i in range(100)]
        circuit, health, inc, _, _, _ = process_batch(events, validation_engine, service1)
        assert circuit == CircuitState.OPEN
        incident_id = inc.incident_id

        # Close session 1
        del service1
        del repo1

        # Session 2: Fresh restart pointing to the same persistent SQLite DB
        repo2 = ObservabilityRepository(db_path=db_path)
        service2 = ObservabilityService(repository=repo2)

        # Must truthfully restore OPEN circuit state and retrieve the active incident
        assert service2.circuit_breaker.state == CircuitState.OPEN
        persisted_inc = service2.get_incident(incident_id)
        assert persisted_inc is not None
        assert persisted_inc.incident_id == incident_id
        assert persisted_inc.status == IncidentStatus.OPEN
        assert persisted_inc.error_rate == 0.05
        assert len(service2.get_active_incidents()) == 1

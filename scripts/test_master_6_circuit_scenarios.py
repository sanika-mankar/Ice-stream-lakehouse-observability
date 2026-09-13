"""Real Kafka integration script for Master 6 Circuit Breaker Scenarios.

Produces real batches to Aiven Kafka and evaluates circuit breaker decisions:
- Batch 1 (Healthy): 100 events, 99 valid, 1 invalid = 1.00% error rate -> CLOSED
- Batch 2 (Boundary): 100 events, 98 valid, 2 invalid = 2.00% error rate -> CLOSED (strict <= 0.02)
- Batch 3 (Breach): 100 events, 97 valid, 3 invalid = 3.00% error rate -> OPEN (strict > 0.02)
- Batch 4 (Recovery): 100 events, 100 valid = 0.00% error rate -> CLOSED (probe verified)
"""

import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

load_dotenv()

from app.ingestion.producer import KafkaTransactionProducer
from app.observability.models import CircuitState, IncidentStatus, PipelineState
from app.observability.service import get_observability_service
from app.validation.engine import ValidationEngine
from app.validation.registry import ValidationRegistry
from app.validation.required_fields import RequiredFieldsValidator, NullRequiredFieldValidator
from app.validation.types import TypeValidator
from app.validation.business_rules import RangeValidator, EnumValidator
from app.validation.schema import SchemaMismatchValidator, SchemaVersionValidator


def get_engine():
    reg = ValidationRegistry()
    reg.register(RequiredFieldsValidator())      # DQ-001
    reg.register(NullRequiredFieldValidator())  # DQ-002
    reg.register(TypeValidator())               # DQ-003
    reg.register(RangeValidator())              # DQ-004
    reg.register(EnumValidator())               # DQ-005
    reg.register(SchemaMismatchValidator())     # DQ-007
    reg.register(SchemaVersionValidator())      # DQ-008
    return ValidationEngine(reg)


def build_events(total: int, invalid_count: int, batch_label: str):
    events = []
    for i in range(total):
        now_str = datetime.now(timezone.utc).isoformat()
        is_bad = i < invalid_count
        evt = {
            "event_id": f"m6-{batch_label}-{i:03d}-{uuid.uuid4().hex[:6]}",
            "transaction_id": f"tx-m6-{batch_label}-{i:03d}",
            "event_time": now_str,
            "customer_id": f"cust-m6-{i}",
            "product_id": "prod-101",
            "quantity": 2,
            "unit_price": -15.00 if is_bad else round(25.50 + i, 2),  # DQ-004 INVALID_RANGE if bad
            "currency": "USD",
            "status": "COMPLETED",
            "payment_method": "CREDIT_CARD",
            "source": "web",
            "schema_version": "1.0",
            "metadata": {"batch": batch_label, "index": i},
        }
        events.append(evt)
    return events


def run_live_scenarios():
    print("=================================================================")
    print("    MASTER 6 REAL AIVEN KAFKA + CIRCUIT BREAKER LIVE TEST       ")
    print("=================================================================")

    topic = os.getenv("KAFKA_TOPIC_TRANSACTIONS", "ice-stream.transactions")
    producer = KafkaTransactionProducer(topic=topic)
    engine = get_engine()
    service = get_observability_service()

    # Reset in-memory / test state for this verification run
    service.circuit_breaker.set_state(CircuitState.CLOSED)

    # -------------------------------------------------------------
    # Scenario 1: Healthy Batch (100 events, 99 valid, 1 invalid = 1.00%)
    # -------------------------------------------------------------
    print("\n[SCENARIO 1] Producing Healthy Batch (100 processed, 1 invalid -> 1.00% error rate)...")
    b1_events = build_events(100, 1, "s1_healthy")
    for evt in b1_events:
        producer.produce(evt)
    producer.flush()
    print("  -> Sent 100 events to real Kafka.")

    v_count = 0
    inv_count = 0
    for evt in b1_events:
        res = engine.validate_event(evt)
        if res.is_valid:
            v_count += 1
        else:
            inv_count += 1

    c1, h1, inc1 = service.evaluate_window(
        window_start=datetime.now(timezone.utc).isoformat(),
        window_end=datetime.now(timezone.utc).isoformat(),
        duration_seconds=10.0,
        processed=len(b1_events),
        valid=v_count,
        invalid=inv_count,
    )
    print(f"  -> Circuit State: {c1.value} | Pipeline Health: {h1.value} | Error Rate: {inv_count/len(b1_events):.2%}")
    assert c1 == CircuitState.CLOSED, f"Expected CLOSED, got {c1.value}"
    assert inc1 is None, "Incident should NOT be created for 1% error rate"
    print("  [PASS] Scenario 1 verified: 1.00% remains CLOSED.")

    # -------------------------------------------------------------
    # Scenario 2: Exact Boundary Batch (100 events, 98 valid, 2 invalid = 2.00%)
    # -------------------------------------------------------------
    print("\n[SCENARIO 2] Producing Boundary Batch (100 processed, 2 invalid -> 2.00% error rate)...")
    b2_events = build_events(100, 2, "s2_boundary")
    for evt in b2_events:
        producer.produce(evt)
    producer.flush()
    print("  -> Sent 100 events to real Kafka.")

    v_count = 0
    inv_count = 0
    for evt in b2_events:
        res = engine.validate_event(evt)
        if res.is_valid:
            v_count += 1
        else:
            inv_count += 1

    c2, h2, inc2 = service.evaluate_window(
        window_start=datetime.now(timezone.utc).isoformat(),
        window_end=datetime.now(timezone.utc).isoformat(),
        duration_seconds=10.0,
        processed=len(b2_events),
        valid=v_count,
        invalid=inv_count,
    )
    print(f"  -> Circuit State: {c2.value} | Pipeline Health: {h2.value} | Error Rate: {inv_count/len(b2_events):.2%}")
    assert c2 == CircuitState.CLOSED, f"Expected CLOSED, got {c2.value}"
    assert inc2 is None, "Incident should NOT be created for exact 2.00% boundary"
    print("  [PASS] Scenario 2 verified: 2.00% remains CLOSED (strict > 0.02 condition).")

    # -------------------------------------------------------------
    # Scenario 3: Threshold Breach Batch (100 events, 97 valid, 3 invalid = 3.00%)
    # -------------------------------------------------------------
    print("\n[SCENARIO 3] Producing Breach Batch (100 processed, 3 invalid -> 3.00% error rate)...")
    b3_events = build_events(100, 3, "s3_breach")
    for evt in b3_events:
        producer.produce(evt)
    producer.flush()
    print("  -> Sent 100 events to real Kafka.")

    v_count = 0
    inv_count = 0
    for evt in b3_events:
        res = engine.validate_event(evt)
        if res.is_valid:
            v_count += 1
        else:
            inv_count += 1

    c3, h3, inc3 = service.evaluate_window(
        window_start=datetime.now(timezone.utc).isoformat(),
        window_end=datetime.now(timezone.utc).isoformat(),
        duration_seconds=10.0,
        processed=len(b3_events),
        valid=v_count,
        invalid=inv_count,
    )
    print(f"  -> Circuit State: {c3.value} | Pipeline Health: {h3.value} | Error Rate: {inv_count/len(b3_events):.2%}")
    assert c3 == CircuitState.OPEN, f"Expected OPEN, got {c3.value}"
    assert inc3 is not None, "Incident MUST be created on breach"
    assert inc3.status == IncidentStatus.OPEN
    assert inc3.error_rate == 0.03
    print(f"  [PASS] Scenario 3 verified: 3.00% trips to OPEN. Created Incident: {inc3.incident_id}")

    # -------------------------------------------------------------
    # Scenario 4: Controlled Recovery Probe (HALF_OPEN -> Healthy -> CLOSED)
    # -------------------------------------------------------------
    print("\n[SCENARIO 4] Initiating Controlled Recovery Probe (HALF_OPEN)...")
    assert service.initiate_recovery() is True
    assert service.circuit_breaker.state == CircuitState.HALF_OPEN
    print("  -> Circuit transitioned to HALF_OPEN. Active incident marked RESOLVING.")

    print("  -> Producing Real Recovery Probe Batch (100 processed, 0 invalid = 0.00% error rate)...")
    b4_events = build_events(100, 0, "s4_recovery")
    for evt in b4_events:
        producer.produce(evt)
    producer.flush()
    print("  -> Sent 100 events to real Kafka.")

    v_count = 0
    inv_count = 0
    for evt in b4_events:
        res = engine.validate_event(evt)
        if res.is_valid:
            v_count += 1
        else:
            inv_count += 1

    c4, h4, inc4 = service.evaluate_window(
        window_start=datetime.now(timezone.utc).isoformat(),
        window_end=datetime.now(timezone.utc).isoformat(),
        duration_seconds=10.0,
        processed=len(b4_events),
        valid=v_count,
        invalid=inv_count,
    )
    print(f"  -> Circuit State: {c4.value} | Pipeline Health: {h4.value} | Error Rate: {inv_count/len(b4_events):.2%}")
    assert c4 == CircuitState.CLOSED, f"Expected CLOSED, got {c4.value}"
    assert h4 == PipelineState.HEALTHY, f"Expected HEALTHY, got {h4.value}"
    assert inc4 is not None and inc4.status == IncidentStatus.RESOLVED
    print(f"  [PASS] Scenario 4 verified: Recovery confirmed. Incident {inc4.incident_id} marked RESOLVED.")

    producer.close()

    # -------------------------------------------------------------
    # Scenario 5: Persistence & Restart Audit
    # -------------------------------------------------------------
    print("\n[SCENARIO 5] Verifying Persistence Across Service Re-initialization...")
    fresh_service = get_observability_service()
    persisted_inc = fresh_service.get_incident(inc3.incident_id)
    assert persisted_inc is not None
    assert persisted_inc.incident_id == inc3.incident_id
    assert persisted_inc.status == IncidentStatus.RESOLVED
    print(f"  [PASS] Scenario 5 verified: Persisted incident {persisted_inc.incident_id} successfully loaded from SQLite.")

    print("\n=================================================================")
    print("    ALL MASTER 6 LIVE SCENARIOS COMPLETED AND VERIFIED!          ")
    print("=================================================================")


if __name__ == "__main__":
    run_live_scenarios()

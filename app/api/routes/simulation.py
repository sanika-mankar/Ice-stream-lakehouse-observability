"""Simulation, Ingestion, and Demo Engine route handlers for Ice Stream."""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.ingestion.generator import TransactionGenerator
from app.observability.models import CircuitState, PipelineState
from app.observability.service import get_observability_service
from app.validation.engine import ValidationEngine
from app.validation.registry import ValidationRegistry
from app.validation.required_fields import RequiredFieldsValidator, NullRequiredFieldValidator
from app.validation.types import TypeValidator
from app.validation.business_rules import RangeValidator, EnumValidator
from app.validation.schema import SchemaMismatchValidator, SchemaVersionValidator
from app.api.websockets import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/simulation", tags=["Simulation"])
ingest_router = APIRouter(tags=["Ingestion"])

# Global singleton for validation engine
_engine: Optional[ValidationEngine] = None
_seen_event_ids: set[str] = set()
_stream_task: Optional[asyncio.Task] = None
_stream_running: bool = False
_stream_error_rate: float = 0.0


def get_engine() -> ValidationEngine:
    global _engine
    if _engine is None:
        registry = ValidationRegistry()
        registry.register(RequiredFieldsValidator())      # DQ-001
        registry.register(NullRequiredFieldValidator())  # DQ-002
        registry.register(TypeValidator())               # DQ-003
        registry.register(RangeValidator())              # DQ-004
        registry.register(EnumValidator())               # DQ-005
        registry.register(SchemaMismatchValidator())     # DQ-007
        registry.register(SchemaVersionValidator())      # DQ-008
        _engine = ValidationEngine(registry)
    return _engine


def _extract_violation_metadata(evt: Dict[str, Any], errors: List[str]) -> Dict[str, Any]:
    """Helper to extract field, expected, actual, and rule ID from validation error messages."""
    rule_id = "DQ-001"
    field_name = "unknown"
    expected_val = "Valid value"
    actual_val = "Invalid"
    severity = "critical"

    error_text = " ".join(errors)

    if "DQ-001" in error_text or "Missing required field" in error_text:
        rule_id = "DQ-001"
        severity = "critical"
        expected_val = "Required field present"
        # Find which field was missing
        for f in ["customer_id", "event_id", "transaction_id", "product_id", "amount", "unit_price", "currency"]:
            if f not in evt:
                field_name = f
                actual_val = "Missing (None)"
                break

    elif "DQ-002" in error_text or "Null required field" in error_text:
        rule_id = "DQ-002"
        severity = "critical"
        expected_val = "Non-null value"
        for f in ["customer_id", "event_id", "transaction_id", "product_id", "unit_price", "currency"]:
            if f in evt and evt[f] is None:
                field_name = f
                actual_val = "null"
                break

    elif "DQ-003" in error_text or "Invalid type" in error_text or "must be integer" in error_text or "must be float" in error_text:
        rule_id = "DQ-003"
        severity = "error"
        expected_val = "Numeric (int/float)"
        if isinstance(evt.get("quantity"), str):
            field_name = "quantity"
            actual_val = f"'{evt.get('quantity')}' (string)"
        elif isinstance(evt.get("unit_price"), str):
            field_name = "unit_price"
            actual_val = f"'{evt.get('unit_price')}' (string)"
        else:
            field_name = "field_type"
            actual_val = "Type mismatch"

    elif "DQ-004" in error_text or "Invalid range" in error_text or "positive" in error_text:
        rule_id = "DQ-004"
        severity = "error"
        field_name = "unit_price"
        expected_val = "amount > 0 and <= 1,000,000"
        actual_val = str(evt.get("unit_price", -1.0))

    elif "DQ-005" in error_text or "Invalid enum" in error_text or "domain" in error_text:
        rule_id = "DQ-005"
        severity = "warning"
        field_name = "status"
        expected_val = "['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED']"
        actual_val = str(evt.get("status", "UNKNOWN"))

    elif "DQ-006" in error_text or "Duplicate event" in error_text:
        rule_id = "DQ-006"
        severity = "warning"
        field_name = "event_id"
        expected_val = "Globally unique event_id"
        actual_val = f"Duplicate {evt.get('event_id')}"

    elif "DQ-007" in error_text or "Schema mismatch" in error_text or "unauthorized" in error_text:
        rule_id = "DQ-007"
        severity = "critical"
        field_name = "payload_schema"
        expected_val = "Canonical transaction schema"
        actual_val = "Drift / Extra unexpected attributes"

    elif "DQ-008" in error_text or "Unknown schema version" in error_text:
        rule_id = "DQ-008"
        severity = "critical"
        field_name = "schema_version"
        expected_val = "Supported schema version ('1.0')"
        actual_val = str(evt.get("schema_version", "99.0"))

    return {
        "rule_id": rule_id,
        "field": field_name,
        "expected": expected_val,
        "actual": actual_val,
        "severity": severity,
    }


def process_event_batch(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Validates an event batch, stores quarantine records, updates metrics, and triggers WS update."""
    engine = get_engine()
    service = get_observability_service()
    now_iso = datetime.now(timezone.utc).isoformat()

    valid_count = 0
    invalid_count = 0
    quarantined_records = []

    for evt in events:
        event_id = evt.get("event_id") or f"evt-{uuid.uuid4().hex[:8]}"
        is_duplicate = event_id in _seen_event_ids
        _seen_event_ids.add(event_id)

        res = engine.validate_event(evt)
        errors = list(res.errors)

        if is_duplicate:
            errors.append("Duplicate event detected (DQ-006)")

        if res.is_valid and not is_duplicate:
            valid_count += 1
        else:
            invalid_count += 1
            meta = _extract_violation_metadata(evt, errors)
            q_rec = {
                "id": f"qr-{uuid.uuid4().hex[:10]}",
                "event_id": event_id,
                "transaction_id": evt.get("transaction_id", f"tx-{uuid.uuid4().hex[:6]}"),
                "rule_id": meta["rule_id"],
                "field": meta["field"],
                "expected": meta["expected"],
                "actual": meta["actual"],
                "source": evt.get("source", "web_store"),
                "schema_version": evt.get("schema_version", "1.0"),
                "severity": meta["severity"],
                "timestamp": now_iso,
                "raw_payload": evt,
                "error_details": errors,
            }
            service.repo.save_quarantine_record(q_rec)
            quarantined_records.append(q_rec)

    total_count = len(events)
    # Window evaluation
    circuit_state, pipeline_state, incident = service.evaluate_window(
        window_start=now_iso,
        window_end=now_iso,
        duration_seconds=5.0,
        processed=total_count,
        valid=valid_count,
        invalid=invalid_count,
        last_event_time=now_iso,
    )

    # Sync live snapshot
    snap = service.get_snapshot().to_dict()
    active_incidents = [inc.to_dict() for inc in service.get_active_incidents()]
    snap["active_incidents"] = active_incidents

    # Async broadcast
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(ws_manager.broadcast("metrics_update", snap))
    except Exception:
        pass

    return {
        "success": True,
        "processed": total_count,
        "valid": valid_count,
        "invalid": invalid_count,
        "circuit_state": circuit_state.value,
        "pipeline_state": pipeline_state.value,
        "incident_created": incident.incident_id if incident else None,
        "quarantined_count": len(quarantined_records),
        "snapshot": snap,
    }


class ProduceBatchRequest(BaseModel):
    count: int = 50
    error_rate: float = 0.0
    scenario: Optional[str] = None  # 'healthy', 'degradation', 'incident', 'recovery'


@router.post("/produce", response_model=Dict[str, Any])
def produce_batch(req: ProduceBatchRequest) -> Dict[str, Any]:
    """Generates a batch of synthetic transactions and validates them through the pipeline."""
    service = get_observability_service()

    if req.scenario == "recovery":
        # First initiate recovery on circuit breaker
        service.initiate_recovery()
        # Produce 25 clean transactions to verify probe recovery
        generator = TransactionGenerator(error_rate=0.0)
        events = [generator.generate_event() for _ in range(25)]
        return process_event_batch(events)

    error_rate = req.error_rate
    count = req.count

    if req.scenario == "healthy":
        error_rate = 0.0
        count = max(count, 30)
    elif req.scenario == "degradation":
        error_rate = 0.015  # 1.5% errors (under strict 2% threshold, so warnings show but circuit stays CLOSED)
        count = max(count, 50)
    elif req.scenario == "incident":
        error_rate = 0.08   # 8% errors (exceeds strict 2% threshold, immediately trips Circuit Breaker to OPEN)
        count = max(count, 50)

    generator = TransactionGenerator(error_rate=error_rate)
    events = [generator.generate_event() for _ in range(count)]

    # If scenario is incident, ensure at least 3 invalid events so it strictly trips
    if req.scenario == "incident":
        bad_count = sum(1 for e in events if "customer_id" not in e or e.get("unit_price", 0) < 0)
        if bad_count < 3:
            # Force 4 bad events
            for i in range(min(4, len(events))):
                events[i]["unit_price"] = -50.0

    return process_event_batch(events)


class InjectRequest(BaseModel):
    rule_id: str  # 'DQ-001'..'DQ-008', 'breaker_trip', 'load_warning'
    count: int = 1


@router.post("/inject", response_model=Dict[str, Any])
def inject_violation(req: InjectRequest) -> Dict[str, Any]:
    """Injects a specific canonical data quality violation into the pipeline."""
    now_str = datetime.now(timezone.utc).isoformat()
    rule = req.rule_id.upper()
    events = []

    for i in range(req.count):
        uid = uuid.uuid4().hex[:6]
        base_evt = {
            "event_id": f"inject-{rule.lower()}-{i}-{uid}",
            "transaction_id": f"tx-inj-{uid}",
            "event_time": now_str,
            "customer_id": f"cust-inj-{i}",
            "product_id": "PROD-001",
            "quantity": 2,
            "unit_price": 89.99,
            "currency": "USD",
            "status": "COMPLETED",
            "payment_method": "CREDIT_CARD",
            "source": "demo_injector",
            "schema_version": "1.0",
            "metadata": {"injected_rule": rule},
        }

        if rule == "DQ-001":
            del base_evt["customer_id"]
        elif rule == "DQ-002":
            base_evt["customer_id"] = None
        elif rule == "DQ-003":
            base_evt["quantity"] = "three"
        elif rule == "DQ-004":
            base_evt["unit_price"] = -45.00
        elif rule == "DQ-005":
            base_evt["status"] = "DELIVERED_INVALID"
        elif rule == "DQ-006":
            # Reuse a known event_id
            if _seen_event_ids:
                base_evt["event_id"] = list(_seen_event_ids)[0]
            else:
                _seen_event_ids.add("replayed-evt-001")
                base_evt["event_id"] = "replayed-evt-001"
        elif rule == "DQ-007":
            base_evt["unauthorized_drift_field"] = "unexpected_column_value"
        elif rule == "DQ-008":
            base_evt["schema_version"] = "99.0"
        elif rule in ("BREAKER_TRIP", "BREACH"):
            # Trip circuit breaker by creating 10 invalid events
            base_evt["unit_price"] = -999.0
        else:
            base_evt["unit_price"] = -10.0

        events.append(base_evt)

    # If breaker_trip, add a few events with high error rate
    if rule in ("BREAKER_TRIP", "BREACH"):
        extra_bad = []
        for j in range(5):
            bad = dict(events[0])
            bad["event_id"] = f"trip-{j}-{uuid.uuid4().hex[:6]}"
            bad["unit_price"] = -100.0
            extra_bad.append(bad)
        events.extend(extra_bad)

    return process_event_batch(events)


@router.post("/reset", response_model=Dict[str, Any])
def reset_simulation() -> Dict[str, Any]:
    """Resets all metrics, circuit breaker state, incidents, and quarantine storage."""
    service = get_observability_service()
    service.circuit_breaker.set_state(CircuitState.CLOSED)
    service.circuit_breaker._recovery_attempts = 0
    service.health_evaluator._current_state = PipelineState.HEALTHY

    # Mark active incidents resolved
    service.incident_manager.resolve_active_incidents(resolution_reason="Simulation reset by operator")

    # Clear quarantine records
    service.repo.clear_quarantine_records()
    _seen_event_ids.clear()

    # Clear metrics aggregator history
    with service.metrics_aggregator._lock:
        service.metrics_aggregator._processed_total = 0
        service.metrics_aggregator._valid_total = 0
        service.metrics_aggregator._invalid_total = 0
        service.metrics_aggregator._history.clear()
        service.metrics_aggregator._latest_window = None

    snap = service.get_snapshot().to_dict()
    snap["active_incidents"] = []

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(ws_manager.broadcast("metrics_update", snap))
    except Exception:
        pass

    return {"success": True, "message": "Simulation and pipeline reset to initial clean state", "snapshot": snap}


async def _background_streamer():
    """Continuously generates simulated events at 5 events/sec."""
    global _stream_running, _stream_error_rate
    gen = TransactionGenerator(error_rate=_stream_error_rate)
    while _stream_running:
        try:
            batch = [gen.generate_event() for _ in range(5)]
            process_event_batch(batch)
            await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in simulation streamer: {e}")
            await asyncio.sleep(2.0)


@router.post("/stream/start", response_model=Dict[str, Any])
async def start_stream(error_rate: float = 0.0) -> Dict[str, Any]:
    """Starts the continuous background streaming simulator."""
    global _stream_task, _stream_running, _stream_error_rate
    _stream_error_rate = error_rate
    if _stream_running and _stream_task and not _stream_task.done():
        return {"status": "already_running", "error_rate": _stream_error_rate}

    _stream_running = True
    _stream_task = asyncio.create_task(_background_streamer())
    return {"status": "started", "error_rate": _stream_error_rate}


@router.post("/stream/stop", response_model=Dict[str, Any])
def stop_stream() -> Dict[str, Any]:
    """Stops the continuous background streaming simulator."""
    global _stream_task, _stream_running
    _stream_running = False
    if _stream_task and not _stream_task.done():
        _stream_task.cancel()
    return {"status": "stopped"}


@router.get("/stream/status", response_model=Dict[str, Any])
def stream_status() -> Dict[str, Any]:
    """Checks the status of the background stream simulator."""
    return {"running": _stream_running, "error_rate": _stream_error_rate}


# Ingest endpoint for external producers / CLI scripts
class IngestPayload(BaseModel):
    events: Optional[List[Dict[str, Any]]] = None
    event: Optional[Dict[str, Any]] = None


@ingest_router.post("/api/ingest", response_model=Dict[str, Any])
def ingest_events(payload: IngestPayload) -> Dict[str, Any]:
    """Direct ingestion endpoint for Python scripts or external producers."""
    events = []
    if payload.events:
        events.extend(payload.events)
    if payload.event:
        events.append(payload.event)

    if not events:
        raise HTTPException(status_code=400, detail="No events provided in payload")

    return process_event_batch(events)

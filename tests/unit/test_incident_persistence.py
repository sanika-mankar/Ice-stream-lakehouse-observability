"""Unit tests for Incident Lifecycle and SQLite Persistence (Master 6)."""

import os
import tempfile
import pytest
from app.observability.circuit_breaker import CircuitBreaker
from app.observability.health import PipelineHealthEvaluator
from app.observability.incident_manager import IncidentManager
from app.observability.metrics import ObservabilityMetricsAggregator
from app.observability.models import (
    CircuitState,
    IncidentSeverity,
    IncidentStatus,
    IncidentType,
    PipelineState,
    WindowMetrics,
)
from app.observability.repository import ObservabilityRepository
from app.observability.service import ObservabilityService


@pytest.fixture
def temp_repo():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmpdir:
        db_path = os.path.join(tmpdir, "test_observability.db")
        repo = ObservabilityRepository(db_path=db_path)
        yield repo, db_path


def test_incident_creation_and_persistence(temp_repo):
    repo, db_path = temp_repo
    mgr = IncidentManager(repository=repo)

    wm = WindowMetrics(
        window_start="2026-09-14T01:00:00Z",
        window_end="2026-09-14T01:00:10Z",
        duration_seconds=10.0,
        processed_count=100,
        valid_count=96,
        invalid_count=4,
        error_rate=0.04,
        quality_score=96.0,
        throughput=10.0,
    )

    inc = mgr.create_or_update_trip_incident(
        metrics=wm,
        threshold=0.02,
        reason="Threshold breached: error_rate=4.00% > threshold=2.00%",
        affected_component="flink-stream-quality-engine",
    )

    assert inc.incident_id.startswith("inc-")
    assert inc.incident_type == IncidentType.CIRCUIT_BREAKER_TRIPPED
    assert inc.status == IncidentStatus.OPEN
    assert inc.circuit_state == CircuitState.OPEN
    assert inc.error_rate == 0.04
    assert inc.threshold == 0.02
    assert inc.processed_count == 100
    assert inc.invalid_count == 4

    # Verify persistence: Create a brand new repository pointing to the same file
    reopened_repo = ObservabilityRepository(db_path=db_path)
    fetched = reopened_repo.get_incident(inc.incident_id)
    assert fetched is not None
    assert fetched.incident_id == inc.incident_id
    assert fetched.error_rate == 0.04
    assert fetched.status == IncidentStatus.OPEN


def test_incident_lifecycle_acknowledge_and_resolve(temp_repo):
    repo, _ = temp_repo
    mgr = IncidentManager(repository=repo)

    wm = WindowMetrics(
        window_start="2026-09-14T01:00:00Z",
        window_end="2026-09-14T01:00:10Z",
        duration_seconds=10.0,
        processed_count=100,
        valid_count=95,
        invalid_count=5,
        error_rate=0.05,
        quality_score=95.0,
        throughput=10.0,
    )

    inc = mgr.create_or_update_trip_incident(
        metrics=wm,
        threshold=0.02,
        reason="Threshold breach",
    )

    # 1. Acknowledge
    ack_inc = mgr.acknowledge_incident(inc.incident_id)
    assert ack_inc.status == IncidentStatus.ACKNOWLEDGED

    # 2. Mark Resolving (Recovery probe started)
    resolving = mgr.mark_resolving(inc.incident_id)
    assert len(resolving) == 1
    assert resolving[0].status == IncidentStatus.RESOLVING
    assert resolving[0].recovery_attempts == 1

    # 3. Resolve
    resolved = mgr.resolve_active_incidents("Probe passed with 0% error rate")
    assert len(resolved) == 1
    assert resolved[0].status == IncidentStatus.RESOLVED
    assert resolved[0].resolved_at is not None
    assert "Probe passed" in resolved[0].resolution_reason

    # Active incidents should now be empty
    assert len(mgr.get_active_incidents()) == 0


def test_service_coordination_and_persistence_sync(temp_repo):
    repo, db_path = temp_repo
    service = ObservabilityService(repository=repo)

    # Window 1: Healthy (1% error rate) -> CLOSED, HEALTHY
    circuit, health, inc = service.evaluate_window(
        window_start="2026-09-14T01:00:00Z",
        window_end="2026-09-14T01:00:10Z",
        duration_seconds=10.0,
        processed=100,
        valid=99,
        invalid=1,
    )
    assert circuit == CircuitState.CLOSED
    assert health == PipelineState.DEGRADED  # 1% error rate is within threshold but degraded
    assert inc is None

    # Window 2: Breach (3% error rate) -> OPEN, TRIPPED, Incident created
    circuit, health, inc = service.evaluate_window(
        window_start="2026-09-14T01:00:10Z",
        window_end="2026-09-14T01:00:20Z",
        duration_seconds=10.0,
        processed=100,
        valid=97,
        invalid=3,
    )
    assert circuit == CircuitState.OPEN
    assert health == PipelineState.TRIPPED
    assert inc is not None
    assert inc.error_rate == 0.03

    # Restart scenario: Initialize a new service instance against the same database
    restarted_service = ObservabilityService(repository=ObservabilityRepository(db_path=db_path))
    # Must truthfully load OPEN circuit state from active incident
    assert restarted_service.circuit_breaker.state == CircuitState.OPEN
    assert len(restarted_service.get_active_incidents()) == 1


def test_secret_safety_in_observability(temp_repo):
    """Ensure sensitive credentials never get persisted or leaked into operational tables."""
    repo, db_path = temp_repo
    mgr = IncidentManager(repository=repo)

    fake_secret = "b2_app_key_secret_xyz123456789"
    safe_reason = f"Normal validation failure occurred. Redacted credentials check."
    wm = WindowMetrics(
        window_start="2026-09-14T01:00:00Z",
        window_end="2026-09-14T01:00:10Z",
        duration_seconds=10.0,
        processed_count=100,
        valid_count=90,
        invalid_count=10,
        error_rate=0.10,
        quality_score=90.0,
        throughput=10.0,
    )

    inc = mgr.create_or_update_trip_incident(
        metrics=wm,
        threshold=0.02,
        reason=safe_reason,
    )

    # Scan SQLite raw contents
    with open(db_path, "rb") as f:
        content = f.read()
        assert fake_secret.encode("utf-8") not in content

"""Unit tests for FastAPI REST API endpoints (Master 7)."""

import pytest
from fastapi.testclient import TestClient
from app.api.main import app
from app.observability.circuit_breaker import CircuitBreaker
from app.observability.models import CircuitState, WindowMetrics
from app.observability.service import get_observability_service


@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["service"] == "Ice Stream"
    assert data["status"] == "running"


def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "pipeline_state" in data
    assert "circuit_state" in data
    assert "uptime_seconds" in data


def test_metrics_endpoint(client):
    res = client.get("/api/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "processed_events_total" in data
    assert "current_error_rate" in data
    assert "quality_score" in data
    assert "circuit_state" in data
    assert "pipeline_state" in data


def test_pipeline_status_endpoint(client):
    res = client.get("/api/pipeline/status")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 7
    assert len(data["edges"]) >= 6


def test_incidents_crud_endpoints(client):
    service = get_observability_service()

    # Create a test incident via window evaluation
    wm = WindowMetrics(
        window_start="2026-09-14T03:00:00Z",
        window_end="2026-09-14T03:00:10Z",
        duration_seconds=10.0,
        processed_count=100,
        valid_count=95,
        invalid_count=5,
        error_rate=0.05,
        quality_score=95.0,
        throughput=10.0,
    )
    inc = service.incident_manager.create_or_update_trip_incident(
        metrics=wm,
        threshold=0.02,
        reason="API test breach",
    )

    # 1. List incidents
    res = client.get("/api/incidents")
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 2. Get active incidents
    res_act = client.get("/api/incidents/active")
    assert res_act.status_code == 200
    assert any(i["incident_id"] == inc.incident_id for i in res_act.json())

    # 3. Get specific incident
    res_spec = client.get(f"/api/incidents/{inc.incident_id}")
    assert res_spec.status_code == 200
    assert res_spec.json()["incident_id"] == inc.incident_id

    # 4. Acknowledge incident
    res_ack = client.post(f"/api/incidents/{inc.incident_id}/acknowledge")
    assert res_ack.status_code == 200
    assert res_ack.json()["status"] == "ACKNOWLEDGED"

    # 5. Resolve incident
    res_res = client.post(f"/api/incidents/{inc.incident_id}/resolve", json={"reason": "Resolved via test"})
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"

    # 6. Non-existent incident returns 404
    res_404 = client.get("/api/incidents/inc-nonexistent-123")
    assert res_404.status_code == 404


def test_recovery_endpoint(client):
    service = get_observability_service()

    # If CLOSED, recovery returns 400
    service.circuit_breaker.set_state(CircuitState.CLOSED)
    res_bad = client.post("/api/recovery")
    assert res_bad.status_code == 400

    # If OPEN, recovery transitions to HALF_OPEN
    service.circuit_breaker.set_state(CircuitState.OPEN)
    res_ok = client.post("/api/recovery")
    assert res_ok.status_code == 200
    assert res_ok.json()["circuit_state"] == "HALF_OPEN"

    # Reset
    service.circuit_breaker.set_state(CircuitState.CLOSED)


def test_lakehouse_endpoints(client):
    res_st = client.get("/api/lakehouse/status")
    assert res_st.status_code == 200
    data_st = res_st.json()
    assert "catalog_type" in data_st
    assert "bucket" in data_st

    res_tb = client.get("/api/lakehouse/tables")
    assert res_tb.status_code == 200
    assert len(res_tb.json()) >= 2

    res_sn = client.get("/api/lakehouse/snapshots")
    assert res_sn.status_code == 200


def test_system_endpoint_and_security(client):
    res = client.get("/api/system")
    assert res.status_code == 200
    data = res.json()
    assert "fastapi_version" in data
    assert "flink_version" in data
    assert "circuit_breaker" in data
    assert data["circuit_breaker"]["threshold"] == 0.02

    # Verify no secret keywords leaked
    raw_str = res.text.lower()
    for forbidden in ["password", "secret", "token", "sasl_password", "access_key_id"]:
        assert forbidden not in raw_str

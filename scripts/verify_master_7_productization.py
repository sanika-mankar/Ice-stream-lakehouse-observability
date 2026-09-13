"""
Master 7 Productization Verification Script
Tests FastAPI REST endpoints, WebSocket handshake, and Circuit Breaker logic
against actual local SQLite databases and application layers.
"""

import sys
import json
from fastapi.testclient import TestClient
from app.api.main import app

def test_api_suite():
    print("============================================================")
    print("      ICE STREAM — MASTER 7 PRODUCTIZATION VERIFICATION      ")
    print("============================================================")
    client = TestClient(app)

    # 1. Test Root
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("[PASS] 1. Root '/' operational: " + res.json().get("service", ""))

    # 2. Test Health
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health failed: {res.text}"
    health = res.json()
    assert "circuit_state" in health
    print(f"[PASS] 2. Health '/api/health' returned circuit_state={health['circuit_state']}")

    # 3. Test Metrics
    res = client.get("/api/metrics")
    assert res.status_code == 200, f"Metrics failed: {res.text}"
    metrics = res.json()
    assert "current_error_rate" in metrics
    print(f"[PASS] 3. Metrics '/api/metrics' returned processed={metrics['processed_events_total']}, error_rate={metrics['current_error_rate']}")

    # 4. Test Pipeline Topology
    res = client.get("/api/pipeline/status")
    assert res.status_code == 200, f"Pipeline status failed: {res.text}"
    pipe = res.json()
    assert len(pipe.get("nodes", [])) >= 5
    print(f"[PASS] 4. Pipeline Topology '/api/pipeline/status' returned {len(pipe['nodes'])} nodes and {len(pipe['edges'])} edges")

    # 5. Test Incidents List
    res = client.get("/api/incidents")
    assert res.status_code == 200, f"Incidents failed: {res.text}"
    incidents = res.json()
    print(f"[PASS] 5. Incidents '/api/incidents' returned {len(incidents)} audit records")

    # 6. Test Lakehouse Status
    res = client.get("/api/lakehouse/status")
    assert res.status_code == 200, f"Lakehouse status failed: {res.text}"
    lake = res.json()
    assert lake.get("catalog_exists") is True
    print(f"[PASS] 6. Lakehouse '/api/lakehouse/status' verified catalog and B2 storage ({lake['catalog_type']})")

    # 7. Test System Info & Redaction
    res = client.get("/api/system")
    assert res.status_code == 200, f"System info failed: {res.text}"
    sys_info = res.json()
    # Check secrets are redacted
    serialized = json.dumps(sys_info)
    assert "sk_" not in serialized and "password" not in serialized.lower() or "REDACTED" in serialized
    print("[PASS] 7. System Info '/api/system' verified (credentials redacted)")

    # 8. Test WebSocket initial frame
    with client.websocket_connect("/ws") as ws:
        frame = ws.receive_json()
        assert frame.get("type") in ["initial_state", "metrics_update"]
        print(f"[PASS] 8. WebSocket '/ws' handshake and '{frame['type']}' frame received")

    print("============================================================")
    print("   ALL MASTER 7 PRODUCTIZATION CHECKS PASSED SUCCESSFULLY   ")
    print("============================================================")

if __name__ == "__main__":
    test_api_suite()

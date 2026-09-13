"""Unit tests for WebSocket streaming (Master 7)."""

import json
import pytest
from fastapi.testclient import TestClient
from app.api.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_websocket_connection_and_initial_snapshot(client):
    with client.websocket_connect("/ws") as ws:
        # Receive immediate initial state
        raw = ws.receive_text()
        msg = json.loads(raw)
        assert msg["type"] == "initial_state"
        payload = msg["payload"]
        assert "circuit_state" in payload
        assert "pipeline_state" in payload
        assert "processed_events_total" in payload

        # Test ping/pong
        ws.send_text(json.dumps({"type": "ping"}))
        found_pong = False
        for _ in range(5):
            raw_resp = ws.receive_text()
            msg_resp = json.loads(raw_resp)
            if msg_resp["type"] == "pong":
                found_pong = True
                break
        assert found_pong

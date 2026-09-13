"""Real-time WebSocket streaming manager for Ice Stream (Master 7).

Streams live operational metrics, health, circuit breaker state changes,
and incident updates to connected monitoring dashboards.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.observability.service import get_observability_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


class WebSocketConnectionManager:
    """Manages active WebSocket client connections and broadcasts live operational events."""

    def __init__(self, max_connections: int = 100):
        self.active_connections: List[WebSocket] = []
        self._max_connections = max_connections
        self._broadcast_task: Optional[asyncio.Task] = None
        self._last_state: Optional[str] = None
        self._last_processed: int = -1

    async def connect(self, websocket: WebSocket) -> bool:
        if len(self.active_connections) >= self._max_connections:
            logger.warning("Max WebSocket connections reached. Rejecting connection.")
            await websocket.close(code=1008, reason="Max connection capacity reached")
            return False

        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self.active_connections)}")

        # Send immediate initial state so the client doesn't wait
        try:
            snapshot = self._get_truthful_snapshot()
            await websocket.send_text(json.dumps({
                "type": "initial_state",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "payload": snapshot,
            }))
        except Exception as e:
            logger.error(f"Error sending initial state to WebSocket client: {e}")

        # Start broadcaster background loop if not already running
        if self._broadcast_task is None or self._broadcast_task.done():
            self._broadcast_task = asyncio.create_task(self._background_broadcaster())

        return True

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining connections: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, payload: Dict[str, Any]) -> None:
        """Broadcasts a structured JSON event to all active clients."""
        if not self.active_connections:
            return

        message = json.dumps({
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        })

        disconnected: List[WebSocket] = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

    def _get_truthful_snapshot(self) -> Dict[str, Any]:
        service = get_observability_service()
        snap = service.get_snapshot().to_dict()
        active = [inc.to_dict() for inc in service.get_active_incidents()]
        snap["active_incidents"] = active
        return snap

    async def _background_broadcaster(self) -> None:
        """Periodic background task that streams truthful updates to active dashboard clients."""
        while self.active_connections:
            try:
                snapshot = self._get_truthful_snapshot()
                curr_state = snapshot.get("circuit_state")
                curr_processed = snapshot.get("processed_events_total", 0)

                # Check for state transition
                if self._last_state is not None and self._last_state != curr_state:
                    await self.broadcast("circuit_state_changed", {
                        "previous_state": self._last_state,
                        "current_state": curr_state,
                        "error_rate": snapshot.get("current_error_rate", 0.0),
                    })
                self._last_state = curr_state
                self._last_processed = curr_processed

                # Regular metrics update
                await self.broadcast("metrics_update", snapshot)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in WebSocket broadcaster loop: {e}")

            await asyncio.sleep(1.5)

    def shutdown(self) -> None:
        """Stops background tasks and closes connections gracefully."""
        if self._broadcast_task and not self._broadcast_task.done():
            self._broadcast_task.cancel()


# Global WebSocket manager instance
ws_manager = WebSocketConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time streaming monitoring."""
    connected = await ws_manager.connect(websocket)
    if not connected:
        return

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                msg_type = msg.get("type")
                if msg_type == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }))
                elif msg_type == "get_snapshot":
                    snap = ws_manager._get_truthful_snapshot()
                    await websocket.send_text(json.dumps({
                        "type": "metrics_update",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "payload": snap,
                    }))
            except Exception:
                # Keep connection alive on non-JSON ping/messages
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket exception: {e}")
        ws_manager.disconnect(websocket)

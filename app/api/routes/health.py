"""Health route handler for Ice Stream (Master 7)."""

from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter
from app.observability.service import get_observability_service

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=Dict[str, Any])
def get_health() -> Dict[str, Any]:
    """Returns real operational pipeline and circuit breaker health."""
    service = get_observability_service()
    snap = service.get_snapshot()

    return {
        "status": snap.pipeline_state.value,
        "pipeline_state": snap.pipeline_state.value,
        "circuit_state": snap.circuit_state.value,
        "uptime_seconds": round(snap.uptime_seconds, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "Ice Stream",
        "version": "1.0.0",
    }

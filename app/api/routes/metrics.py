"""Metrics route handler for Ice Stream (Master 7)."""

from typing import Any, Dict
from fastapi import APIRouter
from app.observability.service import get_observability_service

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("", response_model=Dict[str, Any])
def get_metrics() -> Dict[str, Any]:
    """Returns authoritative streaming quality and circuit breaker metrics."""
    service = get_observability_service()
    snap = service.get_snapshot()

    return snap.to_dict()

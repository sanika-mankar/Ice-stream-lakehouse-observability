"""Circuit breaker recovery route handler for Ice Stream (Master 7)."""

from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from app.observability.models import CircuitState
from app.observability.service import get_observability_service

router = APIRouter(prefix="/recovery", tags=["Recovery"])


@router.post("", response_model=Dict[str, Any])
def trigger_recovery() -> Dict[str, Any]:
    """Initiates controlled recovery transition from OPEN to HALF_OPEN probe mode."""
    service = get_observability_service()
    current_state = service.circuit_breaker.state

    if current_state == CircuitState.CLOSED:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "INVALID_STATE_TRANSITION",
                    "message": "Circuit breaker is currently CLOSED. Recovery can only be initiated when state is OPEN.",
                }
            },
        )

    success = service.initiate_recovery()
    if not success:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "RECOVERY_FAILED",
                    "message": f"Unable to initiate recovery from state: {current_state.value}",
                }
            },
        )

    return {
        "success": True,
        "circuit_state": service.circuit_breaker.state.value,
        "recovery_attempts": service.circuit_breaker.recovery_attempts,
        "message": "Recovery initiated successfully. Circuit transitioned to HALF_OPEN awaiting real probe evaluation.",
    }

"""Real-time Circuit Breaker Engine for Ice Stream (Master 6).

Implements the strict deterministic state machine:
- CLOSED: Pipeline operating normally.
- OPEN: Tripped because error_rate > 2% (threshold: 0.02).
- HALF_OPEN: Controlled recovery probe state evaluating real traffic.
"""

import logging
import os
from typing import Optional, Tuple
from app.observability.models import CircuitState, WindowMetrics

logger = logging.getLogger(__name__)

# Default strict threshold: exactly 2.0%
DEFAULT_ERROR_RATE_THRESHOLD = 0.02


class CircuitBreakerTripException(Exception):
    """Raised when the circuit breaker trips to OPEN during streaming execution."""
    def __init__(self, message: str, error_rate: float, threshold: float, processed_count: int, invalid_count: int):
        super().__init__(message)
        self.error_rate = error_rate
        self.threshold = threshold
        self.processed_count = processed_count
        self.invalid_count = invalid_count


class CircuitBreaker:
    """Deterministic Circuit Breaker state machine.
    
    Invariant:
        Trip to OPEN occurs IF AND ONLY IF error_rate > threshold.
        error_rate == 0.0200 remains CLOSED.
        error_rate == 0.0201 trips to OPEN.
    """

    def __init__(
        self,
        threshold: Optional[float] = None,
        enabled: Optional[bool] = None,
        initial_state: CircuitState = CircuitState.CLOSED,
    ):
        if threshold is None:
            raw_thresh = os.getenv("CIRCUIT_BREAKER_ERROR_RATE_THRESHOLD", str(DEFAULT_ERROR_RATE_THRESHOLD))
            self.threshold = float(raw_thresh)
        else:
            self.threshold = float(threshold)

        if enabled is None:
            self.enabled = os.getenv("CIRCUIT_BREAKER_ENABLED", "true").lower() in ("true", "1", "yes")
        else:
            self.enabled = bool(enabled)

        self._state = initial_state
        self._recovery_attempts = 0

    @property
    def state(self) -> CircuitState:
        return self._state

    @property
    def recovery_attempts(self) -> int:
        return self._recovery_attempts

    def set_state(self, state: CircuitState) -> None:
        """Explicit state transition (e.g. upon recovery initiation or loading persisted state)."""
        old_state = self._state
        self._state = state
        if old_state != state:
            logger.info(f"[CIRCUIT STATE] Transitioned from {old_state.value} to {state.value}")

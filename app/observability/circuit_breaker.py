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

    def initiate_recovery(self) -> bool:
        """Transition from OPEN to HALF_OPEN to begin controlled recovery evaluation."""
        if self._state == CircuitState.OPEN:
            self._state = CircuitState.HALF_OPEN
            self._recovery_attempts += 1
            logger.info(
                f"[CIRCUIT HALF_OPEN] Initiated recovery attempt #{self._recovery_attempts}. "
                f"State is now HALF_OPEN awaiting real probe evaluation."
            )
            return True
        elif self._state == CircuitState.HALF_OPEN:
            logger.warning("[CIRCUIT HALF_OPEN] Already in HALF_OPEN recovery state.")
            return True
        else:
            logger.warning(f"[CIRCUIT STATE] Cannot initiate recovery while state is {self._state.value}.")
            return False

    def evaluate_window(self, metrics: WindowMetrics) -> Tuple[CircuitState, bool, str]:
        """Evaluates a 10-second tumbling window against the circuit breaker threshold.
        
        Returns:
            (new_state, state_changed, reason)
        """
        if not self.enabled:
            return self._state, False, "Circuit breaker disabled by configuration"

        # Non-negotiable condition: error_rate > threshold
        breached = metrics.error_rate > self.threshold
        state_changed = False
        reason = ""

        if self._state == CircuitState.CLOSED:
            if breached:
                self._state = CircuitState.OPEN
                state_changed = True
                reason = (
                    f"Threshold breached: error_rate={metrics.error_rate:.4f} ({metrics.error_rate:.2%}) > "
                    f"threshold={self.threshold:.4f} ({self.threshold:.2%}) "
                    f"[invalid={metrics.invalid_count}, processed={metrics.processed_count}]"
                )
                logger.error(f"[CIRCUIT OPEN] {reason}")
            else:
                reason = (
                    f"Healthy window: error_rate={metrics.error_rate:.4f} ({metrics.error_rate:.2%}) <= "
                    f"threshold={self.threshold:.4f} ({self.threshold:.2%})"
                )

        elif self._state == CircuitState.HALF_OPEN:
            if breached:
                self._state = CircuitState.OPEN
                state_changed = True
                reason = (
                    f"Recovery probe failed: error_rate={metrics.error_rate:.4f} ({metrics.error_rate:.2%}) > "
                    f"threshold={self.threshold:.4f} ({self.threshold:.2%}) during HALF_OPEN probe."
                )
                logger.error(f"[CIRCUIT OPEN] {reason}")
            else:
                # Real events processed with error_rate <= threshold confirms recovery
                if metrics.processed_count > 0:
                    self._state = CircuitState.CLOSED
                    state_changed = True
                    reason = (
                        f"Recovery probe passed: error_rate={metrics.error_rate:.4f} ({metrics.error_rate:.2%}) <= "
                        f"threshold={self.threshold:.4f} on real traffic [{metrics.processed_count} processed]. "
                        f"Circuit restored to CLOSED."
                    )
                    logger.info(f"[CIRCUIT RECOVERED] {reason}")
                else:
                    reason = "Zero-traffic window during HALF_OPEN probe; awaiting real events."

        elif self._state == CircuitState.OPEN:
            if breached:
                reason = f"Circuit remains OPEN (ongoing error_rate={metrics.error_rate:.2%})"
            else:
                reason = "Circuit remains OPEN until explicit recovery initiation (HALF_OPEN)."

        return self._state, state_changed, reason

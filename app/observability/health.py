"""Pipeline Health Evaluator for Ice Stream (Master 6).

Determines the operational health state of the streaming pipeline based on
circuit breaker state, error rates, and failure conditions:
- HEALTHY: Normal operation, 0% error rate.
- DEGRADED: Non-zero error rate but within safety threshold (<= 2%).
- TRIPPED: Circuit breaker tripped to OPEN (> 2%).
- RECOVERING: Controlled recovery probe in HALF_OPEN state.
- FAILED: Pipeline fatal crash or unrecoverable condition.
"""

import logging
from typing import Tuple
from app.observability.models import CircuitState, PipelineState, WindowMetrics

logger = logging.getLogger(__name__)


class PipelineHealthEvaluator:
    """Evaluates operational pipeline health consistently with the circuit breaker."""

    def __init__(self, initial_state: PipelineState = PipelineState.HEALTHY):
        self._current_state = initial_state

    @property
    def state(self) -> PipelineState:
        return self._current_state

    def set_failed(self, reason: str) -> None:
        self._current_state = PipelineState.FAILED
        logger.error(f"[PIPELINE FAILED] Pipeline state marked FAILED: {reason}")

    def evaluate(self, circuit_state: CircuitState, metrics: WindowMetrics) -> Tuple[PipelineState, str]:
        """Calculates current PipelineState given CircuitState and latest WindowMetrics."""
        old_state = self._current_state

        if circuit_state == CircuitState.OPEN:
            new_state = PipelineState.TRIPPED
            reason = f"Circuit breaker is OPEN (error_rate={metrics.error_rate:.2%})"
        elif circuit_state == CircuitState.HALF_OPEN:
            new_state = PipelineState.RECOVERING
            reason = f"Circuit breaker in HALF_OPEN recovery evaluation (processed={metrics.processed_count})"
        elif circuit_state == CircuitState.CLOSED:
            if metrics.error_rate == 0.0:
                new_state = PipelineState.HEALTHY
                reason = "All events valid; zero errors"
            else:
                new_state = PipelineState.DEGRADED
                reason = (
                    f"Errors detected within threshold: error_rate={metrics.error_rate:.2%} "
                    f"[invalid={metrics.invalid_count}, processed={metrics.processed_count}]"
                )
        else:
            new_state = PipelineState.HEALTHY
            reason = "Default operational baseline"

        self._current_state = new_state
        if old_state != new_state:
            logger.info(f"[PIPELINE HEALTH] Transitioned from {old_state.value} to {new_state.value}: {reason}")

        return new_state, reason

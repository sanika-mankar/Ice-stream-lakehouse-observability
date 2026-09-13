"""Unified Observability & Circuit Breaker Service for Ice Stream (Master 6).

Serves as the single authoritative backend operational facade, coordinating:
- Circuit Breaker state machine
- Incident lifecycle and persistence
- Pipeline health evaluation
- Real-time metrics aggregation
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from app.observability.circuit_breaker import CircuitBreaker, CircuitBreakerTripException
from app.observability.health import PipelineHealthEvaluator
from app.observability.incident_manager import IncidentManager
from app.observability.metrics import ObservabilityMetricsAggregator
from app.observability.models import (
    CircuitState,
    Incident,
    IncidentStatus,
    ObservabilitySnapshot,
    PipelineEvent,
    PipelineState,
    WindowMetrics,
)
from app.observability.repository import ObservabilityRepository

logger = logging.getLogger(__name__)


class ObservabilityService:
    """Authoritative backend service coordinating circuit state, incidents, and metrics."""

    def __init__(
        self,
        repository: Optional[ObservabilityRepository] = None,
        circuit_breaker: Optional[CircuitBreaker] = None,
        incident_manager: Optional[IncidentManager] = None,
        health_evaluator: Optional[PipelineHealthEvaluator] = None,
        metrics_aggregator: Optional[ObservabilityMetricsAggregator] = None,
    ):
        self.repo = repository or ObservabilityRepository()
        self.circuit_breaker = circuit_breaker or CircuitBreaker()
        self.incident_manager = incident_manager or IncidentManager(self.repo)
        self.health_evaluator = health_evaluator or PipelineHealthEvaluator()
        self.metrics_aggregator = metrics_aggregator or ObservabilityMetricsAggregator()

        # Synchronize initial circuit state with any active persisted incidents
        self._sync_state_from_persistence()

    def _sync_state_from_persistence(self) -> None:
        """Loads state from SQLite upon startup to preserve operational continuity."""
        active = self.repo.get_active_incidents()
        if active:
            latest = active[0]
            if latest.circuit_state in (CircuitState.OPEN, CircuitState.HALF_OPEN):
                self.circuit_breaker.set_state(latest.circuit_state)
                logger.info(
                    f"[CIRCUIT STATE SYNC] Loaded persisted active state: {latest.circuit_state.value} "
                    f"from incident {latest.incident_id}"
                )

    def evaluate_window(
        self,
        window_start: str,
        window_end: str,
        duration_seconds: float,
        processed: int,
        valid: int,
        invalid: int,
        last_event_time: Optional[str] = None,
    ) -> Tuple[CircuitState, PipelineState, Optional[Incident]]:
        """Processes an evaluation window through metrics, circuit breaker, and incident management."""
        # 1. Record metrics
        wm = self.metrics_aggregator.record_window(
            window_start=window_start,
            window_end=window_end,
            duration_seconds=duration_seconds,
            processed=processed,
            valid=valid,
            invalid=invalid,
            last_event_time=last_event_time,
        )

        prev_circuit = self.circuit_breaker.state

        # 2. Evaluate against strict threshold
        new_circuit, changed, reason = self.circuit_breaker.evaluate_window(wm)

        incident: Optional[Incident] = None
        now_iso = datetime.now(timezone.utc).isoformat()

        # 3. Handle state transitions
        if new_circuit == CircuitState.OPEN:
            # Create or update incident
            incident = self.incident_manager.create_or_update_trip_incident(
                metrics=wm,
                threshold=self.circuit_breaker.threshold,
                reason=reason,
            )
            if changed:
                self._record_audit_event(
                    event_type="CIRCUIT_BREAKER_TRIPPED",
                    pipeline_state=PipelineState.TRIPPED,
                    circuit_state=CircuitState.OPEN,
                    message=reason,
                    metadata=wm.to_dict(),
                )

        elif new_circuit == CircuitState.CLOSED and prev_circuit == CircuitState.HALF_OPEN and changed:
            # Recovery confirmed
            resolved_list = self.incident_manager.resolve_active_incidents(
                resolution_reason=f"Recovery confirmed: error_rate={wm.error_rate:.2%} <= threshold={self.circuit_breaker.threshold:.2%}"
            )
            if resolved_list:
                incident = resolved_list[0]
            self._record_audit_event(
                event_type="CIRCUIT_BREAKER_RECOVERED",
                pipeline_state=PipelineState.HEALTHY,
                circuit_state=CircuitState.CLOSED,
                message=reason,
                metadata=wm.to_dict(),
            )

        # 4. Evaluate pipeline health
        pipeline_state, _ = self.health_evaluator.evaluate(new_circuit, wm)

        return new_circuit, pipeline_state, incident

    def initiate_recovery(self) -> bool:
        """Initiates controlled recovery transition from OPEN to HALF_OPEN."""
        success = self.circuit_breaker.initiate_recovery()
        if success:
            self.incident_manager.mark_resolving()
            self._record_audit_event(
                event_type="PIPELINE_RECOVERY_INITIATED",
                pipeline_state=PipelineState.RECOVERING,
                circuit_state=CircuitState.HALF_OPEN,
                message="Recovery initiated; entering HALF_OPEN probe mode",
            )
        return success

    def _record_audit_event(
        self,
        event_type: str,
        pipeline_state: PipelineState,
        circuit_state: CircuitState,
        message: str,
        metadata: Optional[dict] = None,
    ) -> None:
        event = PipelineEvent(
            event_id=f"evt-{uuid.uuid4().hex[:12]}",
            event_type=event_type,
            event_time=datetime.now(timezone.utc).isoformat(),
            pipeline_state=pipeline_state,
            circuit_state=circuit_state,
            message=message,
            metadata=metadata or {},
        )
        self.repo.save_pipeline_event(event)

    def get_snapshot(self) -> ObservabilitySnapshot:
        """Generates a truthful, consolidated operational snapshot."""
        summary = self.metrics_aggregator.get_summary()
        active_incidents = self.repo.get_active_incidents()
        all_incidents = self.repo.list_incidents(limit=500)

        return ObservabilitySnapshot(
            processed_events_total=int(summary["processed_total"]),
            valid_events_total=int(summary["valid_total"]),
            invalid_events_total=int(summary["invalid_total"]),
            current_error_rate=float(summary["current_error_rate"]),
            quality_score=float(summary["current_quality_score"]),
            throughput_events_per_second=float(summary["current_throughput"]),
            circuit_state=self.circuit_breaker.state,
            pipeline_state=self.health_evaluator.state,
            incident_count=len(all_incidents),
            active_incident_count=len(active_incidents),
            recovery_attempts=self.circuit_breaker.recovery_attempts,
            last_successful_checkpoint=summary.get("last_successful_checkpoint"),
            last_event_time=summary.get("last_event_time"),
            uptime_seconds=float(summary["uptime_seconds"]),
        )

    def get_active_incidents(self) -> List[Incident]:
        return self.repo.get_active_incidents()

    def list_incidents(self, limit: int = 50) -> List[Incident]:
        return self.repo.list_incidents(limit)

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        return self.repo.get_incident(incident_id)

    def acknowledge_incident(self, incident_id: str) -> Optional[Incident]:
        return self.incident_manager.acknowledge_incident(incident_id)

    def resolve_incident(self, incident_id: str, reason: str) -> Optional[Incident]:
        inc = self.repo.get_incident(incident_id)
        if not inc:
            return None
        inc.status = IncidentStatus.RESOLVED
        now_iso = datetime.now(timezone.utc).isoformat()
        inc.resolved_at = now_iso
        inc.updated_at = now_iso
        inc.resolution_reason = reason
        self.repo.save_incident(inc)
        return inc


# Global singleton instance for in-process access
_default_service: Optional[ObservabilityService] = None


def get_observability_service() -> ObservabilityService:
    global _default_service
    if _default_service is None:
        _default_service = ObservabilityService()
    return _default_service

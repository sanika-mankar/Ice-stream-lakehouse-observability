"""Incident Management Engine for Ice Stream (Master 6).

Coordinates incident lifecycle (OPEN -> ACKNOWLEDGED -> RESOLVING -> RESOLVED),
ensuring persistent tracking and idempotent incident creation.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from app.observability.models import (
    CircuitState,
    Incident,
    IncidentSeverity,
    IncidentStatus,
    IncidentType,
    WindowMetrics,
)
from app.observability.repository import ObservabilityRepository

logger = logging.getLogger(__name__)


class IncidentManager:
    """Manages operational incidents with persistence in SQLite."""

    def __init__(self, repository: Optional[ObservabilityRepository] = None):
        self.repo = repository or ObservabilityRepository()

    def create_or_update_trip_incident(
        self,
        metrics: WindowMetrics,
        threshold: float,
        reason: str,
        affected_component: str = "flink-stream-quality-engine",
    ) -> Incident:
        """Creates an incident for a circuit breaker trip or updates an existing active incident."""
        now_iso = datetime.now(timezone.utc).isoformat()
        active = self.repo.get_active_incidents()

        # If there is already an active trip incident, update its metrics rather than creating duplicates
        for inc in active:
            if inc.incident_type == IncidentType.CIRCUIT_BREAKER_TRIPPED and inc.status in (
                IncidentStatus.OPEN,
                IncidentStatus.ACKNOWLEDGED,
                IncidentStatus.RESOLVING,
            ):
                inc.updated_at = now_iso
                inc.error_rate = metrics.error_rate
                inc.processed_count = metrics.processed_count
                inc.valid_count = metrics.valid_count
                inc.invalid_count = metrics.invalid_count
                inc.reason = reason
                self.repo.save_incident(inc)
                logger.info(
                    f"[INCIDENT UPDATED] incident_id={inc.incident_id} status={inc.status.value} "
                    f"error_rate={metrics.error_rate:.2%}"
                )
                return inc

        # Create brand new incident
        incident_id = f"inc-{uuid.uuid4().hex[:12]}"
        severity = IncidentSeverity.CRITICAL if metrics.error_rate >= (threshold * 2) else IncidentSeverity.HIGH

        incident = Incident(
            incident_id=incident_id,
            incident_type=IncidentType.CIRCUIT_BREAKER_TRIPPED,
            severity=severity,
            status=IncidentStatus.OPEN,
            created_at=now_iso,
            updated_at=now_iso,
            circuit_state=CircuitState.OPEN,
            error_rate=metrics.error_rate,
            threshold=threshold,
            processed_count=metrics.processed_count,
            valid_count=metrics.valid_count,
            invalid_count=metrics.invalid_count,
            window_start=metrics.window_start,
            window_end=metrics.window_end,
            reason=reason,
            affected_component=affected_component,
            recovery_attempts=0,
        )

        self.repo.save_incident(incident)
        logger.error(
            f"[INCIDENT CREATED] incident_id={incident.incident_id} type={incident.incident_type.value} "
            f"severity={incident.severity.value} error_rate={incident.error_rate:.2%} threshold={incident.threshold:.2%} "
            f"reason='{reason}'"
        )
        return incident

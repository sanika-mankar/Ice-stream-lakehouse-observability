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

    def mark_resolving(self, incident_id: Optional[str] = None) -> List[Incident]:
        """Marks active incident(s) as RESOLVING when recovery probe begins."""
        now_iso = datetime.now(timezone.utc).isoformat()
        active = self.repo.get_active_incidents()
        updated = []

        for inc in active:
            if incident_id is None or inc.incident_id == incident_id:
                inc.status = IncidentStatus.RESOLVING
                inc.circuit_state = CircuitState.HALF_OPEN
                inc.recovery_attempts += 1
                inc.updated_at = now_iso
                self.repo.save_incident(inc)
                logger.info(
                    f"[INCIDENT UPDATED] incident_id={inc.incident_id} status={inc.status.value} "
                    f"recovery_attempts={inc.recovery_attempts}"
                )
                updated.append(inc)

        return updated

    def acknowledge_incident(self, incident_id: str) -> Optional[Incident]:
        """Transitions an incident to ACKNOWLEDGED."""
        inc = self.repo.get_incident(incident_id)
        if not inc:
            logger.warning(f"Incident {incident_id} not found.")
            return None
        inc.status = IncidentStatus.ACKNOWLEDGED
        inc.updated_at = datetime.now(timezone.utc).isoformat()
        self.repo.save_incident(inc)
        logger.info(f"[INCIDENT UPDATED] incident_id={inc.incident_id} status=ACKNOWLEDGED")
        return inc

    def resolve_active_incidents(self, resolution_reason: str) -> List[Incident]:
        """Resolves all active incidents upon successful circuit recovery."""
        now_iso = datetime.now(timezone.utc).isoformat()
        active = self.repo.get_active_incidents()
        resolved = []

        for inc in active:
            inc.status = IncidentStatus.RESOLVED
            inc.circuit_state = CircuitState.CLOSED
            inc.resolved_at = now_iso
            inc.updated_at = now_iso
            inc.resolution_reason = resolution_reason
            self.repo.save_incident(inc)
            logger.info(
                f"[INCIDENT RESOLVED] incident_id={inc.incident_id} resolved_at={now_iso} "
                f"reason='{resolution_reason}'"
            )
            resolved.append(inc)

        return resolved

    def get_active_incidents(self) -> List[Incident]:
        return self.repo.get_active_incidents()

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        return self.repo.get_incident(incident_id)

    def list_incidents(self, limit: int = 50) -> List[Incident]:
        return self.repo.list_incidents(limit)

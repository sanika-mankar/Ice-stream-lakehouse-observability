"""Domain models and Enums for Ice Stream Circuit Breaker & Observability (Master 6)."""

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Dict, List, Optional


class CircuitState(str, Enum):
    """Authoritative states for the circuit breaker state machine."""
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class IncidentStatus(str, Enum):
    """Lifecycle status for operational incidents."""
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVING = "RESOLVING"
    RESOLVED = "RESOLVED"


class IncidentType(str, Enum):
    """Operational incident categories."""
    CIRCUIT_BREAKER_TRIPPED = "CIRCUIT_BREAKER_TRIPPED"
    PIPELINE_FAILURE = "PIPELINE_FAILURE"
    PIPELINE_RECOVERY = "PIPELINE_RECOVERY"
    CIRCUIT_BREAKER_RECOVERED = "CIRCUIT_BREAKER_RECOVERED"


class IncidentSeverity(str, Enum):
    """Severity classification for operational incidents."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class PipelineState(str, Enum):
    """Operational pipeline health states."""
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    TRIPPED = "TRIPPED"
    RECOVERING = "RECOVERING"
    FAILED = "FAILED"


@dataclass
class WindowMetrics:
    """Metrics aggregated over an evaluation window (e.g., 10-second tumbling)."""
    window_start: str
    window_end: str
    duration_seconds: float
    processed_count: int
    valid_count: int
    invalid_count: int
    error_rate: float
    quality_score: float
    throughput: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Incident:
    """Persistent operational incident record."""
    incident_id: str
    incident_type: IncidentType
    severity: IncidentSeverity
    status: IncidentStatus
    created_at: str
    updated_at: str
    circuit_state: CircuitState
    error_rate: float
    threshold: float
    processed_count: int
    valid_count: int
    invalid_count: int
    window_start: str
    window_end: str
    reason: str
    affected_component: str
    recovery_attempts: int = 0
    resolved_at: Optional[str] = None
    resolution_reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["incident_type"] = self.incident_type.value
        d["severity"] = self.severity.value
        d["status"] = self.status.value
        d["circuit_state"] = self.circuit_state.value
        return d

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Incident":
        return cls(
            incident_id=data["incident_id"],
            incident_type=IncidentType(data["incident_type"]),
            severity=IncidentSeverity(data["severity"]),
            status=IncidentStatus(data["status"]),
            created_at=data["created_at"],
            updated_at=data["updated_at"],
            circuit_state=CircuitState(data["circuit_state"]),
            error_rate=float(data["error_rate"]),
            threshold=float(data["threshold"]),
            processed_count=int(data["processed_count"]),
            valid_count=int(data["valid_count"]),
            invalid_count=int(data["invalid_count"]),
            window_start=data["window_start"],
            window_end=data["window_end"],
            reason=data["reason"],
            affected_component=data["affected_component"],
            recovery_attempts=int(data.get("recovery_attempts", 0)),
            resolved_at=data.get("resolved_at"),
            resolution_reason=data.get("resolution_reason"),
        )


@dataclass
class PipelineEvent:
    """Historical audit event emitted by the operational engine."""
    event_id: str
    event_type: str
    event_time: str
    pipeline_state: PipelineState
    circuit_state: CircuitState
    message: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["pipeline_state"] = self.pipeline_state.value
        d["circuit_state"] = self.circuit_state.value
        return d

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PipelineEvent":
        import json
        meta = data.get("metadata", {})
        if isinstance(meta, str):
            try:
                meta = json.loads(meta)
            except Exception:
                meta = {}
        return cls(
            event_id=data["event_id"],
            event_type=data["event_type"],
            event_time=data["event_time"],
            pipeline_state=PipelineState(data["pipeline_state"]),
            circuit_state=CircuitState(data["circuit_state"]),
            message=data["message"],
            metadata=meta,
        )


@dataclass
class ObservabilitySnapshot:
    """Aggregated snapshot of current operational health and metrics."""
    processed_events_total: int
    valid_events_total: int
    invalid_events_total: int
    current_error_rate: float
    quality_score: float
    throughput_events_per_second: float
    circuit_state: CircuitState
    pipeline_state: PipelineState
    incident_count: int
    active_incident_count: int
    recovery_attempts: int
    last_successful_checkpoint: Optional[str]
    last_event_time: Optional[str]
    uptime_seconds: float

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["circuit_state"] = self.circuit_state.value
        d["pipeline_state"] = self.pipeline_state.value
        return d

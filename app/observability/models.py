"""Domain models and Enums for Ice Stream Circuit Breaker & Observability (Master 6)."""

from enum import Enum


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

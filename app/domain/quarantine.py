"""Quarantine record domain model.

Represents an invalid event that has been quarantined with failure details.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional


@dataclass
class QuarantineRecord:
    """Record of an event that failed validation and was quarantined.
    
    Attributes:
        event_id: ID of the quarantined event
        received_at: When the event was received
        original_payload: Complete original event data
        failure_category: Category of failure (e.g., COMPLETENESS, TYPE_ERROR)
        failed_rules: Rule IDs that failed
        error_messages: Human-readable error descriptions
        schema_version: Schema version if known
        source: Source system if known
        quarantine_reason: Detailed reason for quarantine
        recoverable: Whether this event might be fixed and replayed
    """

    event_id: str
    received_at: datetime
    original_payload: dict[str, Any]
    failure_category: str
    failed_rules: list[str]
    error_messages: list[str]
    quarantine_reason: str
    recoverable: bool = True
    schema_version: Optional[str] = None
    source: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        """Convert quarantine record to dictionary.
        
        Returns:
            Dictionary representation
        """
        return {
            "event_id": self.event_id,
            "received_at": self.received_at.isoformat(),
            "original_payload": self.original_payload,
            "failure_category": self.failure_category,
            "failed_rules": self.failed_rules,
            "error_messages": self.error_messages,
            "schema_version": self.schema_version,
            "source": self.source,
            "quarantine_reason": self.quarantine_reason,
            "recoverable": self.recoverable,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "QuarantineRecord":
        """Create a quarantine record from a dictionary.
        
        Args:
            data: Dictionary with quarantine record fields
        
        Returns:
            QuarantineRecord instance
        """
        received_at = data.get("received_at")
        if isinstance(received_at, str):
            received_at = datetime.fromisoformat(received_at.replace("Z", "+00:00"))
        
        return cls(
            event_id=data["event_id"],
            received_at=received_at,
            original_payload=data["original_payload"],
            failure_category=data["failure_category"],
            failed_rules=data["failed_rules"],
            error_messages=data["error_messages"],
            quarantine_reason=data["quarantine_reason"],
            recoverable=data.get("recoverable", True),
            schema_version=data.get("schema_version"),
            source=data.get("source"),
        )

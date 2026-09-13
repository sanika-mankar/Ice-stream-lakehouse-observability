"""SQLite Persistence Repository for Observability & Incidents (Master 6).

Persists incident lifecycle records and operational pipeline audit events
to a dedicated operational database (data/observability.db).
"""

import json
import logging
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.observability.models import CircuitState, Incident, IncidentStatus, IncidentType, PipelineEvent, PipelineState

logger = logging.getLogger(__name__)

DEFAULT_OBSERVABILITY_DB_PATH = "data/observability.db"


class ObservabilityRepository:
    """Thread-safe SQLite repository for incidents and pipeline events."""

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            self.db_path = os.getenv("OBSERVABILITY_DB_PATH", DEFAULT_OBSERVABILITY_DB_PATH)
        else:
            self.db_path = db_path

        resolved_path = Path(self.db_path).resolve()
        resolved_path.parent.mkdir(parents=True, exist_ok=True)
        self._db_file = str(resolved_path)
        self._init_db()

    @contextmanager
    def _connection(self):
        conn = sqlite3.connect(self._db_file, timeout=20.0)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_db(self) -> None:
        """Initializes database schema and indexes."""
        with self._connection() as conn:
            cursor = conn.cursor()
            
            # 1. incidents table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id TEXT UNIQUE NOT NULL,
                incident_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                resolved_at TEXT,
                circuit_state TEXT NOT NULL,
                error_rate REAL NOT NULL,
                threshold REAL NOT NULL,
                processed_count INTEGER NOT NULL,
                valid_count INTEGER NOT NULL,
                invalid_count INTEGER NOT NULL,
                window_start TEXT NOT NULL,
                window_end TEXT NOT NULL,
                reason TEXT NOT NULL,
                affected_component TEXT NOT NULL,
                recovery_attempts INTEGER NOT NULL DEFAULT 0,
                resolution_reason TEXT
            );
            """)

            # 2. pipeline_events table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS pipeline_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT UNIQUE NOT NULL,
                event_type TEXT NOT NULL,
                event_time TEXT NOT NULL,
                pipeline_state TEXT NOT NULL,
                circuit_state TEXT NOT NULL,
                message TEXT NOT NULL,
                metadata TEXT
            );
            """)

            # 3. Operational indexes
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_pipeline_events_time ON pipeline_events(event_time);")

            conn.commit()

    def save_incident(self, incident: Incident) -> None:
        """Inserts or updates an incident record."""
        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO incidents (
                incident_id, incident_type, severity, status, created_at, updated_at,
                resolved_at, circuit_state, error_rate, threshold, processed_count,
                valid_count, invalid_count, window_start, window_end, reason,
                affected_component, recovery_attempts, resolution_reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(incident_id) DO UPDATE SET
                incident_type = excluded.incident_type,
                severity = excluded.severity,
                status = excluded.status,
                updated_at = excluded.updated_at,
                resolved_at = excluded.resolved_at,
                circuit_state = excluded.circuit_state,
                error_rate = excluded.error_rate,
                processed_count = excluded.processed_count,
                valid_count = excluded.valid_count,
                invalid_count = excluded.invalid_count,
                reason = excluded.reason,
                recovery_attempts = excluded.recovery_attempts,
                resolution_reason = excluded.resolution_reason;
            """, (
                incident.incident_id,
                incident.incident_type.value,
                incident.severity.value,
                incident.status.value,
                incident.created_at,
                incident.updated_at,
                incident.resolved_at,
                incident.circuit_state.value,
                incident.error_rate,
                incident.threshold,
                incident.processed_count,
                incident.valid_count,
                incident.invalid_count,
                incident.window_start,
                incident.window_end,
                incident.reason,
                incident.affected_component,
                incident.recovery_attempts,
                incident.resolution_reason,
            ))
            conn.commit()

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        """Fetches a single incident by its unique incident_id."""
        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM incidents WHERE incident_id = ?", (incident_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return Incident.from_dict(dict(row))

    def get_active_incidents(self) -> List[Incident]:
        """Returns all incidents currently in OPEN, ACKNOWLEDGED, or RESOLVING state."""
        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM incidents WHERE status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVING') ORDER BY created_at DESC"
            )
            rows = cursor.fetchall()
            return [Incident.from_dict(dict(r)) for r in rows]

    def list_incidents(self, limit: int = 50) -> List[Incident]:
        """Returns incidents ordered by creation time descending."""
        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM incidents ORDER BY created_at DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [Incident.from_dict(dict(r)) for r in rows]

    def save_pipeline_event(self, event: PipelineEvent) -> None:
        """Inserts an operational audit event."""
        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR IGNORE INTO pipeline_events (
                event_id, event_type, event_time, pipeline_state, circuit_state, message, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                event.event_id,
                event.event_type,
                event.event_time,
                event.pipeline_state.value,
                event.circuit_state.value,
                event.message,
                json.dumps(event.metadata),
            ))
            conn.commit()

    def list_pipeline_events(self, limit: int = 50) -> List[PipelineEvent]:
        """Returns recent pipeline events."""
        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM pipeline_events ORDER BY event_time DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [PipelineEvent.from_dict(dict(r)) for r in rows]

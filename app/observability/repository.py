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

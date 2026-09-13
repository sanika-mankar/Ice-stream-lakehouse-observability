"""Real-time Observability Metrics Aggregator for Ice Stream (Master 6).

Aggregates operational streaming metrics with bounded in-memory history,
safe zero-event handling, and truthful checkpoint tracking.
"""

import threading
import time
from collections import deque
from datetime import datetime, timezone
from typing import Deque, Dict, List, Optional
from app.observability.models import WindowMetrics

DEFAULT_HISTORY_LIMIT = 100


class ObservabilityMetricsAggregator:
    """Thread-safe metrics aggregator with bounded historical memory."""

    def __init__(self, history_limit: int = DEFAULT_HISTORY_LIMIT):
        self._lock = threading.Lock()
        self._history_limit = history_limit
        self._history: Deque[WindowMetrics] = deque(maxlen=history_limit)

        self._start_time = time.time()
        self._processed_total = 0
        self._valid_total = 0
        self._invalid_total = 0
        self._latest_window: Optional[WindowMetrics] = None
        self._last_event_time: Optional[str] = None
        self._last_successful_checkpoint: Optional[str] = None

    @property
    def uptime_seconds(self) -> float:
        return time.time() - self._start_time

    @property
    def processed_total(self) -> int:
        with self._lock:
            return self._processed_total

    @property
    def valid_total(self) -> int:
        with self._lock:
            return self._valid_total

    @property
    def invalid_total(self) -> int:
        with self._lock:
            return self._invalid_total

    @property
    def latest_window(self) -> Optional[WindowMetrics]:
        with self._lock:
            return self._latest_window

    def record_checkpoint(self, checkpoint_id_or_time: str) -> None:
        """Records the most recent truthful Flink checkpoint."""
        with self._lock:
            self._last_successful_checkpoint = checkpoint_id_or_time

    def record_window(
        self,
        window_start: str,
        window_end: str,
        duration_seconds: float,
        processed: int,
        valid: int,
        invalid: int,
        last_event_time: Optional[str] = None,
    ) -> WindowMetrics:
        """Computes and records window metrics safely without division-by-zero."""
        # Safe zero-event handling
        if processed > 0:
            error_rate = invalid / processed
            quality_score = (valid / processed) * 100.0
            throughput = processed / duration_seconds if duration_seconds > 0 else 0.0
        else:
            error_rate = 0.0
            quality_score = 100.0
            throughput = 0.0

        wm = WindowMetrics(
            window_start=window_start,
            window_end=window_end,
            duration_seconds=duration_seconds,
            processed_count=processed,
            valid_count=valid,
            invalid_count=invalid,
            error_rate=error_rate,
            quality_score=quality_score,
            throughput=throughput,
        )

        with self._lock:
            self._processed_total += processed
            self._valid_total += valid
            self._invalid_total += invalid
            self._latest_window = wm
            self._history.append(wm)
            if last_event_time:
                self._last_event_time = last_event_time

        return wm

    def get_history(self) -> List[WindowMetrics]:
        with self._lock:
            return list(self._history)

    def get_summary(self) -> Dict[str, float]:
        with self._lock:
            lifetime_processed = self._processed_total
            lifetime_error_rate = (self._invalid_total / lifetime_processed) if lifetime_processed > 0 else 0.0
            lifetime_quality = ((self._valid_total / lifetime_processed) * 100.0) if lifetime_processed > 0 else 100.0

            curr_wm = self._latest_window
            curr_error_rate = curr_wm.error_rate if curr_wm else 0.0
            curr_quality = curr_wm.quality_score if curr_wm else 100.0
            curr_throughput = curr_wm.throughput if curr_wm else 0.0

            return {
                "processed_total": float(self._processed_total),
                "valid_total": float(self._valid_total),
                "invalid_total": float(self._invalid_total),
                "current_error_rate": curr_error_rate,
                "current_quality_score": curr_quality,
                "current_throughput": curr_throughput,
                "lifetime_error_rate": lifetime_error_rate,
                "lifetime_quality_score": lifetime_quality,
                "uptime_seconds": self.uptime_seconds,
                "last_successful_checkpoint": self._last_successful_checkpoint,
                "last_event_time": self._last_event_time,
            }

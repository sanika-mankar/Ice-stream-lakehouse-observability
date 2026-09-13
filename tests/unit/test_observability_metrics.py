"""Unit tests for Observability Metrics Aggregator and Pipeline Health (Master 6)."""

import pytest
from app.observability.health import PipelineHealthEvaluator
from app.observability.metrics import ObservabilityMetricsAggregator
from app.observability.models import CircuitState, PipelineState, WindowMetrics


def test_metrics_aggregator_bounded_memory():
    """Verify that in-memory metrics history does not grow unbounded (deque maxlen=10)."""
    agg = ObservabilityMetricsAggregator(history_limit=10)

    for i in range(25):
        agg.record_window(
            window_start=f"2026-09-14T00:0{i:02d}:00Z",
            window_end=f"2026-09-14T00:0{i:02d}:10Z",
            duration_seconds=10.0,
            processed=10,
            valid=9,
            invalid=1,
        )

    history = agg.get_history()
    assert len(history) == 10  # Bounded strictly to maxlen
    assert agg.processed_total == 250
    assert agg.valid_total == 225
    assert agg.invalid_total == 25

    summary = agg.get_summary()
    assert summary["processed_total"] == 250.0
    assert summary["lifetime_error_rate"] == 0.10
    assert summary["lifetime_quality_score"] == 90.0


def test_metrics_aggregator_zero_events():
    """Verify safe zero-event calculation without division by zero."""
    agg = ObservabilityMetricsAggregator()
    wm = agg.record_window(
        window_start="2026-09-14T00:00:00Z",
        window_end="2026-09-14T00:00:10Z",
        duration_seconds=10.0,
        processed=0,
        valid=0,
        invalid=0,
    )
    assert wm.error_rate == 0.0
    assert wm.quality_score == 100.0
    assert wm.throughput == 0.0


def test_pipeline_health_evaluator_transitions():
    """Verify pipeline health state mapping."""
    evaluator = PipelineHealthEvaluator()
    assert evaluator.state == PipelineState.HEALTHY

    # Healthy: 0 errors
    wm_clean = WindowMetrics(
        window_start="", window_end="", duration_seconds=10, processed_count=50, valid_count=50, invalid_count=0,
        error_rate=0.0, quality_score=100.0, throughput=5.0
    )
    state, _ = evaluator.evaluate(CircuitState.CLOSED, wm_clean)
    assert state == PipelineState.HEALTHY

    # Degraded: errors within threshold (1% error rate)
    wm_deg = WindowMetrics(
        window_start="", window_end="", duration_seconds=10, processed_count=100, valid_count=99, invalid_count=1,
        error_rate=0.01, quality_score=99.0, throughput=10.0
    )
    state, _ = evaluator.evaluate(CircuitState.CLOSED, wm_deg)
    assert state == PipelineState.DEGRADED

    # Tripped: Circuit is OPEN
    wm_trip = WindowMetrics(
        window_start="", window_end="", duration_seconds=10, processed_count=100, valid_count=97, invalid_count=3,
        error_rate=0.03, quality_score=97.0, throughput=10.0
    )
    state, _ = evaluator.evaluate(CircuitState.OPEN, wm_trip)
    assert state == PipelineState.TRIPPED

    # Recovering: Circuit is HALF_OPEN
    state, _ = evaluator.evaluate(CircuitState.HALF_OPEN, wm_clean)
    assert state == PipelineState.RECOVERING

    # Failed: explicit fatal crash
    evaluator.set_failed("Kafka broker unreachable")
    assert evaluator.state == PipelineState.FAILED

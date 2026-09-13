"""Unit tests for Master 6 Circuit Breaker Engine.

Tests strict threshold evaluation:
- 0.00% -> CLOSED
- 1.00% -> CLOSED
- 2.00% -> CLOSED
- 2.01% -> OPEN
- 3.00% -> OPEN
Along with full state machine transitions and recovery semantics.
"""

import pytest
from app.observability.circuit_breaker import CircuitBreaker, CircuitBreakerTripException
from app.observability.models import CircuitState, WindowMetrics


def _create_metrics(processed: int, invalid: int, duration_seconds: float = 10.0) -> WindowMetrics:
    valid = processed - invalid
    error_rate = (invalid / processed) if processed > 0 else 0.0
    quality_score = ((valid / processed) * 100.0) if processed > 0 else 100.0
    throughput = (processed / duration_seconds) if duration_seconds > 0 else 0.0
    return WindowMetrics(
        window_start="2026-09-14T00:00:00Z",
        window_end="2026-09-14T00:00:10Z",
        duration_seconds=duration_seconds,
        processed_count=processed,
        valid_count=valid,
        invalid_count=invalid,
        error_rate=error_rate,
        quality_score=quality_score,
        throughput=throughput,
    )


def test_circuit_breaker_exact_threshold_boundaries():
    """Verify strict non-negotiable rule: error_rate > 0.02 trips to OPEN."""
    cb = CircuitBreaker(threshold=0.02)
    assert cb.state == CircuitState.CLOSED

    # 1. 0.00% error rate -> CLOSED
    m_0 = _create_metrics(processed=100, invalid=0)
    state, changed, _ = cb.evaluate_window(m_0)
    assert state == CircuitState.CLOSED
    assert not changed

    # 2. 1.00% error rate -> CLOSED
    m_1 = _create_metrics(processed=100, invalid=1)
    state, changed, _ = cb.evaluate_window(m_1)
    assert state == CircuitState.CLOSED
    assert not changed

    # 3. 2.00% error rate -> EXACT BOUNDARY -> MUST REMAIN CLOSED
    m_2 = _create_metrics(processed=100, invalid=2)
    assert m_2.error_rate == 0.02
    state, changed, _ = cb.evaluate_window(m_2)
    assert state == CircuitState.CLOSED
    assert not changed

    # 4. 2.01% error rate -> STRICTLY GREATER THAN 0.02 -> MUST TRIP TO OPEN
    # 201 invalid out of 10000 = 0.0201 (2.01%)
    m_201 = _create_metrics(processed=10000, invalid=201)
    assert m_201.error_rate == 0.0201
    assert m_201.error_rate > 0.02
    state, changed, reason = cb.evaluate_window(m_201)
    assert state == CircuitState.OPEN
    assert changed
    assert "Threshold breached" in reason

    # 5. 3.00% error rate -> OPEN
    cb_3 = CircuitBreaker(threshold=0.02)
    m_3 = _create_metrics(processed=100, invalid=3)
    state, changed, _ = cb_3.evaluate_window(m_3)
    assert state == CircuitState.OPEN
    assert changed


def test_zero_event_window_safety():
    """Verify zero-event window does not raise ZeroDivisionError and remains CLOSED."""
    cb = CircuitBreaker(threshold=0.02)
    m_zero = _create_metrics(processed=0, invalid=0)
    assert m_zero.error_rate == 0.0
    assert m_zero.quality_score == 100.0

    state, changed, reason = cb.evaluate_window(m_zero)
    assert state == CircuitState.CLOSED
    assert not changed


def test_circuit_breaker_disabled_toggle():
    """Verify circuit breaker can be disabled by configuration."""
    cb = CircuitBreaker(threshold=0.02, enabled=False)
    m_breach = _create_metrics(processed=100, invalid=50)  # 50% error rate
    state, changed, reason = cb.evaluate_window(m_breach)
    assert state == CircuitState.CLOSED
    assert not changed
    assert "disabled" in reason


def test_state_machine_lifecycle_and_recovery():
    """Test full cycle: CLOSED -> OPEN -> HALF_OPEN -> CLOSED (healthy recovery)."""
    cb = CircuitBreaker(threshold=0.02)

    # 1. Start CLOSED
    assert cb.state == CircuitState.CLOSED

    # 2. Trip to OPEN with 3% error rate
    m_trip = _create_metrics(processed=100, invalid=3)
    state, changed, _ = cb.evaluate_window(m_trip)
    assert state == CircuitState.OPEN
    assert changed

    # 3. Cannot re-trip while already OPEN
    state, changed, _ = cb.evaluate_window(m_trip)
    assert state == CircuitState.OPEN
    assert not changed

    # 4. Initiate recovery -> transitions to HALF_OPEN
    assert cb.initiate_recovery() is True
    assert cb.state == CircuitState.HALF_OPEN
    assert cb.recovery_attempts == 1

    # 5. Recovery probe: Real healthy traffic (1% error rate) -> transitions to CLOSED
    m_probe_healthy = _create_metrics(processed=100, invalid=1)
    state, changed, reason = cb.evaluate_window(m_probe_healthy)
    assert state == CircuitState.CLOSED
    assert changed
    assert "Recovery probe passed" in reason


def test_unhealthy_recovery_probe():
    """Test cycle: OPEN -> HALF_OPEN -> OPEN (unhealthy probe re-trips)."""
    cb = CircuitBreaker(threshold=0.02)
    cb.set_state(CircuitState.OPEN)

    cb.initiate_recovery()
    assert cb.state == CircuitState.HALF_OPEN

    # Unhealthy probe traffic: 4% error rate during HALF_OPEN
    m_probe_unhealthy = _create_metrics(processed=100, invalid=4)
    state, changed, reason = cb.evaluate_window(m_probe_unhealthy)
    assert state == CircuitState.OPEN
    assert changed
    assert "Recovery probe failed" in reason


def test_half_open_zero_traffic_window():
    """In HALF_OPEN, zero traffic does not declare recovery until real events are evaluated."""
    cb = CircuitBreaker(threshold=0.02)
    cb.set_state(CircuitState.OPEN)
    cb.initiate_recovery()

    m_zero = _create_metrics(processed=0, invalid=0)
    state, changed, reason = cb.evaluate_window(m_zero)
    assert state == CircuitState.HALF_OPEN
    assert not changed
    assert "Zero-traffic window" in reason

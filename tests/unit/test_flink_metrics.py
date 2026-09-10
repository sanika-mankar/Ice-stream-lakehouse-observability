import json
import pytest

def compute_window_metrics(elements, window_duration_seconds=10.0):
    """
    Core metric computation logic mirror of MetricsWindowFunction.
    """
    count = 0
    valid = 0
    invalid = 0
    
    for item in elements:
        try:
            raw = item[1] if isinstance(item, (tuple, list)) else item
            e = json.loads(raw) if isinstance(raw, str) else raw
            count += 1
            if e.get("is_valid", False):
                valid += 1
            else:
                invalid += 1
        except Exception:
            count += 1
            invalid += 1
            
    error_rate = invalid / count if count > 0 else 0.0
    quality_score = (valid / count) * 100 if count > 0 else 0.0
    throughput = count / window_duration_seconds if window_duration_seconds > 0 else 0.0
    
    return {
        "processed": count,
        "valid": valid,
        "invalid": invalid,
        "error_rate": error_rate,
        "quality_score": quality_score,
        "throughput": throughput,
    }

def test_metrics_window_all_valid():
    events = [
        ("global", json.dumps({"is_valid": True, "event_id": f"evt-{i}"}))
        for i in range(10)
    ]
    res = compute_window_metrics(events, window_duration_seconds=10.0)
    assert res["processed"] == 10
    assert res["valid"] == 10
    assert res["invalid"] == 0
    assert res["error_rate"] == 0.0
    assert res["quality_score"] == 100.0
    assert res["throughput"] == 1.0

def test_metrics_window_mixed_quality():
    events = [
        ("global", json.dumps({"is_valid": True, "event_id": "evt-1"})),
        ("global", json.dumps({"is_valid": True, "event_id": "evt-2"})),
        ("global", json.dumps({"is_valid": True, "event_id": "evt-3"})),
        ("global", json.dumps({"is_valid": False, "event_id": "evt-4", "payload": {"errors": ["Negative price"]}})),
    ]
    res = compute_window_metrics(events, window_duration_seconds=10.0)
    assert res["processed"] == 4
    assert res["valid"] == 3
    assert res["invalid"] == 1
    assert res["error_rate"] == 0.25
    assert res["quality_score"] == 75.0
    assert res["throughput"] == 0.4

def test_metrics_window_corrupt_payload():
    events = [
        ("global", "NOT_JSON"),
        ("global", json.dumps({"is_valid": True, "event_id": "evt-valid"})),
    ]
    res = compute_window_metrics(events, window_duration_seconds=10.0)
    assert res["processed"] == 2
    assert res["valid"] == 1
    assert res["invalid"] == 1
    assert res["error_rate"] == 0.5
    assert res["quality_score"] == 50.0

def test_metrics_window_empty():
    res = compute_window_metrics([], window_duration_seconds=10.0)
    assert res["processed"] == 0
    assert res["valid"] == 0
    assert res["invalid"] == 0
    assert res["error_rate"] == 0.0
    assert res["quality_score"] == 0.0
    assert res["throughput"] == 0.0

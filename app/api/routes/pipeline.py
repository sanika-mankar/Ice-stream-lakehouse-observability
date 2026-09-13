"""Pipeline topology and status route handler for Ice Stream (Master 7)."""

from typing import Any, Dict, List
from fastapi import APIRouter
from app.observability.models import CircuitState, PipelineState
from app.observability.service import get_observability_service

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])


@router.get("/status", response_model=Dict[str, Any])
def get_pipeline_status() -> Dict[str, Any]:
    """Returns live pipeline topology nodes, edges, and component statuses for React Flow."""
    service = get_observability_service()
    snap = service.get_snapshot()

    cb_state = snap.circuit_state.value
    p_state = snap.pipeline_state.value
    err_rate = snap.current_error_rate
    tps = snap.throughput_events_per_second

    # Node status logic based on authoritative backend state
    flink_status = "TRIPPED" if cb_state == CircuitState.OPEN.value else ("RECOVERING" if cb_state == CircuitState.HALF_OPEN.value else "HEALTHY")
    quality_status = "CRITICAL" if cb_state == CircuitState.OPEN.value else ("DEGRADED" if err_rate > 0 else "HEALTHY")

    nodes: List[Dict[str, Any]] = [
        {
            "id": "source",
            "type": "source",
            "label": "Python Producer",
            "description": "Streaming transaction producer",
            "status": "HEALTHY",
            "throughput": round(tps, 1),
        },
        {
            "id": "kafka",
            "type": "kafka",
            "label": "Aiven Kafka",
            "description": "Distributed SASL_SSL event log",
            "status": "HEALTHY",
            "throughput": round(tps, 1),
        },
        {
            "id": "flink",
            "type": "flink",
            "label": "Apache Flink 1.18",
            "description": "10s tumbling window stream engine",
            "status": flink_status,
            "throughput": round(tps, 1),
        },
        {
            "id": "quality",
            "type": "quality",
            "label": "Validation Engine",
            "description": "Rules DQ-001 through DQ-008",
            "status": quality_status,
            "error_rate": round(err_rate * 100, 2),
        },
        {
            "id": "circuit",
            "type": "circuit",
            "label": "Circuit Breaker",
            "description": "Strict 2% threshold gate",
            "status": cb_state,
            "threshold": 2.0,
        },
        {
            "id": "clean_sink",
            "type": "iceberg",
            "label": "Iceberg Clean",
            "description": "Partitioned Lakehouse Parquet",
            "status": "HEALTHY",
            "records": snap.valid_events_total,
        },
        {
            "id": "dlq_sink",
            "type": "dlq",
            "label": "Iceberg DLQ",
            "description": "Dead Letter Queue storage",
            "status": "HEALTHY",
            "records": snap.invalid_events_total,
        },
        {
            "id": "b2_storage",
            "type": "b2",
            "label": "Backblaze B2",
            "description": "S3FileIO Object Persistence",
            "status": "HEALTHY",
        },
    ]

    edges = [
        {"id": "e-source-kafka", "source": "source", "target": "kafka"},
        {"id": "e-kafka-flink", "source": "kafka", "target": "flink"},
        {"id": "e-flink-quality", "source": "flink", "target": "quality"},
        {"id": "e-quality-circuit", "source": "quality", "target": "circuit"},
        {"id": "e-circuit-clean", "source": "circuit", "target": "clean_sink"},
        {"id": "e-quality-dlq", "source": "quality", "target": "dlq_sink"},
        {"id": "e-clean-b2", "source": "clean_sink", "target": "b2_storage"},
        {"id": "e-dlq-b2", "source": "dlq_sink", "target": "b2_storage"},
    ]

    return {
        "pipeline_state": p_state,
        "circuit_state": cb_state,
        "nodes": nodes,
        "edges": edges,
        "metrics": snap.to_dict(),
    }

from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter()

@router.get("/health", response_model=Dict[str, Any])
def get_health():
    """
    Contract for /api/health endpoint.
    Returns the overall health status of the backend services.
    Currently returns a SIMULATION object as the real infrastructure is not yet connected.
    """
    return {
        "status": "HEALTHY",
        "message": "SIMULATION: Backend infrastructure not yet connected.",
        "services": {
            "kafka": "SIMULATED",
            "flink": "SIMULATED",
            "iceberg": "SIMULATED"
        }
    }

@router.get("/metrics", response_model=Dict[str, Any])
def get_metrics():
    """
    Contract for /api/metrics endpoint.
    """
    return {
        "message": "SIMULATION: Metrics backend not connected.",
        "data": []
    }

@router.get("/pipeline", response_model=Dict[str, Any])
def get_pipeline():
    """
    Contract for /api/pipeline endpoint.
    """
    return {
        "message": "SIMULATION: Pipeline backend not connected.",
        "nodes": [],
        "edges": [],
        "status": "HEALTHY"
    }

@router.get("/quality", response_model=Dict[str, Any])
def get_quality():
    """
    Contract for /api/quality endpoint.
    """
    return {
        "message": "SIMULATION: Quality backend not connected.",
        "metrics": {},
        "recent_violations": []
    }

@router.get("/incidents", response_model=Dict[str, Any])
def get_incidents():
    """
    Contract for /api/incidents endpoint.
    """
    return {
        "message": "SIMULATION: Incidents backend not connected.",
        "active_incidents": [],
        "past_incidents": []
    }

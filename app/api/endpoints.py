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

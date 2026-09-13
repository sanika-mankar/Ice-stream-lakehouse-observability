"""Incident management route handlers for Ice Stream (Master 7)."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.observability.models import IncidentStatus
from app.observability.service import get_observability_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])


class ResolveIncidentRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Resolution rationale")


@router.get("", response_model=List[Dict[str, Any]])
def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status (OPEN, ACKNOWLEDGED, RESOLVING, RESOLVED)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> List[Dict[str, Any]]:
    """Returns persistent incident records from data/observability.db."""
    service = get_observability_service()
    incidents = service.list_incidents(limit=limit + offset)

    if status:
        filtered = [inc for inc in incidents if inc.status.value.upper() == status.upper()]
    else:
        filtered = incidents

    sliced = filtered[offset : offset + limit]
    return [inc.to_dict() for inc in sliced]


@router.get("/active", response_model=List[Dict[str, Any]])
def get_active_incidents() -> List[Dict[str, Any]]:
    """Returns all incidents currently in OPEN, ACKNOWLEDGED, or RESOLVING states."""
    service = get_observability_service()
    active = service.get_active_incidents()
    return [inc.to_dict() for inc in active]


@router.get("/{incident_id}", response_model=Dict[str, Any])
def get_incident(incident_id: str) -> Dict[str, Any]:
    """Returns a single incident by ID. 404 if not found."""
    service = get_observability_service()
    incident = service.get_incident(incident_id)
    if not incident:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "INCIDENT_NOT_FOUND",
                    "message": f"Incident '{incident_id}' was not found in persistence records.",
                }
            },
        )
    return incident.to_dict()


@router.post("/{incident_id}/acknowledge", response_model=Dict[str, Any])
def acknowledge_incident(incident_id: str) -> Dict[str, Any]:
    """Transitions an incident to ACKNOWLEDGED state."""
    service = get_observability_service()
    incident = service.acknowledge_incident(incident_id)
    if not incident:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "INCIDENT_NOT_FOUND",
                    "message": f"Cannot acknowledge: Incident '{incident_id}' does not exist.",
                }
            },
        )
    return incident.to_dict()


@router.post("/{incident_id}/resolve", response_model=Dict[str, Any])
def resolve_incident(incident_id: str, request: ResolveIncidentRequest) -> Dict[str, Any]:
    """Manually resolves an incident with an audit reason."""
    service = get_observability_service()
    incident = service.resolve_incident(incident_id, reason=request.reason)
    if not incident:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "INCIDENT_NOT_FOUND",
                    "message": f"Cannot resolve: Incident '{incident_id}' does not exist.",
                }
            },
        )
    return incident.to_dict()

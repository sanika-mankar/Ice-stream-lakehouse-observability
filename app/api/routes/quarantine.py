"""Quarantine and Dead Letter Queue (DLQ) route handlers for Ice Stream."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.observability.service import get_observability_service

router = APIRouter(prefix="/quarantine", tags=["Quarantine"])


@router.get("", response_model=List[Dict[str, Any]])
def list_quarantine_records(
    limit: int = Query(100, ge=1, le=500),
    rule_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    """Returns recent quarantined violation records."""
    service = get_observability_service()
    records = service.repo.list_quarantine_records(limit=limit)

    if rule_id:
        records = [r for r in records if r.get("rule_id", "").upper() == rule_id.upper() or r.get("ruleId", "").upper() == rule_id.upper()]

    if search:
        s = search.lower()
        records = [
            r for r in records
            if s in str(r.get("event_id", "")).lower()
            or s in str(r.get("transaction_id", "")).lower()
            or s in str(r.get("rule_id", "")).lower()
            or s in str(r.get("field", "")).lower()
        ]

    return records


@router.get("/{record_id}", response_model=Dict[str, Any])
def get_quarantine_record(record_id: str) -> Dict[str, Any]:
    """Fetches full inspection details for a single quarantined event."""
    service = get_observability_service()
    record = service.repo.get_quarantine_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Quarantine record {record_id} not found")
    return record


@router.delete("", response_model=Dict[str, Any])
def clear_quarantine() -> Dict[str, Any]:
    """Clears quarantine records (operator / test reset)."""
    service = get_observability_service()
    service.repo.clear_quarantine_records()
    return {"success": True, "message": "Quarantine storage cleared"}

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class SystemStatus(str, Enum):
    HEALTHY = "HEALTHY"
    WARNING = "WARNING"
    DEGRADED = "DEGRADED"
    CRITICAL = "CRITICAL"
    QUARANTINED = "QUARANTINED"
    RECOVERING = "RECOVERING"
    CIRCUIT_BREAKER_OPEN = "CIRCUIT_BREAKER_OPEN"

class Event(BaseModel):
    id: str
    timestamp: datetime
    severity: str
    source: str
    event_type: str = Field(alias="eventType")
    message: str

class Transaction(BaseModel):
    event_id: str
    event_time: datetime
    source: str
    schema_version: str
    transaction_id: str
    customer_id: str
    product_id: str
    quantity: int
    unit_price: float
    currency: str
    payment_method: str
    status: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

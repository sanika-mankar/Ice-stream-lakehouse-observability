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

class QualityRuleId(str, Enum):
    REQUIRED_FIELD_MISSING = "DQ-001"
    NULL_REQUIRED_FIELD = "DQ-002"
    INVALID_TYPE = "DQ-003"
    INVALID_RANGE = "DQ-004"
    INVALID_ENUM = "DQ-005"
    DUPLICATE_EVENT = "DQ-006"
    SCHEMA_MISMATCH = "DQ-007"
    UNKNOWN_SCHEMA_VERSION = "DQ-008"

class QualityMetric(BaseModel):
    total_events: int = Field(alias="totalEvents")
    valid_events: int = Field(alias="validEvents")
    invalid_events: int = Field(alias="invalidEvents")
    quality_score: float = Field(alias="qualityScore")
    timestamp: str

class QualityViolation(BaseModel):
    id: str
    rule_id: QualityRuleId = Field(alias="ruleId")
    description: str
    severity: str
    count: int
    timestamp: str

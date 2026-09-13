"""System runtime information route handler for Ice Stream (Master 7)."""

import os
import platform
import sys
from typing import Any, Dict
from fastapi import APIRouter
import fastapi

router = APIRouter(prefix="/system", tags=["System"])


@router.get("", response_model=Dict[str, Any])
def get_system_info() -> Dict[str, Any]:
    """Returns non-sensitive operational environment details.
    
    Strict invariant: Never exposes passwords, SASL credentials, or B2 secrets.
    """
    return {
        "service": "Ice Stream Streaming Lakehouse Platform",
        "version": "1.0.0",
        "environment": os.getenv("APP_ENV", "development"),
        "python_version": sys.version.split()[0],
        "fastapi_version": fastapi.__version__,
        "flink_version": "1.18.1",
        "iceberg_version": "1.5.2",
        "os_platform": platform.platform(),
        "circuit_breaker": {
            "enabled": os.getenv("CIRCUIT_BREAKER_ENABLED", "true").lower() in ("true", "1", "yes"),
            "threshold": float(os.getenv("CIRCUIT_BREAKER_ERROR_RATE_THRESHOLD", "0.02")),
            "fail_fast": os.getenv("CIRCUIT_BREAKER_FAIL_FAST", "true").lower() in ("true", "1", "yes"),
            "window_seconds": int(os.getenv("QUALITY_WINDOW_SECONDS", "10")),
        },
        "storage": {
            "catalog_type": "JdbcCatalog (SQLite)",
            "file_io": "S3FileIO (Backblaze B2)",
            "bucket": os.getenv("B2_BUCKET_NAME", "ice-stream-lakehouse"),
        },
        "kafka": {
            "topic_transactions": os.getenv("KAFKA_TOPIC_TRANSACTIONS", "ice-stream.transactions"),
            "topic_dlq": os.getenv("KAFKA_TOPIC_DLQ", "ice-stream.dlq"),
            "security_protocol": os.getenv("KAFKA_SECURITY_PROTOCOL", "SASL_SSL"),
        },
    }

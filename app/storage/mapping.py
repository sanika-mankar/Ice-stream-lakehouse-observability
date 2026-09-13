"""Data transformation and mapping for Lakehouse persistence.

Maps canonical transaction payloads and quarantine validation results into
dictionaries and rows aligned with Apache Iceberg table schemas.
"""

import json
import re
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any


def extract_failure_details(errors: list[Any]) -> tuple[list[str], list[str], str]:
    """Extract rule IDs, clean messages, and failure category from errors.

    Args:
        errors: List of error messages or validator results.

    Returns:
        Tuple of (failed_rules, error_messages, failure_category).
    """
    failed_rules: list[str] = []
    error_msgs: list[str] = []

    for err in errors:
        err_str = str(err)
        error_msgs.append(err_str)
        m = re.search(r"(DQ-\d{3})", err_str)
        if m:
            failed_rules.append(m.group(1))
        elif "JSON" in err_str:
            failed_rules.append("DQ-PARSE")
        else:
            failed_rules.append("DQ-UNKNOWN")

    category = "VALIDATION_FAILED"
    if any("DQ-006" in r for r in failed_rules):
        category = "DUPLICATE"
    elif any(r in ("DQ-007", "DQ-008", "DQ-PARSE") for r in failed_rules) or any("JSON" in r for r in failed_rules):
        category = "SCHEMA_VIOLATION"

    return failed_rules, error_msgs, category


def to_clean_iceberg_dict(raw_data: dict[str, Any]) -> dict[str, Any]:
    """Map a valid transaction dictionary to a transactions_clean schema dict."""
    event_time = raw_data.get("event_time")
    if isinstance(event_time, str):
        try:
            event_time_dt = datetime.fromisoformat(event_time.replace("Z", "+00:00"))
        except Exception:
            event_time_dt = datetime.now(timezone.utc)
    elif isinstance(event_time, datetime):
        event_time_dt = event_time
    else:
        event_time_dt = datetime.now(timezone.utc)

    metadata_val = raw_data.get("metadata")
    if isinstance(metadata_val, (dict, list)):
        metadata_str = json.dumps(metadata_val)
    elif metadata_val is not None:
        metadata_str = str(metadata_val)
    else:
        metadata_str = None

    return {
        "event_id": str(raw_data.get("event_id", "")),
        "transaction_id": str(raw_data.get("transaction_id", "")),
        "event_time": event_time_dt,
        "customer_id": str(raw_data.get("customer_id", "")),
        "product_id": str(raw_data.get("product_id", "")),
        "quantity": int(raw_data.get("quantity", 0)),
        "unit_price": Decimal(str(raw_data.get("unit_price", "0.00"))),
        "currency": str(raw_data.get("currency", "USD")),
        "status": str(raw_data.get("status", "PENDING")),
        "payment_method": str(raw_data.get("payment_method", "UNKNOWN")),
        "source": str(raw_data.get("source", "unknown")),
        "schema_version": str(raw_data.get("schema_version", "1.0")),
        "metadata": metadata_str,
    }


def to_dlq_iceberg_dict(raw_data: Any, errors: list[Any]) -> dict[str, Any]:
    """Map an invalid event and its validation errors to a transactions_dlq schema dict."""
    failed_rules, error_msgs, category = extract_failure_details(errors)

    event_id = "unknown"
    tx_id = None
    event_time_dt = datetime.now(timezone.utc)
    schema_ver = None
    source = None

    if isinstance(raw_data, dict):
        event_id = str(raw_data.get("event_id", "unknown"))
        tx_id = str(raw_data["transaction_id"]) if raw_data.get("transaction_id") else None
        schema_ver = str(raw_data["schema_version"]) if raw_data.get("schema_version") else None
        source = str(raw_data["source"]) if raw_data.get("source") else None

        et = raw_data.get("event_time")
        if isinstance(et, str):
            try:
                event_time_dt = datetime.fromisoformat(et.replace("Z", "+00:00"))
            except Exception:
                pass
        elif isinstance(et, datetime):
            event_time_dt = et

    raw_payload_str = json.dumps(raw_data) if isinstance(raw_data, dict) else str(raw_data)
    recoverable = False if category == "SCHEMA_VIOLATION" else True

    return {
        "event_id": event_id,
        "transaction_id": tx_id,
        "event_time": event_time_dt,
        "failure_timestamp": datetime.now(timezone.utc),
        "failure_category": category,
        "failed_rules": failed_rules,
        "error_messages": error_msgs,
        "raw_payload": raw_payload_str,
        "schema_version": schema_ver,
        "source": source,
        "recoverable": recoverable,
    }

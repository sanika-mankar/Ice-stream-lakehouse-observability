"""Lakehouse metadata read-only route handlers for Ice Stream (Master 7)."""

import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, List
from fastapi import APIRouter

router = APIRouter(prefix="/lakehouse", tags=["Lakehouse"])


@router.get("/status", response_model=Dict[str, Any])
def get_lakehouse_status() -> Dict[str, Any]:
    """Returns operational status of the Apache Iceberg catalog and Backblaze B2 storage."""
    catalog_path = os.getenv("ICEBERG_CATALOG_DB_PATH", "data/iceberg_catalog.db")
    resolved_catalog = Path(catalog_path).resolve()
    catalog_exists = resolved_catalog.exists()

    tables: List[Dict[str, str]] = []
    if catalog_exists:
        try:
            conn = sqlite3.connect(str(resolved_catalog))
            cursor = conn.cursor()
            cursor.execute("SELECT catalog_name, table_namespace, table_name, metadata_location FROM iceberg_tables")
            rows = cursor.fetchall()
            for r in rows:
                tables.append({
                    "catalog": r[0],
                    "namespace": r[1],
                    "name": r[2],
                    "metadata_location": r[3],
                })
            conn.close()
        except Exception:
            pass

    return {
        "status": "HEALTHY" if catalog_exists else "CATALOG_INITIALIZING",
        "catalog_type": "org.apache.iceberg.jdbc.JdbcCatalog",
        "catalog_db_path": str(resolved_catalog),
        "catalog_exists": catalog_exists,
        "bucket": os.getenv("B2_BUCKET_NAME", "ice-stream-lakehouse"),
        "endpoint": os.getenv("B2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com"),
        "warehouse": os.getenv("ICEBERG_WAREHOUSE", "s3://ice-stream-lakehouse/warehouse"),
        "file_io": "org.apache.iceberg.aws.s3.S3FileIO",
        "registered_tables": tables,
    }


@router.get("/tables", response_model=List[Dict[str, Any]])
def get_lakehouse_tables() -> List[Dict[str, Any]]:
    """Returns information about registered Iceberg tables (transactions_clean and transactions_dlq)."""
    catalog_path = os.getenv("ICEBERG_CATALOG_DB_PATH", "data/iceberg_catalog.db")
    resolved_catalog = Path(catalog_path).resolve()

    clean_table = os.getenv("ICEBERG_CLEAN_TABLE", "transactions_clean")
    dlq_table = os.getenv("ICEBERG_DLQ_TABLE", "transactions_dlq")

    tables = [
        {
            "name": clean_table,
            "type": "VALID_EVENTS",
            "format": "Apache Iceberg 1.5.2 Parquet",
            "partition_spec": "days(event_time)",
            "warehouse_path": f"warehouse/ice_stream/{clean_table}/",
            "description": "Validated, schema-compliant transaction records.",
        },
        {
            "name": dlq_table,
            "type": "DEAD_LETTER_QUEUE",
            "format": "Apache Iceberg 1.5.2 Parquet",
            "partition_spec": "days(failure_timestamp)",
            "warehouse_path": f"warehouse/ice_stream/{dlq_table}/",
            "description": "Quarantined validation failures with rule IDs and error messages.",
        },
    ]

    # Enrich with actual catalog metadata location if available
    if resolved_catalog.exists():
        try:
            conn = sqlite3.connect(str(resolved_catalog))
            cursor = conn.cursor()
            cursor.execute("SELECT table_name, metadata_location FROM iceberg_tables")
            locations = dict(cursor.fetchall())
            conn.close()
            for t in tables:
                t["metadata_location"] = locations.get(t["name"])
        except Exception:
            pass

    return tables


@router.get("/snapshots", response_model=List[Dict[str, Any]])
def get_lakehouse_snapshots() -> List[Dict[str, Any]]:
    """Returns truthful metadata pointer history from the Iceberg catalog."""
    catalog_path = os.getenv("ICEBERG_CATALOG_DB_PATH", "data/iceberg_catalog.db")
    resolved_catalog = Path(catalog_path).resolve()
    snapshots: List[Dict[str, Any]] = []

    if resolved_catalog.exists():
        try:
            conn = sqlite3.connect(str(resolved_catalog))
            cursor = conn.cursor()
            cursor.execute("SELECT catalog_name, table_namespace, table_name, metadata_location, previous_metadata_location FROM iceberg_tables")
            rows = cursor.fetchall()
            for r in rows:
                snapshots.append({
                    "table": f"{r[1]}.{r[2]}",
                    "current_metadata": r[3],
                    "previous_metadata": r[4],
                    "status": "COMMITTED",
                })
            conn.close()
        except Exception:
            pass

    return snapshots

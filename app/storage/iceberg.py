"""Apache Iceberg catalog and table configuration for Ice Stream Lakehouse.

Defines schemas, SQL DDL, and configuration helpers for connecting
Flink to Backblaze B2 backed Iceberg tables.
"""

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class IcebergConfig:
    """Iceberg catalog and storage configuration."""

    catalog_name: str = "ice_stream_catalog"
    database_name: str = "ice_stream"
    clean_table_name: str = "transactions_clean"
    dlq_table_name: str = "transactions_dlq"
    bucket_name: str = "ice-stream-lakehouse"
    warehouse_uri: str = "s3://ice-stream-lakehouse/warehouse"
    endpoint: str = "https://s3.us-east-005.backblazeb2.com"
    region: str = "us-east-005"
    access_key_id: str = ""
    secret_access_key: str = ""
    sqlite_db_path: str = "data/iceberg_catalog.db"

    @classmethod
    def from_env(cls) -> "IcebergConfig":
        """Load configuration from environment variables."""
        bucket = os.getenv("B2_BUCKET_NAME", "ice-stream-lakehouse")
        repo_root = Path(os.getcwd())
        default_db = str(repo_root / "data" / "iceberg_catalog.db").replace("\\", "/")
        return cls(
            catalog_name=os.getenv("ICEBERG_CATALOG_NAME", "ice_stream_catalog"),
            database_name=os.getenv("ICEBERG_DATABASE", "ice_stream"),
            clean_table_name=os.getenv("ICEBERG_CLEAN_TABLE", "transactions_clean"),
            dlq_table_name=os.getenv("ICEBERG_DLQ_TABLE", "transactions_dlq"),
            bucket_name=bucket,
            warehouse_uri=os.getenv("ICEBERG_WAREHOUSE", f"s3://{bucket}/warehouse"),
            endpoint=os.getenv("B2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com"),
            region=os.getenv("B2_REGION", "us-east-005"),
            access_key_id=os.getenv("B2_ACCESS_KEY_ID", ""),
            secret_access_key=os.getenv("B2_SECRET_ACCESS_KEY", ""),
            sqlite_db_path=os.getenv("ICEBERG_CATALOG_DB_PATH", default_db),
        )

    def get_create_catalog_sql(self) -> str:
        """Generate Flink SQL for creating the JDBC Iceberg catalog."""
        return f"""
CREATE CATALOG {self.catalog_name} WITH (
    'type'='iceberg',
    'catalog-impl'='org.apache.iceberg.jdbc.JdbcCatalog',
    'uri'='jdbc:sqlite:{self.sqlite_db_path}',
    'warehouse'='{self.warehouse_uri}',
    'io-impl'='org.apache.iceberg.aws.s3.S3FileIO',
    's3.endpoint'='{self.endpoint}',
    's3.path-style-access'='true',
    's3.access-key-id'='{self.access_key_id}',
    's3.secret-access-key'='{self.secret_access_key}',
    'client.region'='{self.region}'
)
""".strip()

    def get_create_clean_table_sql(self) -> str:
        """Generate Flink SQL for creating the transactions_clean Iceberg table."""
        full_name = f"{self.catalog_name}.{self.database_name}.{self.clean_table_name}"
        return f"""
CREATE TABLE IF NOT EXISTS {full_name} (
    event_id         STRING NOT NULL,
    transaction_id   STRING NOT NULL,
    event_time       TIMESTAMP(3) WITH LOCAL TIME ZONE,
    customer_id      STRING NOT NULL,
    product_id       STRING NOT NULL,
    quantity         INT NOT NULL,
    unit_price       DECIMAL(10, 2) NOT NULL,
    currency         STRING NOT NULL,
    status           STRING NOT NULL,
    payment_method   STRING NOT NULL,
    source           STRING NOT NULL,
    schema_version   STRING NOT NULL,
    metadata         STRING,
    PRIMARY KEY (event_id) NOT ENFORCED
) WITH (
    'format-version' = '2',
    'write.format.default' = 'parquet'
)
""".strip()

    def get_create_dlq_table_sql(self) -> str:
        """Generate Flink SQL for creating the transactions_dlq Iceberg table."""
        full_name = f"{self.catalog_name}.{self.database_name}.{self.dlq_table_name}"
        return f"""
CREATE TABLE IF NOT EXISTS {full_name} (
    event_id          STRING NOT NULL,
    transaction_id    STRING,
    event_time        TIMESTAMP(3) WITH LOCAL TIME ZONE,
    failure_timestamp TIMESTAMP(3) WITH LOCAL TIME ZONE,
    failure_category  STRING NOT NULL,
    failed_rules      ARRAY<STRING>,
    error_messages    ARRAY<STRING>,
    raw_payload       STRING NOT NULL,
    schema_version    STRING,
    source            STRING,
    recoverable       BOOLEAN,
    PRIMARY KEY (event_id) NOT ENFORCED
) WITH (
    'format-version' = '2',
    'write.format.default' = 'parquet'
)
""".strip()

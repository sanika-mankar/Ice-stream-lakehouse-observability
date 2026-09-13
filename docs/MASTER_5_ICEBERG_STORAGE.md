# Master 5: Flink to Apache Iceberg Lakehouse & DLQ Quarantine

## Overview
Master 5 establishes the persistence layer of the Ice Stream platform: connecting Apache Flink's streaming quality engine directly to an **Apache Iceberg Lakehouse** hosted on **Backblaze B2** object storage (S3-compatible API). 

The stream is split into two persistent Iceberg tables:
1. **`ice_stream.transactions_clean`**: Stores strictly validated, high-quality transactions partitioned by date.
2. **`ice_stream.transactions_dlq`**: Dead Letter Queue (Quarantine) that stores all rejected transactions alongside failure classification metadata, violation codes (DQ-001..DQ-008), error descriptions, and recoverability flags.

---

## Architecture & Data Flow

```text
               ┌───────────────────────────┐
               │    Aiven Apache Kafka     │
               │ (ice-stream.transactions) │
               └─────────────┬─────────────┘
                             │
                             ▼
               ┌───────────────────────────┐
               │    Apache Flink Engine    │
               │   - Schema Parsing        │
               │   - Deduplication State   │
               │   - Validation Engine     │
               └──────┬─────────────┬──────┘
                      │             │
           is_valid = true     is_valid = false
                      │             │
                      ▼             ▼
          ┌────────────────┐   ┌────────────────┐
          │  Clean Stream  │   │   DLQ Stream   │
          └───────┬────────┘   └────────┬───────┘
                  │                     │
                  ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│        Iceberg Table Environment (StatementSet)         │
│  - Catalog: SQLite JDBC Catalog (iceberg_catalog.db)   │
│  - Storage: Backblaze B2 S3FileIO                      │
└─────────────┬─────────────────────────┬─────────────────┘
              │                         │
              ▼                         ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     Iceberg Clean Table   │ │      Iceberg DLQ Table    │
│  transactions_clean       │ │   transactions_dlq        │
│  (Parquet Data Files)     │ │   (Parquet Data Files)    │
└───────────────────────────┘ └───────────────────────────┘
```

---

## Infrastructure & Catalogs

- **Object Storage**: Backblaze B2 S3-compatible storage (`s3://ice-stream-lakehouse/warehouse`)
- **S3 Endpoint**: `https://s3.us-east-005.backblazeb2.com`
- **Catalog Implementation**: `org.apache.iceberg.jdbc.JdbcCatalog` backed by local SQLite DB (`data/iceberg_catalog.db`)
- **FileIO Implementation**: `org.apache.iceberg.aws.s3.S3FileIO` (Path-style access enabled)
- **Table Format**: Apache Iceberg v2
- **File Format**: Apache Parquet (Snappy-compressed)

### JAR Dependencies (`flink/lib`)
- `flink-sql-connector-kafka-3.1.0-1.18.jar`
- `iceberg-flink-runtime-1.18-1.5.2.jar`
- `iceberg-aws-bundle-1.5.2.jar`
- `sqlite-jdbc-3.45.1.0.jar`
- `flink-shaded-hadoop-2-uber-2.8.3-10.0.jar`

---

## Table Schemas

### 1. `transactions_clean`
Stores compliant transaction events ready for downstream analytical querying:

| Column | Type | Description |
|---|---|---|
| `event_id` | STRING (NOT NULL) | Unique UUID event identifier |
| `transaction_id` | STRING (NOT NULL) | Business transaction ID |
| `event_time` | TIMESTAMP(6) WITH LOCAL TIME ZONE | Transaction occurrence timestamp |
| `customer_id` | STRING (NOT NULL) | Customer ID |
| `product_id` | STRING (NOT NULL) | SKU / Product ID |
| `quantity` | INT (NOT NULL) | Quantity purchased |
| `unit_price` | DECIMAL(10, 2) NOT NULL | Price per unit |
| `currency` | STRING (NOT NULL) | ISO Currency code (e.g., USD) |
| `status` | STRING (NOT NULL) | Transaction state (PENDING, COMPLETED, etc.) |
| `payment_method` | STRING (NOT NULL) | Payment instrument (CREDIT_CARD, etc.) |
| `source` | STRING (NOT NULL) | Source system (e.g., pos, web) |
| `schema_version` | STRING (NOT NULL) | Contract version (e.g., "1.0") |
| `metadata` | STRING | Raw JSON metadata string |

**Partitioning**: Partitioned by date on `event_time` (`days(event_time)`).

---

### 2. `transactions_dlq` (Quarantine)
Stores corrupted, non-compliant, or duplicate events with enriched diagnostic context:

| Column | Type | Description |
|---|---|---|
| `event_id` | STRING (NOT NULL) | Event identifier |
| `transaction_id` | STRING | Business transaction ID (nullable if malformed) |
| `event_time` | TIMESTAMP(6) WITH LOCAL TIME ZONE | Event timestamp |
| `failure_timestamp`| TIMESTAMP(6) WITH LOCAL TIME ZONE | Timestamp when rejected by Flink |
| `failure_category` | STRING (NOT NULL) | Classification (`VALIDATION_FAILED`, `DUPLICATE`, `SCHEMA_VIOLATION`) |
| `failed_rules` | ARRAY<STRING> | Specific DQ rule codes triggered (e.g. `['DQ-001']`) |
| `error_messages` | ARRAY<STRING> | Detailed error strings from validator |
| `raw_payload` | STRING | Original unmodified payload for investigation/replay |
| `schema_version` | STRING | Ingested schema version |
| `source` | STRING | Ingested source |
| `recoverable` | BOOLEAN | Indicates whether record can be safely replayed after schema/data patch |

---

## Controlled Ingestion & Validation Test

A dedicated verification test was executed with `scripts/produce_controlled_batch.py`, sending **30 controlled transactions** to the Kafka topic:

- **25 Valid Transactions**: Properly formatted with random variation in products, quantities, and prices.
- **5 Invalid Transactions**: Designed to trigger distinct quality gate rules:
  1. `DQ-001`: Missing required `customer_id` (`None`).
  2. `DQ-002`: Invalid datatype for `quantity` (`"three"`).
  3. `DQ-004`: Negative price business rule violation (`unit_price: -45.00`).
  4. `DQ-005`: Invalid transaction status (`status: "DELIVERED"`).
  5. `DQ-006`: Duplicate event (exact replay of a previous valid `event_id`).

### Lakehouse Verification Results
- **Connectivity**: Verified via `scripts/test_b2_connection.py` using Backblaze B2 S3 API.
- **Catalog Tables**: Successfully registered in `data/iceberg_catalog.db`.
- **Clean Lakehouse Table**: Successfully created at `warehouse/ice_stream/transactions_clean` with Iceberg snapshot metadata and Parquet data files.
- **Quarantine DLQ Table**: Successfully created at `warehouse/ice_stream/transactions_dlq` with failure attribution.
- **Data Inspection**: `scripts/verify_lakehouse_data.py` confirmed Parquet record schemas, partition boundaries, and field IDs (`PARQUET:field_id`) matching Apache Iceberg v2 specs.

---

## Next Steps (Transition to Master 6)
With Iceberg persistence and DLQ quarantine operational:
- **Master 6**: Implement the **2% Circuit Breaker Engine**, incident management automation, and real-time observability metrics computation.

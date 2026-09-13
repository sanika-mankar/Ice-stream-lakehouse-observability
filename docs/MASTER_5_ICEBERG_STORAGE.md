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
- **Catalog Implementation**: `org.apache.iceberg.jdbc.JdbcCatalog` backed by configurable SQLite database path (`ICEBERG_CATALOG_DB_PATH`, defaulting to `data/iceberg_catalog.db`).
- **FileIO Implementation**: `org.apache.iceberg.aws.s3.S3FileIO` (Path-style access enabled)
- **Table Format**: Apache Iceberg v2
- **File Format**: Apache Parquet (Snappy-compressed)

---

## Canonical Data Quality Rules (DQ-001..DQ-008)

| Rule ID | Name | Trigger Condition | Classification | Target Table |
|---|---|---|---|---|
| `DQ-001` | `REQUIRED_FIELD_MISSING` | Mandatory key is completely missing from event dictionary. | `VALIDATION_FAILED` | `transactions_dlq` |
| `DQ-002` | `NULL_REQUIRED_FIELD` | Mandatory key is present, but value is `None` / `null`. | `VALIDATION_FAILED` | `transactions_dlq` |
| `DQ-003` | `INVALID_TYPE` | Data type mismatch (e.g. quantity is string `"three"`). | `VALIDATION_FAILED` | `transactions_dlq` |
| `DQ-004` | `INVALID_RANGE` | Numeric out of bounds (`quantity <= 0` or `unit_price < 0`). | `VALIDATION_FAILED` | `transactions_dlq` |
| `DQ-005` | `INVALID_ENUM` | Status, currency, or payment method not in allowed enum list. | `VALIDATION_FAILED` | `transactions_dlq` |
| `DQ-006` | `DUPLICATE_EVENT` | Event ID already seen within the 24h deduplication window. | `DUPLICATE` | `transactions_dlq` |
| `DQ-007` | `SCHEMA_MISMATCH` | Unauthorized extra drift fields or non-object structure. | `SCHEMA_VIOLATION` | `transactions_dlq` |
| `DQ-008` | `UNKNOWN_SCHEMA_VERSION` | `schema_version` is missing or unsupported (`!= '1.0'`). | `SCHEMA_VIOLATION` | `transactions_dlq` |

---

## Controlled Ingestion & End-to-End Validation Test

A dedicated verification test was executed with `scripts/produce_controlled_batch.py`, sending **33 controlled transactions** to the real Aiven Kafka topic:

- **25 Valid Transactions**: Fully compliant transactions partitioned by day $\rightarrow$ routed to `ice_stream.transactions_clean`.
- **8 Targeted Invalid Transactions**: One transaction for each canonical rule:
  1. `DQ-001`: Missing required `customer_id` key.
  2. `DQ-002`: NULL required `customer_id` value.
  3. `DQ-003`: Invalid datatype (`quantity: "three"`).
  4. `DQ-004`: Negative price (`unit_price: -45.00`).
  5. `DQ-005`: Invalid transaction status (`status: "DELIVERED"`).
  6. `DQ-006`: Duplicate event (exact replay of valid event 1).
  7. `DQ-007`: Schema mismatch (unauthorized field `unauthorized_drift_field`).
  8. `DQ-008`: Unknown schema version (`schema_version: "99.0"`).

### Lakehouse Verification Results
- **Connectivity**: Verified via `scripts/test_b2_connection.py` using Backblaze B2 S3 API.
- **Configurable Catalog**: Successfully resolved from `ICEBERG_CATALOG_DB_PATH`.
- **Clean Lakehouse Table**: Successfully persisted at `warehouse/ice_stream/transactions_clean` with Iceberg snapshot metadata and Parquet data files.
- **Quarantine DLQ Table**: Successfully persisted at `warehouse/ice_stream/transactions_dlq` with failure attribution and recovery flags.
- **Data Inspection**: `scripts/verify_lakehouse_data.py` confirmed Parquet record schemas, partition boundaries, and field IDs (`PARQUET:field_id`) matching Apache Iceberg v2 specs.

---

## Next Steps (Transition to Master 6)
With Iceberg persistence and DLQ quarantine operational:
- **Master 6**: Implement the **2% Circuit Breaker Engine**, incident management automation, and real-time observability metrics computation.

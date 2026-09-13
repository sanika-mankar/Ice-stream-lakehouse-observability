# Ice Stream — Complete System Architecture (Masters 1–7)

## Executive Summary

Ice Stream is a production-grade, zero-cost streaming data-quality and lakehouse observability platform. It processes real-time transaction events through Apache Flink, rigorously applies 8 canonical Data Quality rules, protects lakehouse ingestion via an automatic 2% threshold Circuit Breaker, writes valid transactions and quarantined failures to Apache Iceberg on Backblaze B2, and delivers full observability through a FastAPI backend and interactive React Flow dashboard.

```
                    ┌─────────────────────────┐
                    │  Python Event Producer  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    Aiven Cloud Kafka    │ (SASL_SSL / topic: default)
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Apache Flink 1.18.1   │ (10s Tumbling Windows)
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    ValidationEngine     │ (Rules DQ-001 through DQ-008)
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     Circuit Breaker     │ (Strict > 2.0% error rate gate)
                    └──────┬────────────┬─────┘
           CLOSED / Valid  │            │  OPEN / Tripped / DLQ
                           ▼            ▼
               ┌────────────────┐  ┌────────────────┐
               │  clean_events  │  │   dlq_events   │
               └───────┬────────┘  └────────┬───────┘
                       │                    │
                       ▼                    ▼
             ┌────────────────────────────────────────┐
             │   Apache Iceberg 1.5.2 Lakehouse       │
             │   - S3FileIO + Backblaze B2            │
             │   - SQLite JdbcCatalog                 │
             └──────────────────┬─────────────────────┘
                                │
                                ▼
             ┌────────────────────────────────────────┐
             │   FastAPI Observability Gateway & WS   │
             │   - REST Endpoints (/api/...)          │
             │   - WebSocket Broadcaster (/ws)        │
             │   - Incident Repository (SQLite)       │
             └──────────────────┬─────────────────────┘
                                │
                                ▼
             ┌────────────────────────────────────────┐
             │      React + Vite Web Dashboard        │
             │   - Interactive React Flow DAG         │
             │   - Real-time Metrics & Incidents      │
             │   - Manual Operator Recovery Actions   │
             └────────────────────────────────────────┘
```

---

## Architecture Layers

### Layer 1: Domain Layer (`app/domain/`)
- **Transaction**: Immutable transaction payload with strictly typed fields (`event_id`, `timestamp`, `customer_id`, `amount`, `currency`, `status`, `payment_method`, `schema_version`).
- **ValidationResult**: Typed outcome containing valid/invalid status, error messages, and rule ID tags.
- **QuarantineRecord**: Failure record with root-cause violation details, payload envelope, and error metadata.

### Layer 2: Ingestion Layer (`app/ingestion/`)
- **TransactionGenerator**: Deterministic generator for valid payloads and controlled error injection.
- **KafkaProducer**: Production Kafka producer connecting to Aiven Cloud Kafka using SASL_SSL (SCRAM-SHA-256).
- **Streaming Pipeline**: Real-time event consumption with Flink deserialization.

### Layer 3: Validation Engine Layer (`app/validation/`)
Implements 8 canonical data-quality rules:
- **DQ-001: REQUIRED_FIELD_MISSING** (Critical) — Rejects events missing `event_id`, `timestamp`, `customer_id`, or `amount`.
- **DQ-002: NULL_REQUIRED_FIELD** (Critical) — Rejects events where required fields are null or empty strings.
- **DQ-003: INVALID_TYPE** (High) — Rejects type mismatches (e.g. non-numeric amount, non-string customer ID).
- **DQ-004: INVALID_RANGE** (High) — Rejects negative or zero amount, or amounts exceeding domain limit ($1,000,000).
- **DQ-005: INVALID_ENUM** (Medium) — Rejects unrecognized transaction status or payment methods.
- **DQ-006: DUPLICATE_EVENT** (Warning) — Rejects events with identical `event_id` within the tumbling state deduplication window.
- **DQ-007: SCHEMA_MISMATCH** (Critical) — Rejects structural divergences from the registered JSON/Avro schema.
- **DQ-008: UNKNOWN_SCHEMA_VERSION** (Critical) — Rejects payloads specifying unregistered schema versions.

### Layer 4: Stream Processing Layer (`app/pipeline/`)
- **Apache Flink 1.18.1**: Executes tumbling window aggregations (10-second intervals), calculating window-level processed, valid, invalid, and error rate metrics.
- **Dual Stream Splitting**: Emits partitioned output streams for clean records and quarantined records.

### Layer 5: Observability & Circuit Breaker Layer (`app/observability/`)
- **CircuitBreaker**: Stateful gate enforcing a strict 2.0% ($> 0.02$) threshold.
  - `CLOSED`: Normal operation; valid events flow to `clean_events`, invalid events flow to `dlq_events`.
  - `OPEN`: Error rate $> 2\%$; trips immediately, diverts 100% of traffic to `dlq_events` with incident creation and notifications.
  - `HALF_OPEN`: Operator-triggered probe phase; allows canary evaluation before full resumption.
- **IncidentManager**: Coordinates incident lifecycle (`OPEN` $\to$ `ACKNOWLEDGED` $\to$ `RESOLVED`) with audit logging.
- **SQLite Observability Repository (`data/observability.db`)**: Thread-safe persistent storage for incidents, circuit transitions, and metric snapshots.

### Layer 6: Lakehouse Storage Layer (`app/storage/`)
- **Apache Iceberg 1.5.2**: ACID lakehouse table format with snapshot isolation and time travel.
- **Backblaze B2 S3-Compatible Storage**: Object storage via S3FileIO (`s3a://...`).
- **SQLite JdbcCatalog**: Lightweight, zero-cost, persistent metadata catalog (`data/iceberg_catalog.db`).
- **Tables**:
  - `clean_events`: Partitioned by `day(timestamp)` with Parquet storage.
  - `dlq_events`: Partitioned by `rule_id, day(timestamp)` with full violation annotations.

### Layer 7: FastAPI Backend Layer (`app/api/`)
- **REST Endpoints**:
  - `GET /`: Platform root and health overview.
  - `GET /api/health`: Health status and circuit breaker state.
  - `GET /api/metrics`: Live streaming metrics and window quality counters.
  - `GET /api/incidents`: Incident audit log with status filtering.
  - `GET /api/incidents/active`: Current unresolved incidents.
  - `POST /api/incidents/{id}/acknowledge`: Operator incident acknowledgment.
  - `POST /api/incidents/{id}/resolve`: Operator incident resolution.
  - `POST /api/recovery`: Transition circuit breaker from `OPEN` to `HALF_OPEN`.
  - `GET /api/pipeline/status`: Topology nodes, edges, and streaming metrics for React Flow.
  - `GET /api/lakehouse/status`: B2 bucket connectivity, catalog config, and table metadata.
  - `GET /api/lakehouse/tables`: Table schema and partition definitions.
  - `GET /api/lakehouse/snapshots`: Iceberg snapshot history and time travel manifests.
  - `GET /api/system`: Redacted runtime environment metadata.
- **WebSocket Gateway (`/ws`)**: Broadcasts real-time `initial_state`, `metrics_update`, and `circuit_state_changed` frames.

### Layer 8: React Frontend Dashboard (`frontend/`)
- **React 19 + Vite + Zustand**: Lightweight, responsive SPA.
- **React Flow Pipeline DAG**: Dynamic visualization of nodes (`source` $\to$ `kafka` $\to$ `flink` $\to$ `quality` $\to$ `circuit` $\to$ `clean_sink` / `dlq_sink`) with real-time throughput, latency, error rate, and node side-panel inspection.
- **Command Center & Reliability Console**: Real-time error rate tracking against the strict 2% threshold, incident management table, and operator recovery triggers.

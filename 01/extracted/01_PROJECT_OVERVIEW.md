# Ice Stream — Real-Time Lakehouse Observability

## 1. Project Description

Ice Stream is an industry-oriented real-time data quality and lakehouse observability platform for e-commerce transaction pipelines.

The system receives real transaction events, validates them against explicit data contracts and quality rules, routes valid records to clean storage, quarantines invalid records with detailed reasons, and exposes operational metrics through an observability dashboard.

The project is designed to demonstrate practical Data Engineering, Data Quality, Streaming, Lakehouse, and Observability concepts without hiding the important engineering decisions behind a toy demo.

## 2. Real-World Problem

Modern data platforms continuously ingest events from applications, payments, orders, logistics systems, and third-party sources. Production pipelines can fail because:

- required fields are NULL;
- columns disappear or are unexpectedly added;
- data types change;
- values violate business constraints;
- duplicate events arrive;
- malformed records enter the stream;
- upstream systems send an incompatible schema.

Ice Stream treats data quality as an operational concern rather than only a preprocessing step.

## 3. What Ice Stream Does

1. Generates or ingests realistic e-commerce transaction events.
2. Assigns event metadata such as event ID, source, event time, and schema version.
3. Validates each event against a versioned data contract.
4. Runs data quality checks.
5. Sends valid events to the clean data layer.
6. Sends invalid events to quarantine with structured failure reasons.
7. Records pipeline metrics and processing outcomes.
8. Displays pipeline health and quality metrics in a dashboard.
9. Provides logs and test coverage for debugging and reliability.

## 4. Production-Oriented Principles

- Configuration over hard-coded values.
- Schema contracts over implicit assumptions.
- Structured logs over print statements.
- Deterministic tests.
- Idempotent processing where possible.
- Explicit error categories.
- Reproducible local setup.
- Environment variables for secrets/configuration.
- Clear separation of ingestion, validation, storage, observability, and presentation.
- Every important feature has tests and documentation.

## 5. Target Architecture

```text
                 E-Commerce Transaction Sources
                              |
                              v
                    +--------------------+
                    | Streaming Ingestion|
                    | Kafka / Adapter    |
                    +---------+----------+
                              |
                              v
                    +--------------------+
                    | Data Contract      |
                    | + Schema Registry  |
                    +---------+----------+
                              |
                              v
                    +--------------------+
                    | Validation Engine  |
                    | Schema + Quality   |
                    +---------+----------+
                              |
                 +------------+------------+
                 |                         |
              VALID                     INVALID
                 |                         |
                 v                         v
       +------------------+      +------------------+
       | Clean Data Layer |      | Quarantine Layer |
       | Parquet/DuckDB   |      | Parquet/DuckDB   |
       +--------+---------+      +---------+--------+
                |                          |
                +------------+-------------+
                             |
                             v
                  +-----------------------+
                  | Observability Engine  |
                  | Metrics / Logs / SLOs |
                  +-----------+-----------+
                              |
                              v
                    +--------------------+
                    | Streamlit Dashboard|
                    +--------------------+
```

## 6. MVP vs Production Path

### Development MVP
- Python
- Kafka-compatible streaming abstraction
- Pydantic
- DuckDB
- Parquet
- Streamlit
- Pytest
- structlog/logging
- Docker Compose

### Production Extension
The architecture should allow later replacement/addition of:
- Apache Kafka
- Apache Flink or Spark Structured Streaming
- Apache Iceberg
- PostgreSQL
- Prometheus/Grafana
- OpenTelemetry
- Kubernetes

The first version must not pretend to be a distributed enterprise platform if those components are not actually deployed.

## 7. Success Criteria

A demo is considered complete when the system can process realistic transactions end-to-end, detect multiple quality failures, quarantine bad records with explainable reasons, persist clean records, calculate pipeline metrics, display them in a dashboard, run automated tests, and start reproducibly from documented commands.

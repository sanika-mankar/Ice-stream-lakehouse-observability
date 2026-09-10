# Master 4: Portable Real-Time Flink Processing + Data Quality Engine

## Architecture
The real-time streaming layer is powered by **Apache Flink 1.18.1** (PyFlink DataStream API) and supports both native Windows execution and containerized execution with Docker to ensure complete portability.

**Data Flow:**
`Aiven Kafka (Transactions)` → `Flink Source` → `Schema Parsing (DQ-008)` → `Duplicate Detection (State / DQ-006)` → `ValidationEngine (DQ-001..DQ-004)` → `VALID / INVALID Streams` → `10s Tumbling Window Metrics`

## Versioning & API
- **Apache Flink**: 1.18.1
- **PyFlink**: 1.18.1
- **Python**: 3.10 / 3.11
- **Kafka Connector**: `flink-sql-connector-kafka-3.1.0-1.18.jar`
- **JDK Requirement**: Java 11 (auto-detected from `.jdk` on Windows or host `JAVA_HOME`)

*Why PyFlink DataStream API?*
The Data Quality validation rules were already implemented in Python (`app.validation`). By using PyFlink, we wrapped the exact existing Python `ValidationEngine` natively without translating rules to Java/Scala, honoring DRY principles. The DataStream API provides low-level KeyedProcessFunctions needed for bounded state duplicate detection (DQ-006).

## Duplicate Detection (DQ-006)
Duplicates are detected using Flink's `ValueState`. 
- **State Key**: `event_id`
- **TTL Window**: Configurable via `DUPLICATE_TTL_HOURS` (Default: 24h).
- **TTL Strategy**: State expires X hours after being written and is automatically cleaned up, preventing unbounded memory growth.

## Schema Version Strategy (DQ-008)
The Flink job explicitly parses `schema_version`.
- If missing: Tagged as `Missing schema_version (DQ-008)`.
- If != "1.0": Tagged as `Unknown schema_version (DQ-008)`.

## Metrics Calculation
A tumbling process-time window runs continuously (configurable via `QUALITY_WINDOW_SECONDS`, default 10s). It calculates:
- **Processed / Valid / Invalid counts**
- **Error Rate**: `(Invalid / Processed)`
- **Quality Score**: `(Valid / Processed) * 100`
- **Throughput**: Events / sec

```text
[METRICS] Window: 10s | Processed: 30 | Valid: 26 | Invalid: 4 | Error Rate: 13.33% | Quality Score: 86.7/100 | Throughput: 3.0 events/sec
```

## Execution Instructions

### Option 1: Native Windows Execution
Portable OpenJDK 11 can be placed in `.jdk/` (auto-detected), avoiding system-wide Java installs.

**1. Verify Kafka Connection**
```powershell
python scripts\test_kafka_connection.py
```

**2. Run Flink Quality Engine**
```powershell
python flink\src\job.py
```

### Option 2: Docker Execution
```bash
docker-compose build
docker-compose up -d
docker-compose exec jobmanager flink run -py /opt/flink/usrlib/flink/src/job.py
```

## Verified Acceptance Test Output (Real Aiven Kafka)
```text
[VALID STREAM] event_id=ceb1d778-15e4-d995-7211-9bf849e05d25
[VALID STREAM] event_id=2ffbe485-a57e-ed36-6454-8572c703d6cb

[INVALID STREAM] event_id=3e004f0f-1eef-f1e7-9324-6f6471f1c7ef errors=["Field 'quantity' must be an integer, got str"]
[INVALID STREAM] event_id=087ef3b0-55cc-1fd9-1d84-1a7c24d8ae21 errors=["Invalid status 'UNKNOWN_STATUS'. Must be one of: PENDING, REFUNDED, FAILED, COMPLETED"]
[INVALID STREAM] event_id=07e27e99-d6df-b969-70b8-4e20f19db5d0 errors=['Missing required fields: customer_id']
[INVALID STREAM] event_id=7607c5c9-4cc3-3bef-2bdd-30040d93e272 errors=['Negative unit_price not allowed: -1168.22']

[METRICS] Window: 10s | Processed: 30 | Valid: 26 | Invalid: 4 | Error Rate: 13.33% | Quality Score: 86.7/100 | Throughput: 3.0 events/sec
```

## Future Deployment Contract
The `flink/Dockerfile` is the deployment unit. A remote platform (e.g., Kubernetes, AWS KDA) only needs to provide:
1. The container image.
2. The `.env` variables for Kafka connectivity and TTL tuning.
3. Access to a persistent remote checkpoint directory (e.g., S3/GCS) when checkpointing is fully enabled for production.

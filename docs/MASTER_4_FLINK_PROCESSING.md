# Master 4: Portable Real-Time Flink Processing + Data Quality Engine

## Architecture
The real-time streaming layer is powered by **Apache Flink 1.18.1** (PyFlink DataStream API) and containerized with Docker to ensure complete portability across development and future deployment environments (e.g., Kubernetes).

**Data Flow:**
`Aiven Kafka (Transactions)` → `Flink JobManager/TaskManager` → `Schema Parsing` → `Duplicate Detection (State)` → `Quality Engine (Business Rules)` → `GOOD/BAD Streams` → `Temporary Console Sink`

## Versioning & API
- **Apache Flink**: 1.18.1
- **PyFlink**: 1.18.1
- **Python**: 3.10
- **Kafka Connector**: `flink-sql-connector-kafka-3.1.0-1.18.jar`

*Why PyFlink DataStream API?*
The Data Quality validation rules were already implemented in Python (`app.validation`). By using PyFlink, we wrapped the exact existing Python `ValidationEngine` natively without translating rules to Java/Scala, honoring DRY principles. The DataStream API provides low-level KeyedProcessFunctions needed for bounded state duplicate detection (DQ-006).

## Duplicate Detection (DQ-006)
Duplicates are detected using Flink's `ValueState`. 
- **State Key**: `event_id`
- **TTL Window**: Configurable via `DUPLICATE_TTL_HOURS` (Default: 24h).
- **TTL Strategy**: State expires X hours after being written and is automatically cleaned up, preventing unbounded memory growth.

## Schema Version Strategy
The Flink job explicitly parses `schema_version`.
- If missing: Tagged as `Missing schema_version (DQ-008)`.
- If != "1.0": Tagged as `Unknown schema_version (DQ-008)`.

## Metrics Calculation
A tumbling process-time window runs continuously (configurable via `QUALITY_WINDOW_SECONDS`, default 5s). It calculates:
- **Processed / Valid / Invalid counts**
- **Error Rate**: (Invalid / Processed)
- **Quality Score**: (Valid / Processed) * 100
- **Throughput**: Events / sec

## Execution Instructions (Docker)
This is 100% portable and isolated from your host operating system.

**1. Build the Flink Image**
```bash
docker-compose build
```

**2. Start the Flink Cluster**
```bash
docker-compose up -d
```
The Flink Dashboard will be available at `http://localhost:8081`.

**3. Submit the Job**
```bash
docker-compose exec jobmanager flink run -py /opt/flink/usrlib/flink/src/job.py
```

**4. View the Output**
Run the Master 3 Kafka generator in another terminal.
Then view the Flink TaskManager logs to see the GOOD/BAD streams and Quality Metrics:
```bash
docker-compose logs -f taskmanager
```

## Future Deployment Contract
The `flink/Dockerfile` is the deployment unit. A remote platform (e.g., Kubernetes, AWS KDA) only needs to provide:
1. The container image.
2. The `.env` variables for Kafka connectivity and TTL tuning.
3. Access to a persistent remote checkpoint directory (e.g., S3/GCS) when checkpointing is fully enabled for production.

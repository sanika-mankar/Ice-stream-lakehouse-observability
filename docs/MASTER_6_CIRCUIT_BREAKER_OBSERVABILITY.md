# Master 6: Real-Time Circuit Breaker, Incident Management & Pipeline Observability

## 1. Architecture Overview
Master 6 establishes the authoritative backend operational control plane and real-time circuit breaker for the Ice Stream streaming lakehouse platform. It builds directly upon the approved Master 5 lakehouse storage architecture without modification to the dataflow, validation engines, or cloud object storage sinks.

```
                         REAL AIVEN KAFKA
                                │
                                ▼
                       APACHE FLINK 1.18.1
                                │
                                ▼
                   VALIDATION ENGINE (DQ-001..DQ-008)
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
            VALID STREAM                 INVALID STREAM
                 │                             │
                 ▼                             ▼
        Iceberg Clean Table           Iceberg DLQ Table
                 │                             │
                 └──────────────┬──────────────┘
                                ▼
                        BACKBLAZE B2 S3FileIO
                                ▲
                                │
               10-SECOND TUMBLING EVALUATION WINDOW
                                │
                                ▼
                    CIRCUIT BREAKER ENGINE
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 State Machine         Incident Management      Pipeline Health
 (CLOSED/OPEN/HALF)     (data/observability.db)   (HEALTHY/DEGRADED/TRIPPED)
```

---

## 2. Circuit Breaker State Machine
The circuit breaker implements an explicit, deterministic finite state machine consisting of three states:

```
                     ┌──────────────────┐
                     │      CLOSED      │◀────────────────┐
                     │ (Normal Traffic) │                 │
                     └─────────┬────────┘                 │
                               │                          │
                 error_rate    │                          │ probe passed
                   > 2%        ▼                          │ (error_rate <= 2%
                     ┌──────────────────┐                 │  on real events)
                     │       OPEN       │                 │
                     │   (Fail-Fast)    │                 │
                     └─────────┬────────┘                 │
                               │                          │
                      operator │                          │
                      recovery │                          │
                               ▼                          │
                     ┌──────────────────┐                 │
                     │    HALF_OPEN     ├─────────────────┘
                     │  (Probe Mode)    │
                     └─────────┬────────┘
                               │
                 probe failed  │
               (error_rate > 2%)
                               ▼
                              OPEN
```

- **CLOSED**:
  - The pipeline operates normally.
  - Events are continuously validated across DQ-001 through DQ-008 and routed to clean or DLQ Iceberg tables in Backblaze B2.
  - Quality metrics are accumulated on 10-second tumbling windows.
- **OPEN**:
  - Tripped when window `error_rate > 0.02`.
  - Fail-fast mechanism triggers: an incident is persisted to `data/observability.db`, a structured log `[CIRCUIT OPEN]` is emitted, and Flink execution halts via `CircuitBreakerTripException` without committing uncommitted checkpoint state.
  - No silent data loss occurs; Kafka offsets remain at the last completed checkpoint.
- **HALF_OPEN**:
  - Controlled recovery state entered exclusively via an explicit recovery trigger (`service.initiate_recovery()` or `python scripts/manage_circuit_breaker.py recover`).
  - Evaluates real probe traffic over the evaluation window:
    - If healthy (`error_rate <= 0.02` with real events processed) $\to$ restores to `CLOSED` and marks active incident `RESOLVED`.
    - If unhealthy (`error_rate > 0.02`) $\to$ re-trips immediately to `OPEN`.

---

## 3. Strict 2% Threshold Rule
The circuit breaker threshold is non-negotiable:

$$\text{error\_rate} > 0.02$$

The condition is strictly greater than (`>`), **NOT** $\ge$, **NOT** $5\%$, and **NOT** approximate:

| Error Rate | Mathematical Value | Circuit State | Rationale |
| :--- | :--- | :--- | :--- |
| **0.00%** | $0.0000$ | **CLOSED** | Completely healthy |
| **1.00%** | $0.0100$ | **CLOSED** | Within acceptable threshold |
| **2.00%** | $0.0200$ | **CLOSED** | Exact boundary remains closed ($\le 0.02$) |
| **2.01%** | $0.0201$ | **OPEN** | Strictly greater than threshold ($> 0.02$) |
| **3.00%** | $0.0300$ | **OPEN** | Breached threshold |
| **10.00%**| $0.1000$ | **OPEN** | Severe data quality violation |

The threshold is configured via a named constant:
```python
CIRCUIT_BREAKER_ERROR_RATE_THRESHOLD = float(os.getenv("CIRCUIT_BREAKER_ERROR_RATE_THRESHOLD", "0.02"))
```

---

## 4. Error-Rate & Metric Formulas
The circuit breaker derives metrics exclusively from streaming quality validation:

$$\text{processed\_events} = \text{valid\_events} + \text{invalid\_events}$$

$$\text{error\_rate} = \frac{\text{invalid\_events}}{\text{processed\_events}}$$

$$\text{quality\_score} = \left(\frac{\text{valid\_events}}{\text{processed\_events}}\right) \times 100$$

$$\text{throughput} = \frac{\text{processed\_events}}{\text{duration\_seconds}}$$

### Zero-Event Window Safety
If no events arrive during a window (`processed_events == 0`):
- `error_rate = 0.0`
- `quality_score = 100.0`
- `throughput = 0.0`
- Division-by-zero is mathematically prevented.

---

## 5. Window Semantics
Evaluation windows adhere strictly to Master 4/5 semantics:
- **Type**: Tumbling processing-time windows.
- **Duration**: Exactly 10 seconds (`QUALITY_WINDOW_SECONDS=10`).
- Sliding, session, or rolling windows are not used to preserve deterministic checkpoint boundaries.

---

## 6. Incident Management & Lifecycle
Every circuit breaker trip automatically generates an operational incident with the following lifecycle:

```
  [Trip]        [Operator Review]       [Recovery Initiated]       [Probe Passed]
    │                  │                         │                       │
    ▼                  ▼                         ▼                       ▼
  OPEN ────────▶ ACKNOWLEDGED ────────────▶  RESOLVING ──────────▶   RESOLVED
```

### Incident Fields (18 Normalized Attributes)
- `incident_id`: Deterministic unique identifier (`inc-<uuid12>`).
- `incident_type`: `CIRCUIT_BREAKER_TRIPPED`, `PIPELINE_FAILURE`, `PIPELINE_RECOVERY`, `CIRCUIT_BREAKER_RECOVERED`.
- `severity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- `status`: `OPEN`, `ACKNOWLEDGED`, `RESOLVING`, `RESOLVED`.
- `created_at`: ISO 8601 UTC timestamp of initial trip.
- `updated_at`: ISO 8601 UTC timestamp of last status change.
- `resolved_at`: ISO 8601 UTC timestamp when recovery was confirmed.
- `circuit_state`: `OPEN`, `HALF_OPEN`, `CLOSED`.
- `error_rate`: Evaluated window error rate (e.g. `0.0300`).
- `threshold`: Threshold at trip time (`0.0200`).
- `processed_count`: Total events in evaluation window.
- `valid_count`: Valid event count.
- `invalid_count`: Invalid event count.
- `window_start`: ISO 8601 timestamp of window start.
- `window_end`: ISO 8601 timestamp of window end.
- `reason`: Formatted breach explanation.
- `affected_component`: Target pipeline component (`flink-stream-quality-engine`).
- `recovery_attempts`: Count of probe attempts during incident lifecycle.
- `resolution_reason`: Formatted explanation of recovery criteria satisfied.

---

## 7. Pipeline Health Model
The system exposes a deterministic `PipelineState` coupled to circuit and data conditions:

- **`HEALTHY`**: Circuit is `CLOSED` and `error_rate == 0.0`.
- **`DEGRADED`**: Circuit is `CLOSED` and $0.0 < \text{error\_rate} \le 0.02$. Errors exist but are within tolerance.
- **`TRIPPED`**: Circuit is `OPEN` ($\text{error\_rate} > 0.02$). Fail-fast triggered.
- **`RECOVERING`**: Circuit is in `HALF_OPEN` recovery probe mode.
- **`FAILED`**: Unrecoverable fatal exception or infrastructure failure.

---

## 8. Observability Metrics Engine
Metrics are tracked through `ObservabilityMetricsAggregator` with thread safety and bounded historical storage:
- **Lifetime Aggregates**:
  - `processed_events_total`
  - `valid_events_total`
  - `invalid_events_total`
  - `lifetime_error_rate`
  - `lifetime_quality_score`
  - `uptime_seconds`
- **Current Window Metrics**:
  - `current_error_rate`
  - `current_quality_score`
  - `current_throughput`
  - `last_event_time`
  - `last_successful_checkpoint`
- **Memory Safety**: In-memory historical queue is bounded via `collections.deque(maxlen=100)`.

---

## 9. Operational Persistence (SQLite Separation)
To maintain zero-cost portable infrastructure and clear domain separation, operational records are stored in a dedicated database:

- `data/iceberg_catalog.db`: Exclusively for Iceberg JdbcCatalog table pointer metadata.
- `data/observability.db`: Exclusively for operational incidents and audit events.
  - Path configurable via `OBSERVABILITY_DB_PATH`.
  - Tables: `incidents` and `pipeline_events`.
  - Indexes: `idx_incidents_status`, `idx_incidents_created_at`, `idx_incidents_type`, `idx_pipeline_events_time`.

---

## 10. Recovery Behavior & Probe Semantics
Oscillations (`CLOSED` $\to$ `OPEN` $\to$ `CLOSED`) are prevented:
1. When `OPEN` is entered, the pipeline halts normal acceptance.
2. An operator or orchestrator explicitly initiates recovery:
   ```bash
   python scripts/manage_circuit_breaker.py recover
   ```
3. The circuit enters `HALF_OPEN`, setting incident status to `RESOLVING`.
4. Real probe events pass through Flink validation:
   - If `error_rate <= 0.02` with real events ($> 0$), circuit restores to `CLOSED` and marks incident `RESOLVED`.
   - If `error_rate > 0.02`, circuit re-trips to `OPEN`.
5. Timer-based fake recovery is prohibited.

---

## 11. Flink Failure Semantics & Checkpoints
- **Fail-Fast Operator Behavior**:
  When `MetricsWindowFunction` detects `error_rate > 0.02`, it raises `CircuitBreakerTripException`.
- **Checkpoint Consistency**:
  Flink's 10-second checkpoint interval governs commit boundaries. Uncommitted Iceberg transactions are rolled back/abandoned, and Kafka consumer group offsets remain at the last completed checkpoint.
- **No Offset Tampering**:
  Kafka offsets are not manually rolled back or manipulated.

---

## 12. Structured Logging
Structured operational logs are emitted with standardized tags:
- `[CIRCUIT CLOSED]`
- `[CIRCUIT OPEN]`
- `[CIRCUIT HALF_OPEN]`
- `[CIRCUIT RECOVERED]`
- `[INCIDENT CREATED]`
- `[INCIDENT UPDATED]`
- `[INCIDENT RESOLVED]`
- `[PIPELINE HEALTH]`
- `[PIPELINE FAILED]`

---

## 13. Configuration Parameters
All parameters are configurable via environment variables in `.env`:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `CIRCUIT_BREAKER_ENABLED` | `true` | Enables or disables circuit breaker enforcement |
| `CIRCUIT_BREAKER_ERROR_RATE_THRESHOLD` | `0.02` | Strict error rate threshold (strictly $> 2\%$ trips) |
| `CIRCUIT_BREAKER_FAIL_FAST` | `true` | Raises `CircuitBreakerTripException` on trip |
| `OBSERVABILITY_DB_PATH` | `data/observability.db` | SQLite path for operational incidents |
| `QUALITY_WINDOW_SECONDS` | `10` | Tumbling evaluation window duration in seconds |

---

## 14. Security & Credential Redaction
- No Kafka passwords, SASL credentials, or Backblaze B2 access keys are ever stored in `incidents`, `pipeline_events`, or application logs.
- SQLite operational database files (`*.db`) and `.env` files are strictly ignored in `.gitignore`.

---

## 15. Testing Suite Summary
The complete automated test suite consists of 55 tests covering:
- **Threshold Boundaries**: Exact verification that $2.00\%$ remains `CLOSED` and $2.01\%$ trips to `OPEN`.
- **Zero-Event Safety**: Division-by-zero protection.
- **Incident Lifecycle**: `OPEN` $\to$ `ACKNOWLEDGED` $\to$ `RESOLVING` $\to$ `RESOLVED`.
- **Persistence Across Restarts**: Database reopening and active incident retrieval.
- **Live Scenarios**: Real Aiven Kafka batches produced and verified across healthy (1%), boundary (2%), breach (3%), and recovery (0%) runs.

---

## 16. Known Limitations
1. Single-node in-process Flink parallelism (`FLINK_PARALLELISM=1`). Distributed circuit breaker state across multi-worker clusters would require a centralized coordinator or Flink state backend queryable service.
2. Probe batch evaluation currently occurs in the subsequent 10-second window rather than an isolated sub-channel.

---

## 17. Master 7 Integration Boundary
Master 6 establishes the complete backend operational model. **Master 7** will consume these clean interfaces without modifying circuit logic:
- `service.get_snapshot() -> ObservabilitySnapshot`: Powers FastAPI health and WebSocket metric streams.
- `service.get_active_incidents() -> List[Incident]`: Powers incident alerts and UI status indicators.
- `service.list_incidents(limit) -> List[Incident]`: Powers incident history audit tables.
- `service.initiate_recovery() -> bool`: Powers the manual "Initiate Recovery" dashboard action button.
- `service.acknowledge_incident(id) -> Incident`: Powers the dashboard incident acknowledgment button.

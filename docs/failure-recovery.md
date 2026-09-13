# Ice Stream — Failure Modes & Recovery Runbook

## 1. Failure Modes & Mitigations

| Failure Scenario | Root Cause | Impact | Automated System Response | Operator Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **High Malformed Ingestion** | Schema changes or upstream bug sending corrupt records | Error rate exceeds 2.0% ($> 0.02$) | **Circuit Breaker trips to OPEN**. Diverts 100% of traffic to `dlq_events`. Halts writes to `clean_events`. Logs incident. | 1. Identify failing rule in DLQ inspector.<br>2. Roll back upstream producer.<br>3. Trigger recovery via `/api/recovery`. |
| **Missing Schema Version (DQ-008)** | Event producer emits unsupported version tag | Payload cannot be validated | Routed to `dlq_events` with tag `DQ-008: UNKNOWN_SCHEMA_VERSION`. | Register new schema version in `app/validation/schema.py` or revert producer. |
| **Kafka SASL Authentication Failure** | Credentials expired or rotated | Flink consumer unable to poll events | Flink retries with exponential backoff. Latency increases. | Verify credentials in `.env` and restart backend / pipeline. |
| **Backblaze B2 Transient Outage** | Network timeout on S3 endpoint | Iceberg commit failure | Flink checkpoint retry mechanism attempts commit. | Check B2 service status. Catalog transactions rollback safely under ACID guarantees. |
| **Catalog Database Lock** | Concurrent write to SQLite `data/iceberg_catalog.db` | Catalog timeout | SQLite WAL mode handles concurrent readers; serialized writers queue. | Ensure proper WAL mode (`PRAGMA journal_mode=WAL`) is enabled. |

---

## 2. Canonical Data Quality Violations (DQ-001 through DQ-008)

1. **DQ-001: REQUIRED_FIELD_MISSING**
   - *Failure*: Payload lacks `event_id`, `timestamp`, `customer_id`, or `amount`.
   - *Quarantine Target*: `dlq_events` with `error_rule="DQ-001"`.
2. **DQ-002: NULL_REQUIRED_FIELD**
   - *Failure*: Required field is explicitly `null` or whitespace.
   - *Quarantine Target*: `dlq_events` with `error_rule="DQ-002"`.
3. **DQ-003: INVALID_TYPE**
   - *Failure*: `amount` is string, or `timestamp` is invalid ISO-8601.
   - *Quarantine Target*: `dlq_events` with `error_rule="DQ-003"`.
4. **DQ-004: INVALID_RANGE**
   - *Failure*: `amount <= 0` or `amount > 1,000,000`.
   - *Quarantine Target*: `dlq_events` with `error_rule="DQ-004"`.
5. **DQ-005: INVALID_ENUM**
   - *Failure*: `status` not in `['COMPLETED', 'PENDING', 'FAILED', 'CANCELLED']` or unrecognized `payment_method`.
   - *Quarantine Target*: `dlq_events` with `error_rule="DQ-005"`.
6. **DQ-006: DUPLICATE_EVENT**
   - *Failure*: Duplicate `event_id` detected inside tumbling window state.
   - *Quarantine Target*: `dlq_events` with `error_rule="DQ-006"`.
7. **DQ-007: SCHEMA_MISMATCH**
   - *Failure*: Record fields violate expected schema structure.
   - *Quarantine Target*: `dlq_events` with `error_rule="DQ-007"`.
8. **DQ-008: UNKNOWN_SCHEMA_VERSION**
   - *Failure*: Schema version tag is not recognized by validation engine.
   - *Quarantine Target*: `dlq_events` with `error_rule="DQ-008"`.

---

## 3. Circuit Breaker Recovery Workflow

```
               ┌───────────────────────┐
               │     State: CLOSED     │  (Error rate <= 2%)
               └──────────┬────────────┘
                          │ Error rate > 2%
                          ▼
               ┌───────────────────────┐
               │      State: OPEN      │  (100% traffic to DLQ)
               └──────────┬────────────┘
                          │ POST /api/recovery
                          ▼
               ┌───────────────────────┐
               │    State: HALF_OPEN   │  (Evaluation probe phase)
               └───────┬───────────────┘
       Clean window    │               │ High error rate persists
   (Error rate <= 2%)  │               │ (Error rate > 2%)
                       ▼               ▼
         ┌───────────────────┐   ┌───────────────────┐
         │   State: CLOSED   │   │    State: OPEN    │
         └───────────────────┘   └───────────────────┘
```

### Step-by-Step Incident Recovery
1. **Detect**: Alert received on dashboard or `/api/health` indicates `circuit_state: "OPEN"`.
2. **Inspect**:
   - Query active incidents: `curl http://127.0.0.1:8000/api/incidents/active`
   - Check error breakdown in `GET /api/metrics`.
3. **Acknowledge**:
   - `curl -X POST http://127.0.0.1:8000/api/incidents/<ID>/acknowledge`
4. **Fix Root Cause**:
   - Fix upstream bad payload producer or adjust configuration.
5. **Trigger Probe Recovery**:
   - `curl -X POST http://127.0.0.1:8000/api/recovery`
   - Circuit enters `HALF_OPEN`.
6. **Verify & Close**:
   - Once a clean window processes ($\le 2\%$), circuit closes automatically.
   - Resolve incident:
     `curl -X POST http://127.0.0.1:8000/api/incidents/<ID>/resolve -H "Content-Type: application/json" -d '{"reason": "Upstream bad data producer patched"}'`

# Ice Stream — System Flow and Processing

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ DATA SOURCE                                                     │
│ (e-commerce, API, manual test data)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────────────┐
│ INGESTION                                                       │
│ • Receive event from source                                     │
│ • Add event envelope (ID, timestamp, source)                    │
│ • Emit ingest event                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────────────┐
│ VALIDATION                                                      │
│ • Completeness (required fields present, not NULL)             │
│ • Type validation (correct types)                              │
│ • Business rules (amounts, enums, ranges)                      │
│ • Schema compatibility (schema version, structure)             │
│ • Uniqueness (duplicate detection)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  v                     v
           ✅ VALID               ❌ INVALID
                  │                     │
                  v                     v
    ┌─────────────────────┐   ┌─────────────────────┐
    │ CLEAN DATA STORAGE  │   │ QUARANTINE STORAGE  │
    │                     │   │                     │
    │ • DuckDB            │   │ • Full event        │
    │ • Parquet format    │   │ • Failure reasons   │
    │ • Partitioned       │   │ • Error messages    │
    │ • Query-ready       │   │ • Recovery info     │
    └─────────────────────┘   └─────────────────────┘
                  │                     │
                  └──────────┬──────────┘
                             │
                             v
           ┌─────────────────────────────┐
           │ OBSERVABILITY COLLECTION    │
           │                             │
           │ • Event counts              │
           │ • Processing latency        │
           │ • Quality metrics           │
           │ • Failure categories        │
           └──────────────┬──────────────┘
                          │
                          v
           ┌──────────────────────────┐
           │ DASHBOARD & ALERTS       │
           │                          │
           │ • Real-time overview     │
           │ • Quality analytics      │
           │ • Failure investigation  │
           │ • Operational alerts     │
           └──────────────────────────┘
```

## Detailed Processing Steps

### 1. Ingestion Phase

**Input:** Raw event from source

**Process:**

```python
1. Receive event from source (Kafka, file, API, etc.)
2. Validate basic structure (is it JSON/dict?)
   ├─ YES: Continue to validation
   └─ NO: Create parsing failure record → Quarantine
3. Create event envelope
   ├─ Generate unique event_id (evt_XXXXX)
   ├─ Record event_time (now in UTC)
   ├─ Capture source system
   ├─ Extract schema_version from payload
   └─ Add metadata
4. Log ingestion event with correlation ID
5. Pass to validation pipeline
```

**Output:** Event with envelope ready for validation

**Failures:**
- Malformed JSON/structure → Quarantine as unparseable

### 2. Validation Phase

**Input:** Event with envelope

**Process:**

```python
1. Initialize validation result (is_valid = true, errors = [])

2. Run Completeness Check (DQ-001, DQ-002)
   ├─ For each required field:
   │  ├─ Is field present?
   │  │  ├─ NO → Add error "REQUIRED_FIELD_MISSING"
   │  │  └─ YES → Continue
   │  └─ Is field NULL?
   │     ├─ YES → Add error "NULL_REQUIRED_FIELD"
   │     └─ NO → Continue

3. Run Type Validation (DQ-003)
   ├─ For each field:
   │  ├─ Does type match schema?
   │  │  ├─ NO → Add error "INVALID_TYPE"
   │  │  └─ YES → Continue

4. Run Range Validation (DQ-004)
   ├─ quantity > 0?
   │  ├─ NO → Add error "INVALID_RANGE"
   │  └─ YES → Continue
   ├─ unit_price >= 0?
   │  ├─ NO → Add error "INVALID_RANGE"
   │  └─ YES → Continue

5. Run Enum Validation (DQ-005)
   ├─ status in [pending, completed, failed, refunded]?
   │  ├─ NO → Add error "INVALID_ENUM"
   │  └─ YES → Continue
   ├─ currency in [INR, USD, EUR, ...]?
   │  ├─ NO → Add error "INVALID_ENUM"
   │  └─ YES → Continue

6. Run Schema Compatibility (DQ-007, DQ-008)
   ├─ Is schema_version supported?
   │  ├─ NO → Add error "UNKNOWN_SCHEMA_VERSION"
   │  └─ YES → Continue
   ├─ Does event structure match schema?
   │  ├─ NO → Add error "SCHEMA_MISMATCH"
   │  └─ YES → Continue

7. Run Uniqueness Check (DQ-006)
   ├─ Is event_id seen in last 24 hours?
   │  ├─ YES → Add error "DUPLICATE_EVENT"
   │  └─ NO → Continue

8. Set validation result
   ├─ If any errors → is_valid = false
   └─ If no errors → is_valid = true

9. Log validation results with rule IDs
10. Pass to routing decision
```

**Output:** ValidationResult with is_valid flag

**Outcomes:**
- ✅ All checks pass → Route to Clean Storage
- ❌ One or more failures → Route to Quarantine

### 3. Routing Phase

**Input:** Event + ValidationResult

**Process:**

```python
1. Check is_valid flag
   │
   ├─ YES (Valid Event)
   │  └─ Route to Clean Storage
   │
   └─ NO (Invalid Event)
      ├─ Create Quarantine Record with:
      │  ├─ Original event payload
      │  ├─ Failed rule IDs
      │  ├─ Error messages
      │  └─ Failure category
      └─ Route to Quarantine Storage
```

**Output:** Routing decision made

### 4. Storage Phase

#### Clean Storage (Valid Events)

**Process:**

```python
1. Extract transaction data
2. Check for duplicates in clean storage
3. Write to DuckDB table
   ├─ Transaction ID indexed
   ├─ Event ID indexed
   ├─ Partitioned by event_date
   └─ Stored in Parquet format
4. Record success metric
5. Log storage event
```

**Idempotency:** Event ID deduplication prevents double-writes

#### Quarantine Storage (Invalid Events)

**Process:**

```python
1. Create quarantine record with full context
2. Determine if recoverable
   ├─ Type errors → Not easily recoverable
   ├─ Missing fields → Might be recoverable
   └─ Value errors → Might be recoverable
3. Write to DuckDB quarantine table
   ├─ Event ID indexed
   ├─ Failure timestamp indexed
   ├─ Partitioned by failure_date
   └─ Original payload stored as JSON
4. Record failure metric
5. Log quarantine event
```

**Investigation:** Full context preserved for debugging

### 5. Observability Phase

**Input:** Each event (success or failure)

**Process:**

```python
1. Update counters
   ├─ total_events_processed++
   ├─ valid_events++ (if valid)
   ├─ invalid_events++ (if invalid)
   └─ events_by_source[source]++

2. Update timing metrics
   ├─ Record processing latency
   ├─ Record storage latency
   └─ Track percentiles (p50, p95, p99)

3. Update failure metrics
   ├─ Count by failure_category
   ├─ Count by rule_id
   └─ Track failure rate

4. Calculate quality score
   ├─ quality_score = (valid / total) × 100
   └─ Update trend history

5. Check alert thresholds
   ├─ Is error_rate > threshold?
   │  ├─ YES → Trigger alert
   │  └─ NO → Continue
   └─ Is quality_score < threshold?
      ├─ YES → Trigger alert
      └─ NO → Continue

6. Emit metrics event
7. Make available to dashboard
```

**Output:** Updated metrics and alerts

### 6. Dashboard Phase

**Input:** Metrics, events, quarantine records

**Process:**

```
Dashboard polls/streams:
  ├─ Current metrics (every 5s)
  ├─ Historical trends (every minute)
  ├─ Quarantine records (on demand)
  └─ Alert status (real-time)

Display:
  ├─ Overview page
  │  ├─ Pipeline status (healthy/warning/critical)
  │  ├─ Key metrics (events/sec, quality score)
  │  ├─ Recent alerts
  │  └─ Quality trend chart
  │
  ├─ Quality Analytics
  │  ├─ Quality score by source
  │  ├─ Failure rate trend
  │  ├─ Rules breakdown
  │  └─ Invalid event timeline
  │
  ├─ Pipeline Performance
  │  ├─ Throughput (events/sec)
  │  ├─ Latency (p50, p95, p99)
  │  ├─ Processing time breakdown
  │  └─ Scaling metrics
  │
  └─ Quarantine Explorer
     ├─ Failed events table
     ├─ Search/filter by rule
     ├─ Drill-down investigation
     └─ Recovery workflow
```

## Example: Complete Flow

### Valid Transaction Scenario

```
1. Event arrives from checkout-service
   {
     "transaction_id": "txn_123",
     "customer_id": "cus_456",
     "quantity": 2,
     "unit_price": 500.00,
     "currency": "INR",
     "status": "completed",
     ...
   }

2. Ingestion: Add envelope
   {
     "event_id": "evt_20260816001",
     "event_time": "2026-08-16T14:30:21Z",
     "source": "checkout-service",
     "schema_version": "1.0",
     ... original event ...
   }

3. Validation: All checks pass
   ✅ DQ-001: All required fields present
   ✅ DQ-002: No NULL required fields
   ✅ DQ-003: All types correct
   ✅ DQ-004: quantity=2 > 0, price=500 >= 0
   ✅ DQ-005: status="completed" valid, currency="INR" valid
   ✅ DQ-006: event_id not seen before
   ✅ DQ-007: Schema matches v1.0
   Result: is_valid = true

4. Routing: Route to clean storage
   Destination: clean_data table

5. Storage: Write to DuckDB
   clean_data.insert(event)
   Metric: valid_events++

6. Observability: Update metrics
   - total_events = 1001
   - valid_events = 1000
   - invalid_events = 1
   - quality_score = 99.9%
   - latency_ms = 12.5

7. Dashboard: Display update
   Shows: ✅ 1 new valid event
          Quality: 99.9%
          Status: Healthy
```

### Invalid Transaction Scenario

```
1. Event arrives (NULL customer_id)
   {
     "transaction_id": "txn_124",
     "customer_id": null,  // ❌
     "quantity": 2,
     "unit_price": 500.00,
     ...
   }

2. Ingestion: Add envelope
   event_id = "evt_20260816002"
   source = "checkout-service"

3. Validation: Checks run
   ✅ DQ-001: All fields present (NULL counts as present)
   ❌ DQ-002: customer_id is NULL
   Result: is_valid = false
   failed_rules = ["DQ-002"]

4. Routing: Route to quarantine
   Destination: quarantine table

5. Storage: Write quarantine record
   {
     "event_id": "evt_20260816002",
     "failure_category": "COMPLETENESS",
     "failed_rules": ["DQ-002"],
     "error_messages": ["Required field 'customer_id' is NULL"],
     "original_payload": { ... },
     "recoverable": true
   }
   Metric: invalid_events++

6. Observability: Update metrics
   - total_events = 1002
   - valid_events = 1000
   - invalid_events = 2
   - quality_score = 99.8%
   - failures_by_rule["DQ-002"] = 1

7. Dashboard: Display update
   Shows: ⚠️  1 new invalid event (DQ-002)
          Quality: 99.8% (⬇️ from 99.9%)
          Status: Warning (quality < 99.9%)
          Latest failure: evt_20260816002
```

## Error Recovery

### Recoverable Failures

Some failures can be fixed and events replayed:

- Missing fields (might be added in source)
- Type mismatches (might be corrected)
- Value errors (might be corrected)

### Replay Procedure

```python
1. Identify quarantine record to fix
2. Correct the original_payload manually or programmatically
3. Emit corrected event back to pipeline
4. Re-validate with same rules
5. Track replay lineage
6. Remove from quarantine if now valid
```

### Unrecoverable Failures

Some failures are definitive:

- Unknown schema version
- Fundamental structure mismatch
- Data that violates strict business rules

These remain in quarantine for investigation and analysis.

## Performance Considerations

### Throughput

- **Target:** 10,000+ events/second locally
- **Scaling:** Parallel processing with multiple workers
- **Batching:** Process events in batches for efficiency

### Latency

- **Validation:** <1ms per event
- **Storage:** <5ms per event
- **E2E:** <10ms p95 latency

### Memory

- Deduplication window (24h) in memory
- Event buffering
- Metrics aggregation

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Throughput Metrics**
   - Events/second
   - Total events processed

2. **Quality Metrics**
   - Quality score
   - Failure rate by rule
   - Failure rate by source

3. **Performance Metrics**
   - Processing latency
   - Storage latency
   - End-to-end latency

4. **Operational Metrics**
   - Quarantine size
   - Error rate
   - Alert frequency

### Alert Rules

- Quality score < 95%
- Error rate > 5%
- Processing latency p95 > 50ms
- Duplicate rate > 1%

---

See [architecture.md](architecture.md) for component details and [data-contract.md](data-contract.md) for validation rules.

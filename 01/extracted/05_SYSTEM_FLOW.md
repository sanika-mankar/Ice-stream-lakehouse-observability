# Ice Stream — System Flow and Debugging Guide

## End-to-End Flow

```text
1. Event Source
      |
      v
2. Producer
      |
      v
3. Streaming Transport
      |
      v
4. Consumer
      |
      v
5. Parse Event Envelope
      |
      v
6. Validate Schema
      |
      +---- invalid ----> Quarantine
      |
      v
7. Run Data Quality Rules
      |
      +---- invalid ----> Quarantine
      |
      v
8. Persist Clean Record
      |
      v
9. Update Metrics
      |
      v
10. Dashboard
```

## What Happens When a Bad Record Arrives?

Example:

```json
{
  "event_id": "evt_123",
  "transaction_id": "txn_001",
  "customer_id": null,
  "quantity": -2
}
```

The validator can produce:

```text
DQ-002 NULL_REQUIRED_FIELD
DQ-004 INVALID_RANGE
```

The event is not silently removed.

It is written to quarantine with:
- original payload;
- event ID;
- detection time;
- source;
- schema version;
- failure category;
- failed rule IDs.

## Observability Metrics

Minimum metrics:

- total events;
- successful events;
- failed events;
- quarantine rate;
- validation latency;
- end-to-end latency;
- events per second;
- errors by category;
- errors by source;
- errors by schema version;
- pipeline health.

## Pipeline Health

Example calculation:

```text
HEALTHY
- error rate below warning threshold
- no infrastructure failure
- consumer is active

DEGRADED
- quality failures exceed warning threshold
- pipeline is still processing

CRITICAL
- consumer stopped
- storage unavailable
- error rate exceeds critical threshold
```

## Debugging Order

When something fails:

1. Check application logs.
2. Check event ID/correlation ID.
3. Check schema version.
4. Check validation result.
5. Check quarantine record.
6. Check storage.
7. Check pipeline metrics.
8. Run the smallest failing test.
9. Reproduce using replay support.
10. Fix the root cause before changing unrelated code.

## Data Flow Principle

Raw input should remain traceable.

Never overwrite the original invalid event with a cleaned version without recording what changed.

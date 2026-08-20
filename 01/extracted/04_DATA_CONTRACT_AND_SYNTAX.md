# Ice Stream — Data Contract and Coding Syntax

## 1. Canonical Transaction

A transaction should contain fields similar to:

```json
{
  "event_id": "evt_01JABC123",
  "event_time": "2026-08-16T17:30:21Z",
  "transaction_id": "txn_92831",
  "customer_id": "cus_12093",
  "product_id": "prod_882",
  "quantity": 2,
  "unit_price": 799.50,
  "currency": "INR",
  "payment_method": "UPI",
  "status": "completed",
  "source": "checkout-service",
  "schema_version": "1.0"
}
```

## 2. Data Quality Rules

### Completeness
Required:
- event_id
- event_time
- transaction_id
- customer_id
- product_id
- quantity
- unit_price
- currency
- status

### Validity
Examples:
- quantity > 0
- unit_price >= 0
- currency must be supported
- status must belong to an allowed enum
- event_time must be parseable

### Uniqueness
`event_id` should be unique.

### Consistency
Business rules must agree across related fields.

### Schema Compatibility
The validator must distinguish:
- missing required field;
- unexpected field;
- incompatible type;
- unsupported schema version.

## 3. Validation Result

```python
class ValidationResult:
    is_valid: bool
    errors: list[str]
    warnings: list[str]
    rule_ids: list[str]
```

## 4. Quarantine Record

```python
class QuarantineRecord:
    event_id: str
    received_at: datetime
    original_payload: dict
    failure_category: str
    failed_rules: list[str]
    schema_version: str | None
    source: str | None
```

Never silently discard a failed event.

## 5. Rule IDs

Use stable IDs:

```text
DQ-001 REQUIRED_FIELD_MISSING
DQ-002 NULL_REQUIRED_FIELD
DQ-003 INVALID_TYPE
DQ-004 INVALID_RANGE
DQ-005 INVALID_ENUM
DQ-006 DUPLICATE_EVENT
DQ-007 SCHEMA_MISMATCH
DQ-008 UNKNOWN_SCHEMA_VERSION
```

Stable rule IDs make dashboards, logs, tests, and future alerting easier.

## 6. Python Style

Use:
- Python 3.11+
- type hints;
- small functions;
- descriptive names;
- docstrings for public classes/functions;
- no secrets in source code;
- no print statements for production logs;
- exceptions with useful context.

Example:

```python
def validate_transaction(
    transaction: Transaction,
) -> ValidationResult:
    ...
```

## 7. Error Handling

Bad input should become a controlled validation failure.

Infrastructure failures should raise a clear exception and be handled by the pipeline recovery layer.

Do not use:

```python
try:
    ...
except Exception:
    pass
```

Prefer:

```python
try:
    ...
except StorageError as exc:
    logger.exception(
        "clean_write_failed",
        event_id=event.event_id,
        error=str(exc),
    )
    raise
```

## 8. Configuration

Use environment variables for environment-specific values:

```text
APP_ENV=development
LOG_LEVEL=INFO
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC=transactions
DUCKDB_PATH=data/ice_stream.duckdb
```

Never commit real credentials.

## 9. Testing Syntax

Tests should describe behavior:

```python
def test_missing_customer_id_is_quarantined():
    ...
```

Test:
- valid transaction;
- NULL required field;
- missing column;
- wrong type;
- invalid amount;
- duplicate event;
- unknown schema;
- retry/replay behavior;
- clean persistence;
- quarantine persistence.

## 10. Naming

Python:
- files/functions/variables: `snake_case`
- classes: `PascalCase`
- constants: `UPPER_SNAKE_CASE`

Git branches:
`feature/<name>`
`fix/<name>`
`chore/<name>`

Commits:
`feat: ...`
`fix: ...`
`test: ...`
`docs: ...`
`chore: ...`
`refactor: ...`
`release: ...`

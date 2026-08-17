# Ice Stream — Data Contract Specification

## Overview

The data contract defines the canonical format for all transactions flowing through Ice Stream. It serves as:

1. **Schema Contract**: Explicit definition of fields and types
2. **Quality Rules**: Business constraints and validations
3. **Version Control**: Support for schema evolution
4. **Documentation**: Clear field semantics and constraints

## Canonical Transaction Model

A transaction represents a completed or in-progress e-commerce purchase event.

### Schema v1.0

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

## Field Definitions

### Core Event Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_id` | String | ✅ | Unique event identifier (format: evt_XXXXXXXXXX) |
| `event_time` | ISO 8601 DateTime | ✅ | When the transaction occurred (UTC) |
| `source` | String | ✅ | Origin system (checkout-service, api, etc.) |
| `schema_version` | String | ✅ | Version of this schema (e.g., "1.0") |

### Transaction Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transaction_id` | String | ✅ | Unique transaction identifier (format: txn_XXXXXXX) |
| `customer_id` | String | ✅ | Customer identifier (format: cus_XXXXX) |
| `product_id` | String | ✅ | Product identifier (format: prod_XXXX) |
| `quantity` | Integer | ✅ | Number of units purchased (≥ 1) |
| `unit_price` | Decimal | ✅ | Price per unit (≥ 0.00) |
| `currency` | String | ✅ | ISO 4217 currency code (e.g., INR, USD) |

### Transaction State

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | String | ✅ | Transaction status (enum: pending, completed, failed, refunded) |
| `payment_method` | String | ✅ | Payment method (e.g., UPI, Card, NetBanking, Wallet) |

## Data Quality Rules

### Completeness Rules

**DQ-001: REQUIRED_FIELD_MISSING**
- Rule: All required fields must be present in the event
- Impact: Transaction is invalid
- Action: Route to quarantine
- Example: Missing `customer_id`

**DQ-002: NULL_REQUIRED_FIELD**
- Rule: No required field can have a NULL value
- Impact: Transaction is invalid
- Action: Route to quarantine
- Example: `quantity` is NULL

### Type Validation

**DQ-003: INVALID_TYPE**
- Rule: Fields must match their specified type
- Impact: Transaction is invalid
- Action: Route to quarantine
- Example: `quantity` is "not-a-number"

### Value Range Validation

**DQ-004: INVALID_RANGE**
- Rule: Numeric values must be within acceptable ranges
- Constraints:
  - `quantity` > 0
  - `unit_price` ≥ 0
  - `transaction_id` must be non-empty
- Impact: Transaction is invalid
- Action: Route to quarantine
- Example: `quantity` = 0

### Enum Validation

**DQ-005: INVALID_ENUM**
- Rule: Status and currency must be valid enumeration values
- Allowed Status Values: `pending`, `completed`, `failed`, `refunded`
- Allowed Currencies: `INR`, `USD`, `EUR`, `GBP`, `AUD`, `CAD`, `JPY`, `CNY`
- Allowed Payment Methods: `UPI`, `Card`, `NetBanking`, `Wallet`, `PayPal`, `ApplePay`
- Impact: Transaction is invalid
- Action: Route to quarantine
- Example: `status` = "unknown"

### Uniqueness Rules

**DQ-006: DUPLICATE_EVENT**
- Rule: Event IDs must be unique within a time window (configurable, default 24 hours)
- Impact: Duplicate is invalid
- Action: Route to quarantine or ignore (configurable)
- Example: Receiving the same `event_id` twice within 24 hours

### Schema Compatibility

**DQ-007: SCHEMA_MISMATCH**
- Rule: Event structure must match expected schema for its version
- Constraints:
  - No unknown fields (strict mode) or ignore (permissive mode)
  - Required fields present
- Impact: Transaction is invalid
- Action: Route to quarantine
- Example: Extra fields not in schema

**DQ-008: UNKNOWN_SCHEMA_VERSION**
- Rule: Specified schema version must be supported
- Supported Versions: 1.0
- Impact: Transaction cannot be validated
- Action: Route to quarantine with version error
- Example: `schema_version` = "99.0"

## Timestamp Validation

**DQ-009: INVALID_TIMESTAMP**
- Rule: `event_time` must be:
  - Valid ISO 8601 format
  - Within reasonable time bounds (not in future, not too old)
  - Not before system startup
- Impact: Transaction is invalid
- Action: Route to quarantine

## Business Logic Rules

### Amount Calculations

For any multi-line transaction (future versions):

```
total_amount = quantity × unit_price
```

### Currency Consistency

All monetary fields within an event must use the same currency.

### Status Transitions

Valid status transitions (for future state tracking):

```
pending
  ├─→ completed
  ├─→ failed
  └─→ refunded

completed
  └─→ refunded

failed
  └─ (terminal state)

refunded
  └─ (terminal state)
```

## Validation Result Model

When a transaction is validated, the result contains:

```python
class ValidationResult:
    is_valid: bool                      # Overall validation status
    errors: list[str]                   # Error messages for failures
    warnings: list[str]                 # Non-blocking warnings
    rule_ids: list[str]                 # Which rules triggered
    failed_rules: list[str]             # Specific failed rule IDs
    rule_details: dict[str, str]        # Detailed error per rule
```

### Example Valid Result

```json
{
  "is_valid": true,
  "errors": [],
  "warnings": [],
  "rule_ids": ["DQ-001", "DQ-002", "DQ-003", "DQ-004", "DQ-005", "DQ-006"],
  "failed_rules": [],
  "rule_details": {}
}
```

### Example Invalid Result

```json
{
  "is_valid": false,
  "errors": [
    "Required field 'customer_id' is missing",
    "Field 'quantity' cannot be NULL",
    "Field 'unit_price' value -10.50 is invalid (must be >= 0)"
  ],
  "warnings": [
    "Field 'event_time' is 30 days old"
  ],
  "rule_ids": ["DQ-001", "DQ-002", "DQ-004"],
  "failed_rules": ["DQ-001", "DQ-002", "DQ-004"],
  "rule_details": {
    "DQ-001": "Required field 'customer_id' is missing",
    "DQ-002": "Field 'quantity' has NULL value",
    "DQ-004": "Field 'unit_price' value -10.50 is below minimum 0"
  }
}
```

## Quarantine Record Model

When an event is quarantined, it's stored with:

```python
class QuarantineRecord:
    event_id: str                       # Original event ID
    received_at: datetime              # When event was received
    original_payload: dict             # Full original event
    failure_category: str              # Category of failure
    failed_rules: list[str]            # Rule IDs that failed
    error_messages: list[str]          # Human-readable errors
    schema_version: str | None         # Schema version if known
    source: str | None                 # Event source if known
    quarantine_reason: str             # Detailed reason
    recoverable: bool                  # Can this be fixed and replayed?
```

### Example Quarantine Record

```json
{
  "event_id": "evt_01JABC999",
  "received_at": "2026-08-16T17:30:21Z",
  "original_payload": {
    "event_id": "evt_01JABC999",
    "customer_id": null,
    "product_id": "prod_123",
    "quantity": -5,
    "unit_price": 799.50,
    "currency": "INR",
    "status": "completed",
    "source": "checkout-service",
    "schema_version": "1.0"
  },
  "failure_category": "BUSINESS_RULE_VIOLATION",
  "failed_rules": ["DQ-002", "DQ-004"],
  "error_messages": [
    "Required field 'customer_id' is NULL",
    "Field 'quantity' must be > 0, got -5"
  ],
  "schema_version": "1.0",
  "source": "checkout-service",
  "quarantine_reason": "2 validation rules failed",
  "recoverable": true
}
```

## Example Transactions

### Valid Transaction (Completed Purchase)

```json
{
  "event_id": "evt_20260816001",
  "event_time": "2026-08-16T14:30:21Z",
  "transaction_id": "txn_100001",
  "customer_id": "cus_5001",
  "product_id": "prod_laptop_001",
  "quantity": 1,
  "unit_price": 89999.00,
  "currency": "INR",
  "payment_method": "Card",
  "status": "completed",
  "source": "checkout-service",
  "schema_version": "1.0"
}
```

### Valid Transaction (Multiple Items)

```json
{
  "event_id": "evt_20260816002",
  "event_time": "2026-08-16T15:45:30Z",
  "transaction_id": "txn_100002",
  "customer_id": "cus_5002",
  "product_id": "prod_mouse_001",
  "quantity": 5,
  "unit_price": 1299.50,
  "currency": "INR",
  "payment_method": "UPI",
  "status": "completed",
  "source": "api",
  "schema_version": "1.0"
}
```

### Invalid Transaction (Negative Price)

```json
{
  "event_id": "evt_20260816003",
  "event_time": "2026-08-16T16:00:00Z",
  "transaction_id": "txn_100003",
  "customer_id": "cus_5003",
  "product_id": "prod_keyboard_001",
  "quantity": 2,
  "unit_price": -500.00,  // ❌ INVALID: negative price
  "currency": "INR",
  "payment_method": "Card",
  "status": "pending",
  "source": "checkout-service",
  "schema_version": "1.0"
}
```

## Schema Evolution

### Version 1.0 → 1.1 (Planned)

Potential future enhancements:

```json
{
  ...
  "metadata": {
    "device_type": "mobile",
    "ip_address": "1.2.3.4",
    "user_agent": "..."
  },
  "shipping": {
    "method": "express",
    "cost": 299.00
  },
  "tax": 2000.00
}
```

### Backwards Compatibility

- v1.0 is the only currently supported version
- Future versions must be announced in advance
- Old versions continue to be supported during deprecation period
- Migration path documented before deprecation

## Testing and Examples

All validation rules have test cases with:

1. **Valid Examples**: Events that pass all rules
2. **Invalid Examples**: Events that fail each rule
3. **Edge Cases**: Boundary conditions and unusual but valid data
4. **Malformed Data**: Completely invalid structures

See `tests/fixtures/transactions.py` for comprehensive test data.

---

See [architecture.md](architecture.md) for validation engine design and [system-flow.md](system-flow.md) for complete processing flow.

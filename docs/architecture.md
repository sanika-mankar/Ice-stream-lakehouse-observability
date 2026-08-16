# Ice Stream — Architecture and System Design

## Overview

Ice Stream is a layered, modular platform for real-time data quality validation and lakehouse observability. The architecture separates concerns into distinct layers, each responsible for a specific aspect of the pipeline.

## Architecture Layers

### 1. Domain Layer (Core Business Logic)

**Location:** `app/domain/`

The domain layer contains pure business objects and models without framework dependencies.

**Components:**
- **Transaction**: Core transaction entity with all required and optional fields
- **Event**: Event envelope with metadata (ID, timestamp, source, schema version)
- **ValidationResult**: Result of validation with errors, warnings, and rule IDs
- **QuarantineRecord**: Record of invalid events with failure reasons

**Key Principles:**
- No external dependencies (pure Python)
- No side effects (deterministic)
- Easily testable
- Reusable across different interfaces

### 2. Configuration Layer

**Location:** `app/config/`

Manages application settings with type safety and environment variable support.

**Components:**
- **Settings**: Typed configuration class using Pydantic
- Environment variable resolution
- Validation and defaults
- Support for different environments (dev, test, prod)

**Key Principles:**
- Configuration from environment variables
- Type-safe settings
- Validation on load
- Clear separation of concerns

### 3. Ingestion Layer

**Location:** `app/ingestion/`

Handles incoming events from various sources with a pluggable transport adapter pattern.

**Components:**
- **Producer**: Sends events to streaming transport
- **Consumer**: Receives events from streaming transport
- **Streaming Adapter**: Abstract interface for transport (Kafka, file, memory, etc.)
- **Replay**: Deterministic replay of captured events for testing/debugging

**Key Principles:**
- Transport agnostic (Kafka, files, in-memory, etc.)
- Event envelope with metadata
- Idempotent when possible
- Supports deterministic replay

### 4. Validation Layer

**Location:** `app/validation/`

Validates transactions against data contracts and quality rules.

**Components:**
- **Engine**: Orchestrates validation rules
- **Schema Registry**: Manages versioned schemas
- **Required Field Validation**: Checks completeness
- **Type Validation**: Ensures correct data types
- **Business Rules**: Application-specific constraints
- **Schema Evolution**: Detects breaking changes
- **Duplicate Detection**: Identifies duplicate events

**Validation Rules:**

```
DQ-001: REQUIRED_FIELD_MISSING
DQ-002: NULL_REQUIRED_FIELD
DQ-003: INVALID_TYPE
DQ-004: INVALID_RANGE
DQ-005: INVALID_ENUM
DQ-006: DUPLICATE_EVENT
DQ-007: SCHEMA_MISMATCH
DQ-008: UNKNOWN_SCHEMA_VERSION
```

**Key Principles:**
- Multiple independent validators
- Stable rule IDs for tracking
- Comprehensive error messages
- No silent discards

### 5. Pipeline Layer

**Location:** `app/pipeline/`

Orchestrates the overall processing flow.

**Components:**
- **Processor**: Main processing loop
- **Router**: Routes events to clean/quarantine based on validation
- **Recovery**: Handles failures and retries

**Flow:**
```
Ingest Event
    ↓
Validate
    ↓
Route (Valid/Invalid)
    ↓
Store
    ↓
Emit Metrics
```

**Key Principles:**
- Clear, understandable flow
- Failure handling and recovery
- Metrics emission at each step
- Idempotent operations

### 6. Storage Layer

**Location:** `app/storage/`

Persists events to appropriate storage.

**Components:**
- **Clean Storage**: Valid events go here
- **Quarantine Storage**: Invalid events with reasons
- **DuckDB Backend**: Data storage and querying
- **Parquet Output**: Analytics-ready format

**Key Principles:**
- Pluggable backends
- Partitioned for performance
- Immutable audit trail
- Supports various formats

### 7. Observability Layer

**Location:** `app/observability/`

Tracks operational metrics and health.

**Components:**
- **Metrics**: Counter, histogram, gauge metrics
- **Quality Score**: Aggregate data quality metric
- **Health Monitor**: Pipeline health status
- **Alerts**: Threshold-based alerting

**Key Metrics:**
- Total events processed
- Valid/invalid event counts
- Processing latency
- Quality score (0-100)
- Failure rates by category

**Key Principles:**
- Real-time metrics
- Comprehensive coverage
- Alertable thresholds
- Business and operational metrics

### 8. Logging Layer

**Location:** `app/logging/`

Structured logging with correlation IDs.

**Components:**
- **Setup**: Logger configuration
- **Correlation ID**: Trace requests through system
- **Structured Format**: JSON logs for parsing

**Key Principles:**
- Structured, machine-parseable logs
- Correlation across services
- Appropriate log levels
- Performance aware

### 9. Dashboard/Presentation Layer

**Location:** `dashboard/`

User interface for monitoring and investigation.

**Technologies:**
- Streamlit for rapid development
- Plotly for visualizations
- Altair for interactive charts

**Features:**
- Real-time pipeline overview
- Data quality analytics
- Quarantine explorer
- Trend analysis
- Alert management

**Key Principles:**
- User-focused design
- Real-time updates
- Drill-down investigation
- Clear status indicators

## Data Flow

### Happy Path (Valid Event)

```
Source
  ↓
Ingest (Streaming Adapter)
  ↓ [Event Envelope Added]
Validate (Schema + Rules)
  ↓ [Passed]
Route to Clean Storage
  ↓
Emit Success Metrics
  ↓
Update Dashboard
```

### Quarantine Path (Invalid Event)

```
Source
  ↓
Ingest (Streaming Adapter)
  ↓ [Event Envelope Added]
Validate (Schema + Rules)
  ↓ [Failed: DQ-002, DQ-004]
Create Quarantine Record
  ↓
Route to Quarantine Storage
  ↓
Emit Failure Metrics
  ↓
Update Dashboard
  ↓
(Optionally Alert)
```

## Design Patterns

### 1. Adapter Pattern
The streaming layer uses adapters to support multiple transports without coupling the pipeline.

### 2. Factory Pattern
Configuration creates appropriate storage and validation implementations.

### 3. Repository Pattern
Storage layer abstracts data persistence behind a consistent interface.

### 4. Observer Pattern
Observability layer observes pipeline events without coupling to business logic.

### 5. Strategy Pattern
Validation rules are interchangeable strategies applied by the engine.

## Deployment Considerations

### Local Development

```
Single Process
    ↓
SQLite/DuckDB for storage
    ↓
Streamlit dashboard
    ↓
Console logging
```

### Production

```
Kubernetes Pods
    ↓
Distributed storage (Data Lake)
    ↓
Managed streaming (Kafka)
    ↓
Observability stack (Prometheus, Grafana)
```

The foundation layer (Phase 0) doesn't include production deployment but is designed to make it straightforward.

## Scalability

### Throughput
- Batch processing support
- Parallel validation
- Partitioned storage

### Storage
- Automatic partitioning
- Compression support
- TTL-based cleanup

### Observability
- Streaming metrics
- Aggregated queries
- Time-series storage

## Extensibility

New capabilities can be added by:

1. **New Validators**: Add to `app/validation/`
2. **New Transports**: Implement adapter in `app/ingestion/`
3. **New Storage Backends**: Implement in `app/storage/`
4. **New Observability Metrics**: Add to `app/observability/`
5. **Dashboard Pages**: Add to `dashboard/pages/`

Each layer is independent and can evolve without affecting others.

## Security Considerations

### Data Protection
- No sensitive data in logs
- Encrypted at rest (future)
- Encrypted in transit (future)

### Secrets Management
- Environment variables only
- Never in code or configuration files
- .env in .gitignore

### Audit
- Immutable quarantine records
- Timestamped events
- Correlation IDs for tracing

## Performance

### Current (Single Process)
- Can handle 10,000+ events/second locally
- Sub-second latency for validation
- DuckDB for in-process analytics

### Future (Distributed)
- Kafka for high-throughput streaming
- Apache Spark for scaling
- Distributed data lake (S3, ADLS)

---

See [system-flow.md](system-flow.md) for detailed processing flows and [roadmap.md](roadmap.md) for future architecture enhancements.

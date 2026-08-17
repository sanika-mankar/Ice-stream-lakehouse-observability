# Ice Stream — Real-Time Lakehouse Observability

A production-oriented, open-source real-time data quality and lakehouse observability platform for e-commerce transaction pipelines.

Ice Stream continuously ingests transaction events, validates them against explicit data contracts, routes valid records to clean storage, quarantines invalid records with structured failure reasons, and exposes operational metrics through an observability dashboard.

## The Problem

Modern data platforms continuously ingest events from applications, payments, orders, logistics systems, and third-party sources. Production pipelines fail silently because:

- Required fields are NULL or missing
- Columns disappear or are unexpectedly added
- Data types change in incompatible ways
- Values violate business constraints
- Duplicate events arrive
- Malformed records enter the stream
- Upstream systems send an incompatible schema

Ice Stream treats data quality as an operational concern rather than only a preprocessing step.

## The Solution

```
E-Commerce Transaction Sources
            ↓
    Streaming Ingestion (Kafka)
            ↓
    Data Contract + Schema Registry
            ↓
    Validation Engine (Schema + Quality)
            ↓
        ├─→ VALID → Clean Data Layer
        │
        └─→ INVALID → Quarantine Layer
            ↓
        Observability Engine
            ↓
        Dashboard (Streamlit)
```

Ice Stream handles:

1. **Ingestion**: Streams realistic e-commerce transaction events from configurable sources
2. **Schema Validation**: Validates against explicit, versioned data contracts
3. **Data Quality**: Runs business-rule checks (amounts, currencies, timestamps, IDs)
4. **Routing**: Routes valid events to clean storage, invalid events to quarantine
5. **Observability**: Tracks pipeline health, data quality scores, and failure patterns
6. **Dashboard**: Displays real-time metrics and allows investigation of quarantined records

## Key Features

### Implemented (MVP Foundation)
- Core transaction domain models
- Typed application configuration
- Environment variable support
- Structured logging
- Project documentation and architecture
- Development standards (type hints, linting, formatting)

### Planned (Phase 1-2)
- Realistic transaction generator with failure scenarios
- Event envelope with metadata and schema versioning
- Streaming transport abstraction
- Kafka integration with environment-based configuration
- Deterministic event replay support
- Versioned transaction data contracts
- Required field validation
- Type validation
- Business rule validation (amounts, currencies, statuses)
- Schema evolution detection
- Duplicate event detection
- Complete test coverage

### Future (Phase 3+)
- DuckDB/Parquet storage backends
- Advanced data quality scoring
- Operational alerts and SLOs
- Dashboard quality analytics
- Kubernetes deployment
- Production cloud infrastructure
- Advanced monitoring and debugging tools

## Architecture

Ice Stream follows a layered, modular architecture:

```
┌─────────────────────────────────────────┐
│           Dashboard (Streamlit)          │
├─────────────────────────────────────────┤
│         Observability Engine              │
│    (Metrics, Health, Quality Score)      │
├─────────────────────────────────────────┤
│         Pipeline Orchestration             │
│    (Router, Processor, Recovery)         │
├─────────────────────────────────────────┤
│  Clean Data    │    Validation    │ Quarantine  │
│  Storage       │     Engine       │   Storage   │
├─────────────────────────────────────────┤
│      Ingestion / Streaming Adapter       │
├─────────────────────────────────────────┤
│         Core Domain Models                │
│    (Transaction, Events, Validation)     │
└─────────────────────────────────────────┘
```

## Repository Structure

```
ice-stream/
├── app/                      # Core application
│   ├── config/              # Configuration management
│   ├── domain/              # Business domain models
│   ├── ingestion/           # Event ingestion and streaming
│   ├── validation/          # Data quality validation
│   ├── pipeline/            # Orchestration logic
│   ├── storage/             # Data persistence
│   ├── observability/       # Metrics and health
│   └── logging/             # Structured logging
├── dashboard/               # Streamlit dashboard
├── data/                    # Local data storage
│   ├── raw/
│   ├── clean/
│   ├── quarantine/
│   └── samples/
├── schemas/                 # Versioned data contracts
├── config/                  # Configuration files
├── tests/                   # Test suite
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── scripts/                 # Utility scripts
├── docs/                    # Project documentation
│   ├── architecture.md
│   ├── roadmap.md
│   ├── data-contract.md
│   └── system-flow.md
├── .github/workflows/       # CI/CD pipelines
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── pyproject.toml           # Python project config
├── Makefile                 # Development commands
├── CONTRIBUTING.md          # Contribution guide
├── LICENSE                  # Project license
└── README.md                # This file
```

## Quick Start

### Prerequisites

- Python 3.11 or higher
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/sanika-mankar/Ice-stream-lakehouse-observability.git
cd ice-stream

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Set up environment variables
cp .env.example .env
```

### Development

```bash
# Format code
make format

# Run linting checks
make lint

# Run type checking
make typecheck

# Run tests
make test

# View test coverage
make coverage

# Run all checks
make check
```

### Run the Dashboard

```bash
# After implementing the application core
streamlit run dashboard/app.py
```

## Development Roadmap

The project is built in phases, each consisting of focused milestones:

### Phase 0: Foundation (Current)
- [x] Repository initialization
- [x] Project documentation and architecture
- [ ] Python project standards
- [ ] Core domain models

### Phase 1: Data Ingestion
- Realistic transaction generator
- Event envelope and metadata
- Streaming transport abstraction
- Kafka integration
- Event replay support

### Phase 2: Validation and Quality
- Versioned data contracts
- Required field validation
- Type validation
- Business rule validation
- Schema evolution detection
- Duplicate detection

### Phase 3: Storage and Processing
- DuckDB/Parquet storage
- Clean data persistence
- Quarantine management
- Idempotent processing

### Phase 4: Observability and Dashboard
- Pipeline metrics
- Data quality scoring
- Health monitoring
- Streamlit dashboard integration

See [docs/roadmap.md](docs/roadmap.md) for detailed milestones.

## Data Contract

Ice Stream uses explicit, versioned data contracts. A transaction must contain:

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

Required fields: `event_id`, `event_time`, `transaction_id`, `customer_id`, `product_id`, `quantity`, `unit_price`, `currency`, `status`

Quality rules include:
- `quantity > 0`
- `unit_price >= 0`
- `currency` is supported
- `status` is a valid enum
- `event_time` is parseable
- `event_id` is unique

See [docs/data-contract.md](docs/data-contract.md) for details.

## Testing

Ice Stream prioritizes test coverage and deterministic behavior:

```bash
# Run unit tests
python -m pytest tests/unit -v

# Run integration tests
python -m pytest tests/integration -v

# Run all tests with coverage
python -m pytest --cov=app tests/

# Check test coverage
coverage report
```

## Configuration

Ice Stream uses environment variables for configuration:

```bash
# .env
APP_ENV=development
LOG_LEVEL=INFO
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC=transactions
DUCKDB_PATH=data/ice_stream.duckdb
```

See [.env.example](.env.example) for all available options.

## Documentation

- [Architecture](docs/architecture.md) — System design and component overview
- [Roadmap](docs/roadmap.md) — Development milestones and priorities
- [Data Contract](docs/data-contract.md) — Specification for transactions
- [System Flow](docs/system-flow.md) — End-to-end processing flow
- [GitHub Workflow](docs/github-workflow.md) — Contributor guidelines
- [Working Guide](docs/working-guide.md) — Development best practices

## Contributing

Ice Stream welcomes contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- How to set up your development environment
- Feature branch workflow
- Commit message conventions
- Testing requirements
- Code review process

## Production Principles

Ice Stream is built on these principles:

- **Configuration over Hard-Code**: Environment variables for all settings
- **Schema Contracts over Implicit Assumptions**: Explicit versioned schemas
- **Structured Logs over Print Statements**: Correlation IDs and contexts
- **Deterministic Tests**: Reproducible, seeded test data
- **Idempotent Processing**: Safe event replay and retries
- **Explicit Error Categories**: Categorized failure reasons
- **Reproducible Local Setup**: Works on any developer machine
- **Clear Separation of Concerns**: Ingestion, validation, storage, observability distinct
- **Comprehensive Documentation**: Every important feature is documented

## License

Ice Stream is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Support

For issues, feature requests, or questions:

1. Check existing [GitHub Issues](https://github.com/sanika-mankar/Ice-stream-lakehouse-observability/issues)
2. Review the [documentation](docs/)
3. Create a new issue with detailed information
4. Join the community discussions

## Acknowledgments

Ice Stream is designed to teach practical Data Engineering, Data Quality, Streaming, Lakehouse, and Observability concepts without hiding important engineering decisions behind toy demos.

---

**Status**: Early Development (Phase 0 — Foundation)

**Last Updated**: 2026-08-16

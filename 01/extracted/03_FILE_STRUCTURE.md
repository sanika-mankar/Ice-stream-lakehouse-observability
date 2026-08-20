# Ice Stream — Repository Structure

```text
ice-stream/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py
│   │
│   ├── domain/
│   │   ├── __init__.py
│   │   ├── transaction.py
│   │   ├── events.py
│   │   ├── validation.py
│   │   └── quarantine.py
│   │
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── producer.py
│   │   ├── consumer.py
│   │   └── replay.py
│   │
│   ├── validation/
│   │   ├── __init__.py
│   │   ├── engine.py
│   │   ├── schema.py
│   │   ├── required_fields.py
│   │   ├── types.py
│   │   ├── business_rules.py
│   │   ├── duplicates.py
│   │   └── registry.py
│   │
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── processor.py
│   │   ├── router.py
│   │   └── recovery.py
│   │
│   ├── storage/
│   │   ├── __init__.py
│   │   ├── clean.py
│   │   ├── quarantine.py
│   │   ├── duckdb.py
│   │   └── partitions.py
│   │
│   ├── observability/
│   │   ├── __init__.py
│   │   ├── metrics.py
│   │   ├── quality_score.py
│   │   ├── health.py
│   │   └── alerts.py
│   │
│   └── logging/
│       ├── __init__.py
│       └── setup.py
│
├── dashboard/
│   ├── app.py
│   ├── pages/
│   │   ├── overview.py
│   │   ├── quality.py
│   │   ├── pipeline.py
│   │   └── quarantine.py
│   └── components/
│       ├── charts.py
│       ├── cards.py
│       └── tables.py
│
├── data/
│   ├── raw/
│   ├── clean/
│   ├── quarantine/
│   └── samples/
│
├── schemas/
│   ├── transaction_v1.json
│   ├── transaction_v2.json
│   └── README.md
│
├── config/
│   ├── quality_rules.yaml
│   └── alert_rules.yaml
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── conftest.py
│
├── scripts/
│   ├── generate_events.py
│   ├── replay_events.py
│   └── inspect_data.py
│
├── docs/
│   ├── architecture.md
│   ├── roadmap.md
│   ├── data-contract.md
│   ├── runbook.md
│   └── decisions/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── tests.yml
│
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── Dockerfile
├── docker-compose.yml
├── Makefile
├── pyproject.toml
├── README.md
└── LICENSE
```

## Folder Responsibilities

`domain/` contains business objects only.

`ingestion/` handles incoming events and transport adapters.

`validation/` contains data quality rules.

`pipeline/` orchestrates processing but should not contain dashboard code.

`storage/` handles persistence.

`observability/` calculates operational metrics and health.

`dashboard/` contains presentation only.

`tests/` mirrors important application behavior.

`schemas/` contains versioned data contracts.

`config/` contains non-secret operational rules.

`docs/` contains architecture and operational knowledge.

## Important Rule

Do not put everything into one Python file. If a module becomes difficult to understand or test, split it according to responsibility.

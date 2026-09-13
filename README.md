# Ice Stream — Real-Time Streaming Data Quality & Lakehouse Observability Platform

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/release/python-3119/)
[![Apache Flink](https://img.shields.io/badge/Apache%20Flink-1.18.1-orange.svg)](https://flink.apache.org/)
[![Apache Iceberg](https://img.shields.io/badge/Apache%20Iceberg-1.5.2-blue.svg)](https://iceberg.apache.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Zero Cost](https://img.shields.io/badge/Infrastructure-Zero%20Cost-brightgreen.svg)]()

Ice Stream is an enterprise-ready, zero-cost streaming data-quality and lakehouse observability platform. It provides real-time streaming ingestion, schema validation against 8 canonical data-quality rules, an automatic 2% threshold Circuit Breaker, persistent storage using Apache Iceberg on Backblaze B2 (via S3FileIO and SQLite JdbcCatalog), and full-stack real-time observability powered by a FastAPI backend and an interactive React Flow dashboard.

---

## 1. System Architecture

```
                    ┌─────────────────────────┐
                    │  Python Event Producer  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    Aiven Cloud Kafka    │ (SASL_SSL / topic: default)
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Apache Flink 1.18.1   │ (10s Tumbling Windows)
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    ValidationEngine     │ (Rules DQ-001 through DQ-008)
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     Circuit Breaker     │ (Strict > 2.0% error rate gate)
                    └──────┬────────────┬─────┘
           CLOSED / Valid  │            │  OPEN / Tripped / DLQ
                           ▼            ▼
               ┌────────────────┐  ┌────────────────┐
               │  clean_events  │  │   dlq_events   │
               └───────┬────────┘  └────────┬───────┘
                       │                    │
                       ▼                    ▼
             ┌────────────────────────────────────────┐
             │   Apache Iceberg 1.5.2 Lakehouse       │
             │   - S3FileIO + Backblaze B2            │
             │   - SQLite JdbcCatalog                 │
             └──────────────────┬─────────────────────┘
                                │
                                ▼
             ┌────────────────────────────────────────┐
             │   FastAPI Observability Gateway & WS   │
             │   - REST Endpoints (/api/...)          │
             │   - WebSocket Broadcaster (/ws)        │
             │   - Incident Repository (SQLite)       │
             └──────────────────┬─────────────────────┘
                                │
                                ▼
             ┌────────────────────────────────────────┐
             │      React + Vite Web Dashboard        │
             │   - Interactive React Flow DAG         │
             │   - Real-time Metrics & Incidents      │
             │   - Operator Recovery Controls         │
             └────────────────────────────────────────┘
```

---

## 2. Key Features

- **Real Kafka & Flink Streaming**: Real-time event streaming via Aiven Cloud Kafka and 10-second tumbling window aggregations in Apache Flink 1.18.1.
- **8 Canonical Data Quality Rules (DQ-001 to DQ-008)**:
  - `DQ-001`: `REQUIRED_FIELD_MISSING` (Critical)
  - `DQ-002`: `NULL_REQUIRED_FIELD` (Critical)
  - `DQ-003`: `INVALID_TYPE` (High)
  - `DQ-004`: `INVALID_RANGE` (High)
  - `DQ-005`: `INVALID_ENUM` (Medium)
  - `DQ-006`: `DUPLICATE_EVENT` (Warning)
  - `DQ-007`: `SCHEMA_MISMATCH` (Critical)
  - `DQ-008`: `UNKNOWN_SCHEMA_VERSION` (Critical)
- **Automatic Circuit Breaker**:
  - Monitors streaming window error rate: $\frac{\text{Invalid}}{\text{Total}}$.
  - Trips to `OPEN` immediately when error rate $> 2.0\%$, diverting 100% of traffic to `dlq_events`.
  - Operator-triggered `HALF_OPEN` probe phase via `POST /api/recovery`.
- **Apache Iceberg Lakehouse on Backblaze B2**:
  - Zero-cost S3-compatible cloud object storage using `S3FileIO`.
  - Persistent ACID transactions via SQLite `JdbcCatalog` (`data/iceberg_catalog.db`).
  - Time travel, partition pruning, and schema evolution.
- **Production FastAPI Observability Layer**:
  - REST API with `/api/health`, `/api/metrics`, `/api/pipeline/status`, `/api/incidents`, `/api/recovery`, `/api/lakehouse`, and `/api/system`.
  - Real-time WebSocket feed (`/ws`) with live heartbeat and streaming updates.
- **Interactive React Flow Console**:
  - Live DAG topology rendering streaming node health and throughput.
  - Incident management audit log with acknowledge and resolve workflows.

---

## 3. Quickstart & Setup

### Prerequisites
- Python 3.11+
- Node.js v18+ and npm
- Java 11 (for Apache Flink / PyFlink)

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/sanika-mankar/Ice-stream-lakehouse-observability.git
cd Ice-stream-lakehouse-observability
cp .env.example .env
```
Populate `.env` with your Aiven Kafka and Backblaze B2 credentials (see `.env.example`).

### Step 2: Python Environment Setup
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Step 3: Start FastAPI Backend
```powershell
uvicorn app.api.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at `http://127.0.0.1:8000/docs`.

### Step 4: Start Frontend Dashboard
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/console/overview` to view the command center.

---

## 4. Running Verification & Tests

### Automated Unit & API Tests
Run the complete unit test suite:
```powershell
pytest tests/unit/ -v
```

### Live Circuit Breaker & Kafka Scenarios
Execute the live streaming validation against Aiven Kafka and the persistent catalog:
```powershell
python scripts/test_master_6_circuit_scenarios.py
```

### Frontend Typecheck & Production Build
```powershell
cd frontend
npm run build
```

---

## 5. Documentation
- [Architecture & Design](docs/architecture.md)
- [Operational Runbook](docs/operations.md)
- [Failure Modes & Recovery](docs/failure-recovery.md)
- [Data Contract Specification](docs/data-contract.md)

---

## 6. License
MIT License. Free and open-source zero-cost streaming lakehouse data quality platform.

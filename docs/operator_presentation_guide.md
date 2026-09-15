# Ice Stream — Complete Operator & Presentation Manual

This manual provides an end-to-end guide to launching, testing, and presenting the **Ice Stream** Real-Time Lakehouse Observability and Data Quality Platform.

---

## 1. Quick Start Commands

To run the full stack locally:

### Step 1: Start the Backend (FastAPI)
```powershell
# From repo root
python -m uvicorn app.api.main:app --host 127.0.0.1 --port 8000
```
- **Health Check**: `curl http://127.0.0.1:8000/api/health`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

### Step 2: Start the Frontend (React + Vite)
```powershell
# In a second terminal
cd frontend
npm run dev
```
- **Web Console**: Open `http://localhost:5173` in your browser.

---

## 2. Presentation Walkthrough Script

When presenting Ice Stream to an evaluator, technical lead, or audience, follow this 6-stage presentation order:

### Stage 1: The Landing Page (`http://localhost:5173/`)
* **What to Show**:
  - The hero title: **"ICE STREAM | Real-Time Lakehouse Observability"**.
  - The 5 core value pillars: Real-time Streaming, Self-protecting Circuit Breaker, Apache Iceberg Lakehouse, Traceable Data Lineage, and Live Telemetry.
* **Talking Point**:
  > *"Ice Stream is an enterprise-grade streaming quality platform built on real Kafka, real Apache Flink, and Apache Iceberg on Backblaze B2 object storage. It automatically intercepts corrupt data before it pollutes analytical lakehouse tables."*
* **Action**: Click **"Launch Console"** or **"Open Command Center"**.

---

### Stage 2: Command Center Overview (`/console/overview`)
* **What to Show**:
  - Top 4 KPI metric cards:
    - **Ingestion Rate**: Real-time throughput (events/sec).
    - **Valid Events**: Number of clean records written to Iceberg.
    - **DQ Error Rate**: Real-time percentage of incoming records violating validation rules.
    - **Circuit State**: Current circuit breaker state (`CLOSED` / `OPEN` / `HALF_OPEN`).
  - Throughput and Error Distribution graphs.
  - Live Activity Stream.
* **Talking Point**:
  > *"This unified Command Center provides streaming platform engineers with instant visibility into ingestion health, processing latency, and real-time error distributions across all topics."*

---

### Stage 3: Pipeline DAG Studio (`/console/pipeline`)
* **What to Show**:
  - Interactive React Flow DAG:
    `Aiven Kafka Ingest` ➔ `PyFlink DQ Engine` ➔ `[Clean Path] Apache Iceberg on B2` & `[Quarantine Path] Dead Letter Queue`.
  - Node Interaction: Click on any node (e.g. `Validation Engine`) to reveal the **Node Inspection Side Panel** containing node status, throughput metrics, and schema definitions.
  - Click **"Architecture Blueprint"** toggle button to switch to the detailed architecture blueprint.
* **Talking Point**:
  > *"Every stage of the pipeline is observable. If a node degrades or schema errors spike, operators can inspect individual stages, see buffer utilization, and trace data flow without leaving the console."*

---

### Stage 4: Data Quality Matrix (`/console/quality`)
* **What to Show**:
  - Switch between the 3 tabs:
    1. **Overview**: Quality score breakdown and violation distribution.
    2. **Quality Rules**: The 8 canonical DQ rules:
       - `DQ-001`: `REQUIRED_FIELD_MISSING`
       - `DQ-002`: `NULL_REQUIRED_FIELD`
       - `DQ-003`: `INVALID_TYPE`
       - `DQ-004`: `INVALID_RANGE`
       - `DQ-005`: `INVALID_ENUM`
       - `DQ-006`: `DUPLICATE_EVENT`
       - `DQ-007`: `SCHEMA_MISMATCH`
       - `DQ-008`: `UNKNOWN_SCHEMA_VERSION`
    3. **Violations (DLQ)**: Quarantined records table showing event payload, failure rule, timestamp, and routing source.
* **Talking Point**:
  > *"Unlike generic ETL tools that fail silently, Ice Stream enforces strict, multi-layer validation with canonical rule identifiers. Bad events are enriched with error metadata and diverted to a Dead Letter Queue for reprocessing."*

---

### Stage 5: Reliability & Circuit Breaker (`/console/reliability`)
* **What to Show**:
  - **Circuit Breaker Status**: Highlight the strict **2.0% error rate threshold**.
  - **Incident Management Table**: Display real historical incidents (`inc-...`), timestamps, component sources (`flink-stream-quality-engine`), error spikes, and resolution statuses.
  - **Incident Recovery Control**: Point out the manual/automated recovery trigger (`POST /api/recovery`).
* **Talking Point**:
  > *"When the rolling error rate exceeds 2.0%, the circuit breaker trips from CLOSED to OPEN within 3 consecutive evaluation cycles. This isolates the Lakehouse, diverts traffic to DLQ, creates a traceable incident ID, and protects downstream analytical workloads from data corruption."*

---

### Stage 6: Lakehouse & Time Travel (`/console/lakehouse`)
* **What to Show**:
  - **Clean vs. Quarantine Tables**: Iceberg table partitions, schema version (`v2.1.0`), and health status.
  - **Snapshot Timeline**: Historical snapshot IDs, timestamps, and row delta manifests.
  - **Time Travel Comparison**: Click **"Compare Snapshots"** to view schema evolution and record additions between two snapshots.
  - **Storage Optimization**: Small files count, average file size, and compaction recommendations.
* **Talking Point**:
  > *"Because we use Apache Iceberg on Backblaze B2, operators have full ACID snapshot isolation and time-travel querying. If an incident occurs, analysts can query the exact state of the lakehouse before the incident occurred."*

---

### Stage 7: System Operations (`/console/system`)
* **What to Show**:
  - Real infrastructure service cards:
    - **Aiven Kafka Cluster** (TLS SASL_SSL)
    - **PyFlink Processing Engine** (v1.18.1)
    - **Apache Iceberg Lakehouse** (v1.5.2) + Backblaze B2 S3 FileIO
    - **SQLite Persistent Catalog**
  - Kubernetes cluster node pressures and operational action buttons.
* **Talking Point**:
  > *"All backing services are real, persistent cloud infrastructure with zero simulated or mock data."*

---

### Stage 8: Operational Support & Incident Communication (`/console/contact-us`)
* **What to Show**:
  - Direct operator inquiry portal with real-time feedback and SLA indicators.
  - **Dual-Lead Routing**: Inquiries are routed concurrently via Gmail SMTP SSL to:
    - Primary Lead: `Sant7124@gmail.com`
    - Engineering Co-Lead: `sanikamankar74@gmail.com`
  - Fill in a sample operational inquiry, click **"Send Message to Both Emails"**, and showcase the green **"Dispatched Successfully"** live notification.
* **Talking Point**:
  > *"Operational inquiries and platform incident escalations are dispatched simultaneously over authenticated SMTP SSL to both lead engineering inboxes with zero simulated stubs."*

---

## 3. Checklist for Independent Checks (Before Every Demo)

Before presenting, run through this quick 3-minute sanity checklist:

1. [ ] **Backend Up**: Open `http://127.0.0.1:8000/api/health` ➔ returns `"status": "HEALTHY"`, `"circuit_state": "CLOSED"`.
2. [ ] **Frontend Up**: Open `http://localhost:5173` ➔ landing page renders smoothly without console errors.
3. [ ] **Console Navigation**: Click through each sidebar route (`/console/overview`, `/console/pipeline`, `/console/quality`, `/console/contact-us`, `/console/reliability`, `/console/lakehouse`, `/console/system`).
4. [ ] **DAG Interaction**: In `/console/pipeline`, click on a node to ensure the drawer opens; test the "Architecture Blueprint" toggle.
5. [ ] **Contact Us Verification**: In `/console/contact-us`, confirm live recipient routing to `Sant7124@gmail.com` and `sanikamankar74@gmail.com`.
6. [ ] **Time Travel**: In `/console/lakehouse`, click "Compare Snapshots" to demonstrate comparison mode.
7. [ ] **Clean DevTools**: Press `F12` in Chrome/Edge, ensure the Console tab has zero uncaught exceptions.


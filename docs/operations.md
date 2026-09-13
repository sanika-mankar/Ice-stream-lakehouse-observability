# Ice Stream — Operational Runbook & Guide

## 1. Prerequisites & Environment Setup

### Environment Variables
Copy `.env.example` to `.env` and populate credentials:
- **Kafka**: `KAFKA_BOOTSTRAP_SERVERS`, `KAFKA_TOPIC`, `KAFKA_SECURITY_PROTOCOL=SASL_SSL`, `KAFKA_SASL_MECHANISM=SCRAM-SHA-256`, `KAFKA_SASL_USERNAME`, `KAFKA_SASL_PASSWORD`.
- **Backblaze B2**: `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `B2_ENDPOINT_URL`, `B2_BUCKET_NAME`, `ICEBERG_WAREHOUSE`.
- **Iceberg Catalog**: `ICEBERG_CATALOG_TYPE=jdbc`, `ICEBERG_CATALOG_NAME=iceberg_catalog`, `ICEBERG_JDBC_URI=jdbc:sqlite:data/iceberg_catalog.db`.
- **Observability**: `OBSERVABILITY_DB_PATH=data/observability.db`, `CIRCUIT_BREAKER_THRESHOLD=0.02`.

### Python Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 2. Starting Platform Services

### A. FastAPI Observability Backend
To start the production API with hot-reload:
```powershell
uvicorn app.api.main:app --host 127.0.0.1 --port 8000 --reload
```
Verify health:
```powershell
curl http://127.0.0.1:8000/api/health
```

### B. React Frontend Dashboard
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open browser at: `http://localhost:5173/console/overview`

### C. Live Streaming Pipeline & Producer
To generate and stream live transaction batches to Aiven Kafka:
```powershell
python -m app.ingestion.producer --rate 50 --batch 100
```
Or run the Master 6 circuit scenarios test script:
```powershell
python scripts/test_master_6_circuit_scenarios.py
```

---

## 3. Incident Management & Operator Interventions

### Circuit Breaker States & Strict 2% Threshold
The circuit breaker automatically monitors the streaming error rate:
$$\text{Error Rate} = \frac{\text{Invalid Events}}{\text{Total Processed Events}}$$
- If $\text{Error Rate} \le 0.02$ (2%): State remains **CLOSED**.
- If $\text{Error Rate} > 0.02$ (2%): State transitions immediately to **OPEN**.
  - All stream processing diverts 100% of records to `dlq_events`.
  - An incident is automatically created in `data/observability.db`.
  - Alert notifications are pushed to connected WebSocket clients.

### Operator Recovery Procedure
When the root cause of bad data is mitigated:
1. Navigate to **Console $\to$ Reliability** or **Console $\to$ System**.
2. If state is **OPEN**, click **Initiate Recovery (POST /api/recovery)**.
3. The circuit enters **HALF_OPEN** probe mode:
   - Evaluates the next stream window.
   - If clean ($\le 2\%$), automatically transitions to **CLOSED**.
   - If errors persist ($> 2\%$), trips back to **OPEN**.
4. In the Incident table, acknowledge the open incident and mark it **RESOLVED** with a resolution comment.

---

## 4. Maintenance & Backups

### Database Locations
- `data/observability.db`: SQLite database storing incidents, audit trails, and metric snapshots.
- `data/iceberg_catalog.db`: SQLite database storing Iceberg catalog table metadata.

### Performing Backups
```powershell
# Backup database files
Copy-Item data/observability.db data/observability.db.bak
Copy-Item data/iceberg_catalog.db data/iceberg_catalog.db.bak
```

### Verifying Catalog & B2 Lakehouse
To inspect table snapshots:
```powershell
curl http://127.0.0.1:8000/api/lakehouse/snapshots
```

# MASTER 1: BACKEND AUDIT & INTEGRATION CONTRACT

## 1. Frontend Mock Data Locations

An exhaustive audit of the frontend repository reveals the following locations where mock data is currently hardcoded or simulated:

- **`frontend/src/lib/store/useStore.ts`**: The core Zustand store initializes with heavy mock data for the entire pipeline graph (nodes and edges), system status, metrics (throughput, latency, errorRate), and active incidents.
- **`frontend/src/components/quality/QualityOverview.tsx`**: Contains mock trend data for charts representing valid vs invalid events over time.
- **`frontend/src/components/pipeline/`**: Various components here rely on the mocked Zustand store to render the node statuses, circuit breaker states, and DLQ counts.
- **`frontend/src/pages/`**: Page-level components directly consume the simulated metrics for dashboard displays (e.g. `DashboardPage.tsx`, `QualityPage.tsx`).

*Objective:* The final backend architecture will replace these mock instances by having the Zustand store fetch data from the FastAPI endpoints and subscribe to WebSocket channels for real-time updates.

## 2. API & WebSocket Contracts

To enable this transition, we have defined a strict integration contract. 

### REST API Endpoints

The following REST API endpoints have been scaffolded in FastAPI (`app/api/endpoints.py`) to serve the canonical data required by the frontend:

- **`GET /api/health`**: Returns overall backend system health.
- **`GET /api/metrics`**: Returns aggregate system metrics (throughput, latency, error rates).
- **`GET /api/pipeline`**: Returns the directed acyclic graph (nodes and edges) representing the pipeline topology and status.
- **`GET /api/quality`**: Returns data quality metrics and recent validation violations.
- **`GET /api/incidents`**: Returns active and historical incident records.
- **`GET /api/dlq`**: Returns records quarantined in the Dead Letter Queue.
- **`GET /api/snapshots`**: Returns metadata regarding recent Iceberg commits/snapshots.
- **`GET /api/system`**: Returns service-level health and circuit breaker states.

### WebSocket Channels

A WebSocket connection at **`ws://<host>/api/ws`** has been scaffolded (`app/api/websockets.py`). It will broadcast the following event types:

- `PIPELINE_STATUS_CHANGED`
- `QUALITY_ALERT`
- `CIRCUIT_BREAKER_OPENED` / `CIRCUIT_BREAKER_CLOSED`
- `DLQ_RECORD_ADDED`
- `INCIDENT_CREATED` / `INCIDENT_RESOLVED`
- `METRIC_UPDATED`
- `SERVICE_STATUS_CHANGED`

These events will allow the React frontend to update the UI reactively without aggressive polling.

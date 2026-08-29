# MASTER 1: BACKEND AUDIT & INTEGRATION CONTRACT

## 1. Frontend Mock Data Locations

An exhaustive audit of the frontend repository reveals the following locations where mock data is currently hardcoded or simulated:

- **`frontend/src/lib/store/useStore.ts`**: The core Zustand store initializes with heavy mock data for the entire pipeline graph (nodes and edges), system status, metrics (throughput, latency, errorRate), and active incidents.
- **`frontend/src/components/quality/QualityOverview.tsx`**: Contains mock trend data for charts representing valid vs invalid events over time.
- **`frontend/src/components/pipeline/`**: Various components here rely on the mocked Zustand store to render the node statuses, circuit breaker states, and DLQ counts.
- **`frontend/src/pages/`**: Page-level components directly consume the simulated metrics for dashboard displays (e.g. `DashboardPage.tsx`, `QualityPage.tsx`).

*Objective:* The final backend architecture will replace these mock instances by having the Zustand store fetch data from the FastAPI endpoints and subscribe to WebSocket channels for real-time updates.

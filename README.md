# Ice Stream — Real-Time Lakehouse Observability

Ice Stream is an advanced, real-time observability platform designed for modern data engineering stacks. It provides a single pane of glass to monitor event streams, detect data quality violations, manage circuit breakers, and perform Iceberg time travel.

## Architecture

This frontend is designed as a **React 18 + Zustand + Vite** application. It serves as the visual contract for the Ice Stream backend. 

### Frontend Stack
* **Framework**: React 18 (TypeScript)
* **Build Tool**: Vite
* **State Management**: Zustand
* **Styling**: Tailwind CSS v4
* **Icons**: Lucide React
* **Charts**: Recharts
* **Pipeline Visualization**: React Flow (`@xyflow/react`)

### Backend Contract
The application is currently running in a robust "Backend-as-a-Frontend" Mock Mode. State is managed entirely by the `useStore` hook. 
Future integration will swap the Zustand simulation logic with a real `ApiService` and WebSocket connection. 

See `src/lib/api/types.ts` and `src/lib/api/ws-events.ts` for the strict data contracts the backend must fulfill.

## Features

* **Command Center**: Real-time metrics on throughput, latency, Kafka lag, and error rates.
* **Interactive Pipeline**: A live React Flow visualization of the entire architecture (Kafka -> Flink -> Iceberg).
* **Data Quality Engine**: Active tracking of schema violations, with a dedicated Dead Letter Queue (DLQ) inspector.
* **Reliability Controls**: Automated circuit breaker monitoring and incident timeline generation.
* **Lakehouse Time Travel**: Interactive simulation of Iceberg snapshot traversal and schema delta comparisons.

## Setup & Execution

### Prerequisites
* Node.js v18+

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Demo Mode

To properly demonstrate the UI capabilities before backend integration, a **Demo Controller** widget is available in the bottom right corner of the application.

Click the "Play" icon to open the Demo Controller and manually trigger the incident lifecycle:

1. **Healthy Pipeline**: Base operational state.
2. **Degradation**: Injects bad data, causing a spike in schema violations.
3. **Incident**: Breaches the 5% error threshold, forcing the Flink Circuit Breaker OPEN and halting downstream processing.
4. **Recovery**: Automatically resolves the incident and resets the pipeline to a healthy state.

*Note: The Demo Mode is intended for showcase and recruiting purposes and should be removed before production release.*

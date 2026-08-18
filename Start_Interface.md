# Ice Stream — UI Quick Start Guide

Welcome to the Ice Stream project! This guide will help you run the frontend observability interface locally on your machine.

The frontend acts as a "Backend-as-a-Frontend" prototype using Zustand to mock real-time data streaming (Kafka/Flink) and observability metrics.

## Prerequisites

Before starting, ensure you have Node.js installed on your system.
* **Node.js** (v18 or higher recommended) - [Download here](https://nodejs.org/)

## 🚀 How to Start the Frontend

Follow these simple steps to get the UI running:

### 1. Navigate to the frontend directory
Open your terminal or command prompt and change into the `frontend` folder from the root of the repository:
```bash
cd frontend
```

### 2. Install Dependencies
Install all the required React and Tailwind packages:
```bash
npm install
```

### 3. Start the Development Server
Launch the Vite development server:
```bash
npm run dev
```

### 4. View the Application
Once the server starts, it will output a local URL (usually `http://localhost:5173/`).
Open your web browser and navigate to:
**👉 [http://localhost:5173/](http://localhost:5173/)**

---

## 🎮 Using the Interactive Demo Mode

The UI has a built-in simulation engine to demonstrate system behaviors before the real Kafka/Flink backend is connected.

To test this:
1. Look for the **"Play" button** (▶) floating in the bottom right corner of the dashboard.
2. Click it to open the **Demo Controller**.
3. Trigger the different scenarios to see how the UI reacts to real-time events:
   * **Healthy Pipeline:** Standard operating state.
   * **Inject Bad Data:** Simulates a schema violation spike.
   * **Trigger Circuit Breaker:** Forces the system into a critical state, halting processing.
   * **Automated Recovery:** Resets the pipeline back to normal.

# Ice Stream — Dual-Host Deployment Guide

This guide provides step-by-step instructions for deploying the **Frontend** and **Backend** of Ice Stream onto separate websites and servers.

---

## Architecture Overview

```text
┌───────────────────────────────────────┐
│              FRONTEND                 │
│  Hosted on: Vercel / Netlify / Render │
│  Domain: https://ice-stream.vercel.app│
└──────────────────┬────────────────────┘
                   │
         REST API  │  WebSocket
      HTTPS / JSON │  WSS / Frames
                   ▼
┌───────────────────────────────────────┐
│              BACKEND                  │
│ Hosted on: Render / Railway / Fly.io  │
│ Domain: https://api-icestream.com     │
│        (FastAPI + Uvicorn)            │
└──────────────────┬────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
Aiven Kafka   Backblaze B2    DuckDB / SQLite
(SASL_SSL)   (Iceberg S3)   (Observability)
```

---

## 1. Backend Deployment (e.g. Render / Railway / Fly.io)

### Step 1: Push Code to GitHub
Ensure your repository is pushed to GitHub.

### Step 2: Create Web Service on Render / Railway
1. **Service Type**: Web Service / Python
2. **Root Directory**: `.` (Repository root)
3. **Build Command**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Start Command**:
   ```bash
   uvicorn app.api.main:app --host 0.0.0.0 --port $PORT
   ```
   *(Or using the included `Procfile`)*

### Step 3: Configure Environment Variables in Hosting Dashboard
> [!IMPORTANT]
> **Never commit your `.env` file to GitHub.** Add these environment variables directly inside the hosting provider's Dashboard (e.g., Render Environment tab, Railway Variables tab):

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `ALLOWED_ORIGINS` | Comma-separated list of your deployed frontend URLs | `https://ice-stream.vercel.app` |
| `APP_ENV` | Application environment | `production` |
| `KAFKA_BOOTSTRAP_SERVERS` | Aiven Kafka broker URL | `kafka-prod-xyz.aivencloud.com:12345` |
| `KAFKA_SECURITY_PROTOCOL` | Security protocol | `SASL_SSL` |
| `KAFKA_SASL_MECHANISMS` | SASL mechanism | `PLAIN` |
| `KAFKA_SASL_USERNAME` | Kafka SASL username | `avnadmin` |
| `KAFKA_SASL_PASSWORD` | Kafka SASL password | `your_sasl_password` |
| `B2_BUCKET_NAME` | Backblaze B2 bucket name | `ice-stream-lakehouse` |
| `B2_ENDPOINT` | Backblaze S3 endpoint | `https://s3.us-east-005.backblazeb2.com` |
| `B2_ACCESS_KEY_ID` | Backblaze B2 Key ID | `your_key_id` |
| `B2_SECRET_ACCESS_KEY` | Backblaze Application Key | `your_application_key` |
| `EMAIL_USER` | Notification Gmail sender | `Sant7124@gmail.com` |
| `EMAIL_PASSWORD` | 16-character Google App Password | `xxxx xxxx xxxx xxxx` |
| `SANTOSH_EMAIL` | Primary contact recipient | `Sant7124@gmail.com` |
| `COPY_EMAIL` | Secondary contact recipient | `sanikamankar74@gmail.com` |

---

## 2. Frontend Deployment (e.g. Vercel / Netlify / Cloudflare)

### Option A: Vercel (Recommended)
1. In Vercel, click **Add New Project** and import your GitHub repository.
2. In the project setup settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. In **Environment Variables**, add:
   ```env
   VITE_API_URL=https://your-backend-service.onrender.com
   ```
   *(Optional: `VITE_WS_URL=wss://your-backend-service.onrender.com/ws` — if omitted, Ice Stream derives it automatically from `VITE_API_URL`)*.
4. Click **Deploy**.
5. Client-side SPA routing (`/console/pipeline`, `/console/quality`, etc.) is automatically handled by the included [frontend/vercel.json](file:///c:/Users/sant7/OneDrive/Desktop/ice-stream-repo/frontend/vercel.json).

### Option B: Netlify
1. In Netlify, click **Import an existing project** from GitHub.
2. Settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. In **Environment variables**, set `VITE_API_URL=https://your-backend-service.onrender.com`.
4. Client-side routing is automatically handled by [frontend/public/_redirects](file:///c:/Users/sant7/OneDrive/Desktop/ice-stream-repo/frontend/public/_redirects).

---

## 3. Connecting Frontend and Backend

1. Once the frontend is deployed (e.g., `https://ice-stream.vercel.app`), go to your **Backend Service** dashboard (e.g., on Render or Railway).
2. Update the `ALLOWED_ORIGINS` environment variable to include your frontend URL:
   ```env
   ALLOWED_ORIGINS=https://ice-stream.vercel.app
   ```
3. Restart the backend service.
4. Open `https://ice-stream.vercel.app` in your browser. All REST endpoints and live WebSocket telemetry will connect securely across hosts.

---

## 4. Credential & Secret Safety Checklist

- [x] `.env` is listed in `.gitignore` and is never committed.
- [x] `secrets/` (e.g. `ca.pem`) is listed in `.gitignore` and is never committed.
- [x] All client-facing JavaScript bundles (`dist/`) only contain public endpoints; zero secrets are bundled.
- [x] API responses redact all credentials, passwords, and tokens (`system.py` strict invariant).
- [x] Production secrets are injected exclusively through hosting provider environment variable managers.

"""FastAPI application entrypoint for Ice Stream (Master 7).

Coordinates REST API endpoints, real-time WebSocket streaming,
lifespan management, and CORS configuration.
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.api.routes.health import router as health_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.lakehouse import router as lakehouse_router
from app.api.routes.metrics import router as metrics_router
from app.api.routes.pipeline import router as pipeline_router
from app.api.routes.recovery import router as recovery_router
from app.api.routes.system import router as system_router
from app.api.websockets import router as ws_router, ws_manager
from app.observability.service import get_observability_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ice_stream.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Graceful startup and shutdown lifecycle management."""
    logger.info("Initializing Ice Stream Operational API & Observability Service...")
    # Warm up observability service singleton and synchronize persistent state
    service = get_observability_service()
    snap = service.get_snapshot()
    logger.info(
        f"Observability Service ready: PipelineState={snap.pipeline_state.value} "
        f"CircuitState={snap.circuit_state.value} ActiveIncidents={snap.active_incident_count}"
    )

    yield

    logger.info("Shutting down Ice Stream API and closing WebSocket channels...")
    ws_manager.shutdown()


app = FastAPI(
    title="Ice Stream — Lakehouse Observability & Quality Platform",
    description="Production-grade real-time streaming data quality, circuit breaker, and lakehouse monitoring API.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
allowed_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
allowed_origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
def root_info() -> Dict[str, Any]:
    """Root service information."""
    return {
        "service": "Ice Stream",
        "description": "Real-Time Streaming Data Quality & Lakehouse Observability Platform",
        "version": "1.0.0",
        "docs": "/docs",
        "websocket": "/ws",
        "status": "running",
    }


# Mount all operational REST routes under /api
app.include_router(health_router, prefix="/api")
app.include_router(metrics_router, prefix="/api")
app.include_router(incidents_router, prefix="/api")
app.include_router(recovery_router, prefix="/api")
app.include_router(pipeline_router, prefix="/api")
app.include_router(lakehouse_router, prefix="/api")
app.include_router(system_router, prefix="/api")

# Mount WebSocket endpoint
app.include_router(ws_router)
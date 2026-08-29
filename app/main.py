from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Ice Stream Backend API",
    description="Real-time streaming backend API for Ice Stream Observability",
    version="1.0.0"
)

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Ice Stream Backend API"}

from app.api.endpoints import router as api_router
from app.api.websockets import router as ws_router

app.include_router(api_router, prefix="/api")
app.include_router(ws_router, prefix="/api")

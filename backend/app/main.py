"""
SMADS — Social Media Addiction Detection System
FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import connect_to_database, close_database_connection
from app.routes import auth, usage, analytics, alerts, interventions


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown."""
    # Startup
    print("[SMADS] Starting SMADS Backend...")
    await connect_to_database()

    # Pre-train ML model if not already trained
    from app.services.ml_engine import get_ml_engine
    engine = get_ml_engine()
    if not engine.is_trained:
        print("[SMADS] Training ML model on synthetic data...")
        engine.train()

    yield

    # Shutdown
    await close_database_connection()
    print("[SMADS] SMADS Backend shut down.")


app = FastAPI(
    title="SMADS API",
    description="AI-Powered Social Media Addiction Detection System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routes
app.include_router(auth.router)
app.include_router(usage.router)
app.include_router(analytics.router)
app.include_router(alerts.router)
app.include_router(interventions.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "SMADS API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    from app.database import get_database
    db = get_database()
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy",
        "database": db_status,
        "environment": settings.APP_ENV,
    }

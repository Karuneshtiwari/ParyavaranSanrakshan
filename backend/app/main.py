"""
ParyavaranSanrakshan - FastAPI Backend Application
AI-Powered Smart Waste Segregation and Collection Prediction Platform
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.services.seed_service import seed_database
from backend.app.routes import (
    auth_routes,
    waste_routes,
    bin_routes,
    prediction_routes,
    dashboard_routes,
    collection_routes,
    model_routes,
    blog_routes,
    newsletter_routes,
    event_routes,
    donation_routes,
    contact_routes,
    upload_routes
)
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for ParyavaranSanrakshan - AI Smart Waste Management & Collection Platform"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev and Vercel production domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Create database schema tables
    Base.metadata.create_all(bind=engine)
    # Safe column migration for Neon PostgreSQL
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE bins ADD COLUMN IF NOT EXISTS assigned_collector_id INTEGER;"))
            conn.execute(text("ALTER TABLE bins ADD COLUMN IF NOT EXISTS assigned_collector_name VARCHAR(150);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);"))
            conn.execute(text("ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS phone VARCHAR(50);"))
            conn.execute(text("ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS attendees INTEGER DEFAULT 1;"))
            conn.execute(text("ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS notes TEXT;"))
            conn.commit()
    except Exception as e:
        print(f"[!] Migration notice: {e}")

    # Seed virtual smart bins & demo accounts if database is empty
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    print(f"[SUCCESS] {settings.PROJECT_NAME} Backend initialized successfully.")


# Mount Routers
app.include_router(auth_routes.router, prefix=settings.API_PREFIX)
app.include_router(waste_routes.router, prefix=settings.API_PREFIX)
app.include_router(bin_routes.router, prefix=settings.API_PREFIX)
app.include_router(prediction_routes.router, prefix=settings.API_PREFIX)
app.include_router(dashboard_routes.router, prefix=settings.API_PREFIX)
app.include_router(collection_routes.router, prefix=settings.API_PREFIX)
app.include_router(model_routes.router, prefix=settings.API_PREFIX)
app.include_router(blog_routes.router, prefix=settings.API_PREFIX)
app.include_router(newsletter_routes.router, prefix=settings.API_PREFIX)
app.include_router(event_routes.router, prefix=settings.API_PREFIX)
app.include_router(donation_routes.router, prefix=settings.API_PREFIX)
app.include_router(contact_routes.router, prefix=settings.API_PREFIX)
app.include_router(upload_routes.router, prefix=settings.API_PREFIX)

# Serve local uploads
uploads_dir = Path("backend/static/uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import Depends
from backend.app.database import get_db
from backend.app.services.cloudinary_service import check_cloudinary_connection

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint returning Neon PostgreSQL and Cloudinary connection status.
    Format specified in Part 13:
    {
        "status": "ok",
        "database": "connected",
        "cloudinary": "configured"
    }
    """
    db_status = "disconnected"
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        print(f"[!] Database connection error: {e}")
        db_status = "error"

    cloudinary_status = "configured" if check_cloudinary_connection() else "unconfigured"
    overall_status = "ok" if db_status == "connected" and cloudinary_status == "configured" else "degraded"

    return {
        "status": overall_status,
        "database": db_status,
        "cloudinary": cloudinary_status
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to ParyavaranSanrakshan AI Platform API",
        "docs": "/docs",
        "health": "/health"
    }

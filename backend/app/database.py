"""
Database Engine & Session Management for ParyavaranSanrakshan.
Supports Neon PostgreSQL with connection pooling, SSL mode, and clean session management.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.app.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Connection pooling & SSL configuration
if "sqlite" in db_url:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
else:
    # Neon Serverless PostgreSQL with pooling & recycle
    engine = create_engine(
        db_url,
        pool_size=10,
        max_overflow=20,
        pool_recycle=300,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for obtaining transactional database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""
ParyavaranSanrakshan - Application Configuration
Supports Neon PostgreSQL, JWT Auth, SMTP Email, and ML Model Paths.
"""

import os
import json
from typing import List, Union
from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings

# Load .env file with priority to backend/.env
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
load_dotenv(os.path.join(root_dir, "backend", ".env"), override=True)
load_dotenv(os.path.join(root_dir, ".env"), override=False)
load_dotenv(override=False)


class Settings(BaseSettings):
    PROJECT_NAME: str = "ParyavaranSanrakshan"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database URL (Neon PostgreSQL or SQLite fallback for development)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./paryavaran.db")
    
    # JWT Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "paryavaran_super_secret_jwt_key_2026_sdg11")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # OTP Configuration
    OTP_EXPIRE_MINUTES: int = 5
    OTP_LENGTH: int = 6
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN: int = 60
    
    # SMTP Email Configuration (Gmail App Password)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = os.getenv("SMTP_USER", "info.karuneshtiwari@gmail.com")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")  # 16-digit Google App Password
    SMTP_FROM_NAME: str = "ParyavaranSanrakshan"
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "info.karuneshtiwari@gmail.com")
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")  # Free HTTPS REST Email API (works on Render without port blocking)
    
    # Cloudinary Credentials (Official Python SDK)
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    CLOUDINARY_WASTE_FOLDER: str = os.getenv("CLOUDINARY_WASTE_FOLDER", "paryavaran_sanrakshan/waste_scans")
    CLOUDINARY_PROJECT_FOLDER: str = os.getenv("CLOUDINARY_PROJECT_FOLDER", "paryavaran_sanrakshan/project_media")

    # Image Validation Settings
    MAX_IMAGE_SIZE_MB: int = 5
    ALLOWED_IMAGE_TYPES: Union[str, List[str]] = ["image/jpeg", "image/png", "image/jpg"]

    # Pre-configured Admin Account (no signup allowed)
    ADMIN_EMAIL: str = "karunesh128@gmail.com"
    ADMIN_PASSWORD: str = "AdminOfParyavaranSanrakshan@@789"
    ADMIN_NAME: str = "Karunesh Tiwari"

    # Razorpay Payment Gateway (Test Mode / Live Mode)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_SZLUdIkWkTqG6F")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "https://paryavaransanrakshan.onrender.com/api/auth/google/callback")
    
    # Frontend URL for verification links
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # CORS Origins (Vercel Frontend, Localhost)
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://*.vercel.app",
        "*"
    ]

    @field_validator("CORS_ORIGINS", "ALLOWED_IMAGE_TYPES", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return v
    
    # ML Models Paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    MODELS_DIR: str = os.path.join(BASE_DIR, "models")
    WASTE_MODEL_PATH: str = os.path.join(MODELS_DIR, "waste_classifier", "model.pt")
    BIN_REGRESSOR_PATH: str = os.path.join(MODELS_DIR, "bin_regressor", "model.joblib")
    OVERFLOW_CLF_PATH: str = os.path.join(MODELS_DIR, "overflow_classifier", "model.joblib")
    METRICS_DIR: str = os.path.join(MODELS_DIR, "metrics")

    # Waste Category Mapping (Configurable for local municipal rules)
    CATEGORY_MAPPING: dict = {
        "cardboard": {
            "category": "Dry / Recyclable Waste",
            "bin_color": "Blue",
            "action": "Flatten cardboard boxes and place in the dry recyclable bin."
        },
        "paper": {
            "category": "Dry / Recyclable Waste",
            "bin_color": "Blue",
            "action": "Ensure paper is dry, uncontaminated, and deposit in paper recycling."
        },
        "plastic": {
            "category": "Dry / Recyclable Waste",
            "bin_color": "Blue",
            "action": "Rinse empty bottles/containers, crush to save space, and place in recyclables."
        },
        "metal": {
            "category": "Dry / Recyclable Waste",
            "bin_color": "Blue",
            "action": "Rinse metal cans and deposit in scrap or metal recycling stream."
        },
        "glass": {
            "category": "Dry / Recyclable Waste",
            "bin_color": "Blue",
            "action": "Handle with care to avoid shattering. Place in designated glass collection bin."
        },
        "trash": {
            "category": "General / Reject Waste",
            "bin_color": "Black",
            "action": "Dispose of in the general waste bin. Non-recyclable residual waste."
        },
        "organic": {
            "category": "Wet / Compostable Organic Waste",
            "bin_color": "Green",
            "action": "Deposit in green wet-waste bin or home composting unit. Highly biodegradable."
        }
    }

    class Config:
        case_sensitive = True


settings = Settings()

# Clean up postgres URL if needed (SQLAlchemy prefers postgresql:// over postgres://)
if settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1)

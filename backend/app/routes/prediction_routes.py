"""
Prediction API Routes.
Provides recent prediction records per bin or system-wide.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.all_models import Prediction
from backend.app.schemas.schemas import PredictionResponse

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.get("", response_model=List[PredictionResponse])
def get_all_predictions(limit: int = 50, db: Session = Depends(get_db)):
    preds = db.query(Prediction).order_by(Prediction.prediction_time.desc()).limit(limit).all()
    return preds


@router.get("/{bin_id}", response_model=List[PredictionResponse])
def get_bin_predictions(bin_id: int, limit: int = 20, db: Session = Depends(get_db)):
    preds = db.query(Prediction).filter(Prediction.bin_id == bin_id).order_by(Prediction.prediction_time.desc()).limit(limit).all()
    return preds

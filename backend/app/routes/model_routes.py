"""
Model Metrics API Routes.
Loads and returns REAL model evaluation metrics from disk.
Zero hardcoding: all values are loaded directly from generated evaluation artifacts.
"""

import os
import json
from fastapi import APIRouter, HTTPException
from backend.app.config import settings

router = APIRouter(prefix="/models", tags=["Model Performance"])


@router.get("/metrics")
def get_all_model_metrics():
    metrics_dir = settings.METRICS_DIR
    
    waste_metrics_file = os.path.join(metrics_dir, "waste_metrics.json")
    bin_metrics_file = os.path.join(metrics_dir, "bin_metrics.json")
    overflow_metrics_file = os.path.join(metrics_dir, "overflow_metrics.json")

    waste_data = None
    bin_data = None
    overflow_data = None

    if os.path.exists(waste_metrics_file):
        with open(waste_metrics_file, "r") as f:
            waste_data = json.load(f)

    if os.path.exists(bin_metrics_file):
        with open(bin_metrics_file, "r") as f:
            bin_data = json.load(f)

    if os.path.exists(overflow_metrics_file):
        with open(overflow_metrics_file, "r") as f:
            overflow_data = json.load(f)

    if not waste_data and not bin_data and not overflow_data:
        raise HTTPException(status_code=404, detail="Model metrics have not been generated yet.")

    return {
        "waste_classifier": waste_data,
        "bin_regressor": bin_data,
        "overflow_classifier": overflow_data
    }

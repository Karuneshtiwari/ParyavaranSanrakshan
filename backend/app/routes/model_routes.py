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
    search_dirs = [
        settings.METRICS_DIR,
        os.path.abspath(os.path.join(settings.BASE_DIR, "..", "ml", "evaluation")),
        os.path.abspath(os.path.join(settings.BASE_DIR, "models", "metrics")),
        "/app/ml/evaluation",
        "/app/backend/models/metrics"
    ]

    def load_metric_file(filename: str):
        for d in search_dirs:
            p = os.path.join(d, filename)
            if os.path.exists(p):
                try:
                    with open(p, "r") as f:
                        return json.load(f)
                except Exception:
                    pass
        return None

    waste_data = load_metric_file("waste_metrics.json")
    bin_data = load_metric_file("bin_metrics.json")
    overflow_data = load_metric_file("overflow_metrics.json")

    if not waste_data and not bin_data and not overflow_data:
        raise HTTPException(status_code=404, detail="Model metrics have not been generated yet.")

    return {
        "waste_classifier": waste_data,
        "bin_regressor": bin_data,
        "overflow_classifier": overflow_data
    }

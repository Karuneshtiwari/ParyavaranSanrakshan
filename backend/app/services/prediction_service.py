"""
Smart Bin Intelligence Prediction Service.
Performs real inference using trained RandomForestRegressor and RandomForestClassifier.
Calculates transparent collection priority decision-support score.
"""

import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from backend.app.config import settings

_bin_regressor = None
_overflow_classifier = None


def load_bin_models():
    global _bin_regressor, _overflow_classifier
    if _bin_regressor is not None and _overflow_classifier is not None:
        return _bin_regressor, _overflow_classifier

    reg_path = settings.BIN_REGRESSOR_PATH
    clf_path = settings.OVERFLOW_CLF_PATH

    if os.path.exists(reg_path):
        _bin_regressor = joblib.load(reg_path)
    if os.path.exists(clf_path):
        _overflow_classifier = joblib.load(clf_path)

    return _bin_regressor, _overflow_classifier


def predict_bin_telemetry(
    current_fill: float,
    previous_fill: float,
    fill_change_rate: float,
    location: str,
    waste_type: str,
    hour: int,
    day_of_week: int,
    hours_since_collection: int,
    temperature: float = 30.0
) -> dict:
    reg, clf = load_bin_models()
    if reg is None or clf is None:
        # Fallback heuristic calculation if models are still training
        pred_6h = min(100.0, max(0.0, current_fill + fill_change_rate * 6))
        pred_12h = min(100.0, max(0.0, current_fill + fill_change_rate * 12))
        risk_level = "HIGH" if current_fill >= 80 or pred_6h >= 85 else ("MEDIUM" if current_fill >= 55 else "LOW")
        overflow_prob = 0.90 if risk_level == "HIGH" else (0.50 if risk_level == "MEDIUM" else 0.15)
    else:
        is_weekend = 1 if day_of_week >= 5 else 0

        # Model 2 Regressor inference
        df_reg = pd.DataFrame([{
            "fill_level": current_fill,
            "previous_fill_level": previous_fill,
            "fill_change_rate": fill_change_rate,
            "hour": hour,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "location": location,
            "waste_type": waste_type,
            "hours_since_collection": hours_since_collection,
            "temperature": temperature
        }])
        reg_preds = reg.predict(df_reg)[0]
        pred_6h = float(np.clip(reg_preds[0], 0.0, 100.0))
        pred_12h = float(np.clip(reg_preds[1], 0.0, 100.0))

        # Model 3 Classifier inference
        df_clf = pd.DataFrame([{
            "fill_level": current_fill,
            "future_fill_6h": pred_6h,
            "fill_change_rate": fill_change_rate,
            "location": location,
            "hour": hour,
            "day_of_week": day_of_week,
            "hours_since_collection": hours_since_collection,
            "waste_type": waste_type
        }])
        risk_pred = clf.predict(df_clf)[0]
        risk_level = str(risk_pred)
        probs = clf.predict_proba(df_clf)[0]
        classes = list(clf.classes_)
        risk_idx = classes.index(risk_level) if risk_level in classes else 0
        overflow_prob = float(probs[risk_idx])

    # Transparent Decision-Support Priority Engine (Section 9)
    # Priority Score = 0.45 * current_fill + 0.35 * predicted_6h + 0.20 * normalized_risk
    risk_score_map = {"HIGH": 100.0, "MEDIUM": 50.0, "LOW": 10.0}
    norm_risk = risk_score_map.get(risk_level, 20.0)

    priority_score = round(
        (0.45 * current_fill) + (0.35 * pred_6h) + (0.20 * norm_risk),
        2
    )

    if priority_score >= 75.0 or current_fill >= 85.0:
        priority_level = "CRITICAL"
    elif priority_score >= 55.0 or current_fill >= 70.0:
        priority_level = "HIGH"
    elif priority_score >= 35.0:
        priority_level = "MEDIUM"
    else:
        priority_level = "LOW"

    return {
        "predicted_6h": round(pred_6h, 1),
        "predicted_12h": round(pred_12h, 1),
        "risk_level": risk_level,
        "overflow_probability": round(overflow_prob, 3),
        "priority_score": priority_score,
        "priority_level": priority_level
    }

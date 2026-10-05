"""
Smart Bin Intelligence ML Training Script
Trains:
1. Bin Fill Regressor (RandomForestRegressor for 6h and 12h future fill prediction)
2. Overflow Risk Classifier (RandomForestClassifier for LOW/MEDIUM/HIGH risk)
Extracts real metrics (MAE, RMSE, R2, Accuracy, Precision, Recall, F1, Confusion Matrix)
and saves model artifacts for FastAPI inference.
"""

import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_PATH = os.path.join(BASE_DIR, "data", "synthetic_bin_telemetry.csv")
BACKEND_REG_DIR = os.path.join(BASE_DIR, "backend", "models", "bin_regressor")
BACKEND_CLF_DIR = os.path.join(BASE_DIR, "backend", "models", "overflow_classifier")
BACKEND_METRICS_DIR = os.path.join(BASE_DIR, "backend", "models", "metrics")
ML_EVAL_DIR = os.path.join(BASE_DIR, "ml", "evaluation")
ML_MODELS_DIR = os.path.join(BASE_DIR, "ml", "models")


def train_bin_models():
    sys.stdout.reconfigure(encoding='utf-8')
    os.makedirs(BACKEND_REG_DIR, exist_ok=True)
    os.makedirs(BACKEND_CLF_DIR, exist_ok=True)
    os.makedirs(BACKEND_METRICS_DIR, exist_ok=True)
    os.makedirs(ML_EVAL_DIR, exist_ok=True)
    os.makedirs(ML_MODELS_DIR, exist_ok=True)

    if not os.path.exists(DATA_PATH):
        print(f"Data file {DATA_PATH} not found. Running generate_bin_data.py first...")
        from ml.scripts.generate_bin_data import main as gen_data
        gen_data()

    print(f"Loading synthetic smart-bin dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df):,} records across {df['bin_id'].nunique()} virtual bins.")

    # Time-based train/test split (80% train, 20% test chronologically to prevent temporal leakage)
    df = df.sort_values(by="timestamp").reset_index(drop=True)
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    print(f"Time-series split: Train={len(train_df):,} records, Test={len(test_df):,} records")

    # -------------------------------------------------------------
    # MODEL 2: Bin Fill Regressor (Multi-output for 6h and 12h)
    # -------------------------------------------------------------
    print("\n=======================================================")
    print("Training ML Model 2: Bin Fill Regressor (RandomForest)")
    print("=======================================================")

    features_reg = [
        "fill_level",
        "previous_fill_level",
        "fill_change_rate",
        "hour",
        "day_of_week",
        "is_weekend",
        "location",
        "waste_type",
        "hours_since_collection",
        "temperature"
    ]
    categorical_features = ["location", "waste_type"]
    numeric_features = [f for f in features_reg if f not in categorical_features]

    X_train_reg = train_df[features_reg]
    y_train_reg = train_df[["future_fill_6h", "future_fill_12h"]]

    X_test_reg = test_df[features_reg]
    y_test_reg = test_df[["future_fill_6h", "future_fill_12h"]]

    preprocessor_reg = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features)
        ],
        remainder="passthrough"
    )

    reg_pipeline = Pipeline([
        ("preprocessor", preprocessor_reg),
        ("regressor", RandomForestRegressor(n_estimators=100, max_depth=16, min_samples_split=4, random_state=42, n_jobs=-1))
    ])

    print("Fitting RandomForestRegressor...")
    start_t = time.time()
    reg_pipeline.fit(X_train_reg, y_train_reg)
    reg_train_time = time.time() - start_t
    print(f"Regressor trained in {reg_train_time:.2f}s")

    # Predictions and Evaluation
    y_pred_reg = reg_pipeline.predict(X_test_reg)

    mae_6h = float(mean_absolute_error(y_test_reg["future_fill_6h"], y_pred_reg[:, 0]))
    rmse_6h = float(root_mean_squared_error(y_test_reg["future_fill_6h"], y_pred_reg[:, 0]))
    r2_6h = float(r2_score(y_test_reg["future_fill_6h"], y_pred_reg[:, 0]))

    mae_12h = float(mean_absolute_error(y_test_reg["future_fill_12h"], y_pred_reg[:, 1]))
    rmse_12h = float(root_mean_squared_error(y_test_reg["future_fill_12h"], y_pred_reg[:, 1]))
    r2_12h = float(r2_score(y_test_reg["future_fill_12h"], y_pred_reg[:, 1]))

    overall_mae = round((mae_6h + mae_12h) / 2.0, 4)
    overall_rmse = round((rmse_6h + rmse_12h) / 2.0, 4)
    overall_r2 = round((r2_6h + r2_12h) / 2.0, 4)

    print(f"\n--- Real Model 2 Evaluation on Test Set ---")
    print(f"6-Hour Horizon  | MAE: {mae_6h:.3f}% | RMSE: {rmse_6h:.3f}% | R²: {r2_6h:.4f}")
    print(f"12-Hour Horizon | MAE: {mae_12h:.3f}% | RMSE: {rmse_12h:.3f}% | R²: {r2_12h:.4f}")
    print(f"Overall Metrics | MAE: {overall_mae:.3f}% | RMSE: {overall_rmse:.3f}% | R²: {overall_r2:.4f}")

    bin_metrics = {
        "model_name": "RandomForestRegressor (Multi-Output 6h & 12h)",
        "dataset": "Synthetic Smart-Bin Telemetry Dataset for Prototype Demonstration",
        "sample_count": len(df),
        "test_sample_count": len(test_df),
        "evaluation_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "features": features_reg,
        "overall": {
            "mae": overall_mae,
            "rmse": overall_rmse,
            "r2": overall_r2
        },
        "horizon_6h": {
            "mae": round(mae_6h, 4),
            "rmse": round(rmse_6h, 4),
            "r2": round(r2_6h, 4)
        },
        "horizon_12h": {
            "mae": round(mae_12h, 4),
            "rmse": round(rmse_12h, 4),
            "r2": round(r2_12h, 4)
        }
    }

    # -------------------------------------------------------------
    # MODEL 3: Overflow Risk Classifier
    # -------------------------------------------------------------
    print("\n=======================================================")
    print("Training ML Model 3: Overflow Risk Classifier (RandomForest)")
    print("=======================================================")

    features_clf = [
        "fill_level",
        "future_fill_6h",
        "fill_change_rate",
        "location",
        "hour",
        "day_of_week",
        "hours_since_collection",
        "waste_type"
    ]
    cat_clf = ["location", "waste_type"]

    X_train_clf = train_df[features_clf]
    y_train_clf = train_df["overflow_risk"]

    X_test_clf = test_df[features_clf]
    y_test_clf = test_df["overflow_risk"]

    risk_classes = ["LOW", "MEDIUM", "HIGH"]

    preprocessor_clf = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_clf)
        ],
        remainder="passthrough"
    )

    clf_pipeline = Pipeline([
        ("preprocessor", preprocessor_clf),
        ("classifier", RandomForestClassifier(n_estimators=100, max_depth=14, min_samples_split=4, random_state=42, n_jobs=-1))
    ])

    print("Fitting RandomForestClassifier...")
    start_t = time.time()
    clf_pipeline.fit(X_train_clf, y_train_clf)
    clf_train_time = time.time() - start_t
    print(f"Classifier trained in {clf_train_time:.2f}s")

    y_pred_clf = clf_pipeline.predict(X_test_clf)

    acc = float(accuracy_score(y_test_clf, y_pred_clf))
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(y_test_clf, y_pred_clf, average='macro', zero_division=0)
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(y_test_clf, y_pred_clf, average='weighted', zero_division=0)
    cm_clf = confusion_matrix(y_test_clf, y_pred_clf, labels=risk_classes).tolist()
    rep_clf = classification_report(y_test_clf, y_pred_clf, labels=risk_classes, output_dict=True, zero_division=0)

    print(f"\n--- Real Model 3 Evaluation on Test Set ---")
    print(f"Accuracy:          {acc:.4f}")
    print(f"Precision (Macro): {prec_macro:.4f}")
    print(f"Recall (Macro):    {rec_macro:.4f}")
    print(f"F1-Score (Macro):  {f1_macro:.4f}")

    overflow_metrics = {
        "model_name": "RandomForestClassifier (Overflow Risk)",
        "dataset": "Synthetic Smart-Bin Telemetry Dataset for Prototype Demonstration",
        "sample_count": len(df),
        "test_sample_count": len(test_df),
        "evaluation_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "features": features_clf,
        "classes": risk_classes,
        "accuracy": round(acc, 4),
        "precision_macro": round(float(prec_macro), 4),
        "recall_macro": round(float(rec_macro), 4),
        "f1_score_macro": round(float(f1_macro), 4),
        "precision_weighted": round(float(prec_weighted), 4),
        "recall_weighted": round(float(rec_weighted), 4),
        "f1_score_weighted": round(float(f1_weighted), 4),
        "confusion_matrix": cm_clf,
        "classification_report": rep_clf
    }

    # Save artifacts to backend and ml directories
    joblib.dump(reg_pipeline, os.path.join(BACKEND_REG_DIR, "model.joblib"))
    joblib.dump(reg_pipeline, os.path.join(ML_MODELS_DIR, "bin_fill_regressor.joblib"))
    with open(os.path.join(BACKEND_REG_DIR, "features.json"), "w") as f:
        json.dump(features_reg, f, indent=2)

    joblib.dump(clf_pipeline, os.path.join(BACKEND_CLF_DIR, "model.joblib"))
    joblib.dump(clf_pipeline, os.path.join(ML_MODELS_DIR, "overflow_classifier.joblib"))
    with open(os.path.join(BACKEND_CLF_DIR, "classes.json"), "w") as f:
        json.dump(risk_classes, f, indent=2)

    with open(os.path.join(BACKEND_METRICS_DIR, "bin_metrics.json"), "w") as f:
        json.dump(bin_metrics, f, indent=2)
    with open(os.path.join(ML_EVAL_DIR, "bin_metrics.json"), "w") as f:
        json.dump(bin_metrics, f, indent=2)

    with open(os.path.join(BACKEND_METRICS_DIR, "overflow_metrics.json"), "w") as f:
        json.dump(overflow_metrics, f, indent=2)
    with open(os.path.join(ML_EVAL_DIR, "overflow_metrics.json"), "w") as f:
        json.dump(overflow_metrics, f, indent=2)

    print("\n[SUCCESS] Successfully trained and saved both Smart Bin ML models and real metric reports!")


if __name__ == "__main__":
    train_bin_models()

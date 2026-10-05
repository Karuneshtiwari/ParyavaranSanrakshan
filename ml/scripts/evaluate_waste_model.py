"""
Model Evaluation Script for ParyavaranSanrakshan Waste Classifier.
Evaluates strictly on the held-out test set (15% unseen data).
Generates detailed metrics, per-class report, and confusion matrix visual.
"""

import os
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import models
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)

import sys
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

SPLITS_FILE = os.path.join(BASE_DIR, "ml", "data", "waste_splits_7class.json")
MODEL_PATH = os.path.join(BASE_DIR, "ml", "models", "waste_classifier", "model.pt")
CLASS_NAMES_FILE = os.path.join(BASE_DIR, "ml", "models", "waste_classifier", "class_names.json")
EVAL_DIR = os.path.join(BASE_DIR, "ml", "evaluation")

from ml.scripts.train_waste_model import (
    CustomWasteDataset,
    get_transforms,
    build_stratified_splits,
    evaluate_test_set,
    CLASS_NAMES
)


def run_evaluation():
    print("=" * 60)
    print("PARYAVARANSANRAKSHAN - WASTE CLASSIFIER EVALUATION")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[+] Evaluation Device: {device}")

    # Load test split
    if os.path.exists(SPLITS_FILE):
        with open(SPLITS_FILE, "r") as f:
            manifest = json.load(f)
        test_samples = manifest["splits"]["test"]
        class_names = manifest.get("classes", CLASS_NAMES)
    else:
        print("[!] Splits file not found. Generating fresh stratified split (Seed 42)...")
        _, _, test_samples = build_stratified_splits()
        class_names = CLASS_NAMES

    print(f"[+] Test sample count: {len(test_samples)}")

    _, eval_tf = get_transforms()
    test_ds = CustomWasteDataset(test_samples, transform=eval_tf)
    test_loader = DataLoader(test_ds, batch_size=32, shuffle=False, num_workers=0)

    # Load model
    target_model_path = MODEL_PATH
    if not os.path.exists(target_model_path):
        alt_path = os.path.join(BASE_DIR, "backend", "models", "waste_classifier", "model.pt")
        if os.path.exists(alt_path):
            target_model_path = alt_path
        else:
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH} or {alt_path}")

    print(f"[+] Loading model from: {target_model_path}")
    model = models.mobilenet_v3_small(weights=None)
    num_ftrs = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(num_ftrs, len(class_names))

    state_dict = torch.load(target_model_path, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()

    metrics = evaluate_test_set(model, test_loader, device, test_samples)

    os.makedirs(EVAL_DIR, exist_ok=True)
    out_path = os.path.join(EVAL_DIR, "waste_metrics.json")
    with open(out_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n[SUCCESS] Evaluation report saved to: {out_path}")
    return metrics


if __name__ == "__main__":
    run_evaluation()

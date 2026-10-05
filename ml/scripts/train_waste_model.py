"""
Waste Classification Model Training Script for ParyavaranSanrakshan.
Architecture: MobileNetV3-Small (Transfer Learning with ImageNet Pretrained Weights)
Classes: 7 (cardboard, glass, metal, paper, plastic, trash, organic)
Splits: 70% Train, 15% Validation, 15% Test (Stratified, SEED=42)
Imbalance: Class-weighted CrossEntropyLoss
Optimized for reliable, fast CPU convergence with transfer learning.
"""

import os
import sys
import json
import time
import copy
import random
import numpy as np
from collections import Counter
from PIL import Image

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "data", "dataset-resized")

# Artifact Directories
ML_MODEL_DIR = os.path.join(BASE_DIR, "ml", "models", "waste_classifier")
ML_ROOT_MODEL_DIR = os.path.join(BASE_DIR, "ml", "models")
BACKEND_MODEL_DIR = os.path.join(BASE_DIR, "backend", "models", "waste_classifier")
BACKEND_METRICS_DIR = os.path.join(BASE_DIR, "backend", "models", "metrics")
ML_EVAL_DIR = os.path.join(BASE_DIR, "ml", "evaluation")
SPLITS_DIR = os.path.join(BASE_DIR, "ml", "data")

CLASS_NAMES = ["cardboard", "glass", "metal", "paper", "plastic", "trash", "organic"]
CLASS_TO_IDX = {name: idx for idx, name in enumerate(CLASS_NAMES)}
SEED = 42


def set_seed(seed=SEED):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


class CustomWasteDataset(Dataset):
    def __init__(self, samples, transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        item = self.samples[idx]
        image_path = item["path"]
        try:
            image = Image.open(image_path).convert("RGB")
        except Exception:
            image = Image.new("RGB", (224, 224), (0, 0, 0))

        if self.transform:
            image = self.transform(image)
        return image, item["label"]


def build_stratified_splits(data_dir=DATA_DIR, seed=SEED):
    """
    Scans data/dataset-resized/ directly and programmatically creates
    a 70/15/15 stratified train/val/test split.
    """
    valid_exts = {".jpg", ".jpeg", ".png"}
    all_samples = []

    for cls_name in CLASS_NAMES:
        cls_dir = os.path.join(data_dir, cls_name)
        if not os.path.isdir(cls_dir):
            raise FileNotFoundError(f"Missing required class directory: {cls_dir}")

        for fname in os.listdir(cls_dir):
            _, ext = os.path.splitext(fname)
            if ext.lower() in valid_exts:
                fpath = os.path.join(cls_dir, fname)
                all_samples.append({
                    "path": fpath,
                    "rel_path": os.path.relpath(fpath, BASE_DIR).replace("\\", "/"),
                    "class_name": cls_name,
                    "label": CLASS_TO_IDX[cls_name]
                })

    labels = [s["label"] for s in all_samples]
    total_count = len(all_samples)
    print(f"[+] Total samples discovered: {total_count}", flush=True)

    # 1st split: 85% train+val, 15% test
    train_val_samples, test_samples = train_test_split(
        all_samples,
        test_size=0.15,
        random_state=seed,
        stratify=labels
    )

    # 2nd split: from 85%, take 70/85 train and 15/85 val
    train_val_labels = [s["label"] for s in train_val_samples]
    relative_val_size = 0.15 / 0.85

    train_samples, val_samples = train_test_split(
        train_val_samples,
        test_size=relative_val_size,
        random_state=seed,
        stratify=train_val_labels
    )

    print(f"[+] Stratified Split (Seed {seed}):", flush=True)
    print(f"    Train: {len(train_samples)} ({len(train_samples)/total_count*100:.1f}%)", flush=True)
    print(f"    Val:   {len(val_samples)} ({len(val_samples)/total_count*100:.1f}%)", flush=True)
    print(f"    Test:  {len(test_samples)} ({len(test_samples)/total_count*100:.1f}%)", flush=True)

    os.makedirs(SPLITS_DIR, exist_ok=True)
    manifest = {
        "classes": CLASS_NAMES,
        "class_to_idx": CLASS_TO_IDX,
        "total": total_count,
        "counts": {
            "train": len(train_samples),
            "val": len(val_samples),
            "test": len(test_samples)
        },
        "splits": {
            "train": train_samples,
            "val": val_samples,
            "test": test_samples
        }
    }
    manifest_path = os.path.join(SPLITS_DIR, "waste_splits_7class.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    return train_samples, val_samples, test_samples


def get_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomResizedCrop(224, scale=(0.85, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    eval_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    return train_transform, eval_transform


def compute_class_weights(train_samples):
    counts = Counter(s["label"] for s in train_samples)
    total = len(train_samples)
    n_classes = len(CLASS_NAMES)
    weights = [total / (n_classes * max(counts[i], 1)) for i in range(n_classes)]
    weights_tensor = torch.tensor(weights, dtype=torch.float32)
    print("\n[+] Computed Class Weights for Imbalance Handling:", flush=True)
    for i, name in enumerate(CLASS_NAMES):
        print(f"    {name:10s} (Count: {counts[i]:4d}): weight = {weights[i]:.4f}", flush=True)
    return weights_tensor


def train_waste_model(epochs=2, batch_size=64, lr=0.001):
    set_seed(SEED)

    for d in [ML_MODEL_DIR, ML_ROOT_MODEL_DIR, BACKEND_MODEL_DIR, BACKEND_METRICS_DIR, ML_EVAL_DIR]:
        os.makedirs(d, exist_ok=True)

    class_names_path1 = os.path.join(ML_MODEL_DIR, "class_names.json")
    class_names_path2 = os.path.join(BACKEND_MODEL_DIR, "class_names.json")
    for cp in [class_names_path1, class_names_path2]:
        with open(cp, "w") as f:
            json.dump(CLASS_NAMES, f, indent=2)

    train_samples, val_samples, test_samples = build_stratified_splits()
    train_tf, eval_tf = get_transforms()

    train_ds = CustomWasteDataset(train_samples, transform=train_tf)
    val_ds = CustomWasteDataset(val_samples, transform=eval_tf)
    test_ds = CustomWasteDataset(test_samples, transform=eval_tf)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=0)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n[+] Training device: {device}", flush=True)

    # Initialize MobileNetV3-Small with pretrained weights
    print("[+] Initializing MobileNetV3-Small with ImageNet pretrained weights...", flush=True)
    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)

    # Freeze feature extractor for efficient CPU transfer learning
    for param in model.features.parameters():
        param.requires_grad = False

    num_ftrs = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(num_ftrs, len(CLASS_NAMES))
    model = model.to(device)

    class_weights = compute_class_weights(train_samples).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr, weight_decay=1e-4)

    best_model_wts = copy.deepcopy(model.state_dict())
    best_val_acc = 0.0
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

    print(f"\n[+] Starting training ({epochs} epochs, batch_size={batch_size})...", flush=True)
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        model.train()
        train_loss = 0.0
        train_corrects = 0

        # In last epoch, unfreeze top feature layer for fine-tuning
        if epoch == epochs:
            for param in model.features[-1].parameters():
                param.requires_grad = True
            optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr * 0.5, weight_decay=1e-4)

        for b_idx, (inputs, labels) in enumerate(train_loader):
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)

            loss.backward()
            optimizer.step()

            train_loss += loss.item() * inputs.size(0)
            train_corrects += torch.sum(preds == labels.data).item()

            if (b_idx + 1) % 25 == 0 or (b_idx + 1) == len(train_loader):
                print(f"    Epoch {epoch} Step [{b_idx+1:2d}/{len(train_loader):2d}] Loss: {loss.item():.4f}", flush=True)

        epoch_train_loss = train_loss / len(train_ds)
        epoch_train_acc = train_corrects / len(train_ds)

        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_corrects = 0

        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device)
                labels = labels.to(device)
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data).item()

        epoch_val_loss = val_loss / len(val_ds)
        epoch_val_acc = val_corrects / len(val_ds)
        epoch_sec = time.time() - epoch_start

        history["train_loss"].append(round(epoch_train_loss, 4))
        history["train_acc"].append(round(epoch_train_acc, 4))
        history["val_loss"].append(round(epoch_val_loss, 4))
        history["val_acc"].append(round(epoch_val_acc, 4))

        print(f"--> Epoch {epoch}/{epochs} ({epoch_sec:.1f}s) | Train Loss: {epoch_train_loss:.4f} Acc: {epoch_train_acc:.4f} | Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc:.4f}", flush=True)

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            best_model_wts = copy.deepcopy(model.state_dict())

    duration = time.time() - start_time
    print(f"\n[SUCCESS] Training completed in {duration:.1f}s. Best Val Accuracy: {best_val_acc:.4f}", flush=True)

    # Load best weights
    model.load_state_dict(best_model_wts)
    model.eval()

    saved_pt_paths = [
        os.path.join(ML_MODEL_DIR, "model.pt"),
        os.path.join(BACKEND_MODEL_DIR, "model.pt"),
        os.path.join(ML_ROOT_MODEL_DIR, "waste_classifier_mobilenetv3.pt")
    ]
    for p in saved_pt_paths:
        torch.save(model.state_dict(), p)
        print(f"[+] Saved model artifact: {p}", flush=True)

    # Evaluate on held-out test set
    print("\n[+] Evaluating model on held-out test set (15% unseen data)...", flush=True)
    test_metrics = evaluate_test_set(model, test_loader, device, test_samples)

    test_metrics["training_summary"] = {
        "epochs": epochs,
        "batch_size": batch_size,
        "best_val_accuracy": round(best_val_acc, 4),
        "final_train_accuracy": history["train_acc"][-1],
        "training_time_seconds": round(duration, 1),
        "history": history
    }

    metrics_paths = [
        os.path.join(ML_EVAL_DIR, "waste_metrics.json"),
        os.path.join(BACKEND_METRICS_DIR, "waste_metrics.json")
    ]
    for mp in metrics_paths:
        with open(mp, "w") as f:
            json.dump(test_metrics, f, indent=2)
        print(f"[+] Saved evaluation metrics: {mp}", flush=True)

    return test_metrics


def evaluate_test_set(model, test_loader, device, test_samples):
    all_preds = []
    all_targets = []
    all_probs = []

    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(labels.numpy())
            all_probs.extend(probs.cpu().numpy())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)

    test_acc = accuracy_score(all_targets, all_preds)
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(
        all_targets, all_preds, average='macro', zero_division=0
    )
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(
        all_targets, all_preds, average='weighted', zero_division=0
    )

    p_per, r_per, f1_per, support = precision_recall_fscore_support(
        all_targets, all_preds, average=None, zero_division=0
    )

    per_class_metrics = {}
    for i, cname in enumerate(CLASS_NAMES):
        per_class_metrics[cname] = {
            "precision": round(float(p_per[i]), 4),
            "recall": round(float(r_per[i]), 4),
            "f1_score": round(float(f1_per[i]), 4),
            "support": int(support[i])
        }

    cm = confusion_matrix(all_targets, all_preds).tolist()
    report_dict = classification_report(
        all_targets, all_preds, target_names=CLASS_NAMES, output_dict=True, zero_division=0
    )

    print("\n" + "=" * 55, flush=True)
    print("HELD-OUT TEST SET EVALUATION REPORT (7 CLASSES)", flush=True)
    print("=" * 55, flush=True)
    print(f"Accuracy:        {test_acc:.4f}", flush=True)
    print(f"Macro Precision: {prec_macro:.4f}", flush=True)
    print(f"Macro Recall:    {rec_macro:.4f}", flush=True)
    print(f"Macro F1-Score:  {f1_macro:.4f}", flush=True)
    print("-" * 55, flush=True)
    print(f"{'Class':<12} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}", flush=True)
    print("-" * 55, flush=True)
    for cname in CLASS_NAMES:
        m = per_class_metrics[cname]
        print(f"{cname:<12} | {m['precision']:<10.4f} | {m['recall']:<10.4f} | {m['f1_score']:<10.4f} | {m['support']:<8d}", flush=True)
    print("=" * 55, flush=True)

    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt

        plt.figure(figsize=(8, 6))
        plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Greens)
        plt.title('Confusion Matrix - 7 Class Waste Classifier')
        plt.colorbar()
        tick_marks = np.arange(len(CLASS_NAMES))
        plt.xticks(tick_marks, CLASS_NAMES, rotation=45)
        plt.yticks(tick_marks, CLASS_NAMES)

        thresh = np.array(cm).max() / 2.
        for i in range(len(CLASS_NAMES)):
            for j in range(len(CLASS_NAMES)):
                plt.text(j, i, format(cm[i][j], 'd'),
                         horizontalalignment="center",
                         color="white" if cm[i][j] > thresh else "black")

        plt.ylabel('True Class')
        plt.xlabel('Predicted Class')
        plt.tight_layout()
        cm_path = os.path.join(ML_EVAL_DIR, "waste_confusion_matrix.png")
        plt.savefig(cm_path, dpi=150)
        plt.close()
        print(f"[+] Saved confusion matrix visualization: {cm_path}", flush=True)
    except Exception as plt_err:
        print(f"[!] Could not generate CM plot: {plt_err}", flush=True)

    return {
        "model_name": "MobileNetV3-Small",
        "dataset_name": "ParyavaranSanrakshan-Resized (5,178 images)",
        "classes": CLASS_NAMES,
        "num_classes": len(CLASS_NAMES),
        "test_sample_count": len(test_samples),
        "accuracy": round(float(test_acc), 4),
        "macro_precision": round(float(prec_macro), 4),
        "macro_recall": round(float(rec_macro), 4),
        "macro_f1": round(float(f1_macro), 4),
        "weighted_precision": round(float(prec_weighted), 4),
        "weighted_recall": round(float(rec_weighted), 4),
        "weighted_f1": round(float(f1_weighted), 4),
        "per_class": per_class_metrics,
        "confusion_matrix": cm,
        "classification_report": report_dict
    }


if __name__ == "__main__":
    train_waste_model(epochs=2, batch_size=64, lr=0.001)

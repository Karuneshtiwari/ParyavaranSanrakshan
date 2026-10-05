"""
Transfer Learning Model Training Script for Waste Classification
Architecture: MobileNetV3-Small (pretrained on ImageNet)
Classes: 6 (cardboard, glass, metal, paper, plastic, trash)
Produces real evaluation metrics, confusion matrix, and model artifacts.
"""

import os
import sys
import json
import time
import copy
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SPLITS_FILE = os.path.join(BASE_DIR, "ml", "data", "trashnet_splits.json")
BACKEND_MODEL_DIR = os.path.join(BASE_DIR, "backend", "models", "waste_classifier")
BACKEND_METRICS_DIR = os.path.join(BASE_DIR, "backend", "models", "metrics")
ML_MODEL_DIR = os.path.join(BASE_DIR, "ml", "models")
ML_EVAL_DIR = os.path.join(BASE_DIR, "ml", "evaluation")

CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]


class TrashNetDataset(Dataset):
    def __init__(self, samples, transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        item = self.samples[idx]
        full_path = os.path.join(BASE_DIR, item["path"])
        image = Image.open(full_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, item["class_id"]


def get_data_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_test_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    return train_transform, val_test_transform


def train_waste_model(epochs=6, batch_size=32, lr=0.001):
    os.makedirs(BACKEND_MODEL_DIR, exist_ok=True)
    os.makedirs(BACKEND_METRICS_DIR, exist_ok=True)
    os.makedirs(ML_MODEL_DIR, exist_ok=True)
    os.makedirs(ML_EVAL_DIR, exist_ok=True)

    if not os.path.exists(SPLITS_FILE):
        print(f"Splits file {SPLITS_FILE} not found. Preparing dataset first...")
        from ml.scripts.prepare_dataset import prepare_dataset
        prepare_dataset()

    with open(SPLITS_FILE, "r") as f:
        manifest = json.load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n[+] Using device: {device} for waste classifier training")

    train_tf, val_tf = get_data_transforms()

    train_dataset = TrashNetDataset(manifest["splits"]["train"], transform=train_tf)
    val_dataset = TrashNetDataset(manifest["splits"]["val"], transform=val_tf)
    test_dataset = TrashNetDataset(manifest["splits"]["test"], transform=val_tf)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    print(f"Datasets initialized: Train={len(train_dataset)}, Val={len(val_dataset)}, Test={len(test_dataset)}")

    # Initialize MobileNetV3-Small
    print("\n[+] Initializing MobileNetV3-Small with ImageNet pretrained weights...")
    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)

    # Freeze earlier feature extractor layers for fine-tuning
    for param in model.features[:-3].parameters():
        param.requires_grad = False

    # Replace classifier head for 6 classes
    num_ftrs = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(num_ftrs, len(CLASSES))
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=2)

    best_model_wts = copy.deepcopy(model.state_dict())
    best_val_acc = 0.0

    print(f"\n[+] Starting training for {epochs} epochs...")
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        # Training phase
        model.train()
        running_loss = 0.0
        running_corrects = 0

        for inputs, labels in train_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)

            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data).item()

        epoch_loss = running_loss / len(train_dataset)
        epoch_acc = running_corrects / len(train_dataset)

        # Validation phase
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

        val_epoch_loss = val_loss / len(val_dataset)
        val_epoch_acc = val_corrects / len(val_dataset)

        scheduler.step(val_epoch_acc)

        print(f"Epoch {epoch}/{epochs} | Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f} | Val Loss: {val_epoch_loss:.4f} Acc: {val_epoch_acc:.4f}")

        if val_epoch_acc > best_val_acc:
            best_val_acc = val_epoch_acc
            best_model_wts = copy.deepcopy(model.state_dict())

    training_time = time.time() - start_time
    print(f"\n[SUCCESS] Training completed in {training_time:.1f}s. Best Val Accuracy: {best_val_acc:.4f}")

    # Load best model weights for evaluation
    model.load_state_dict(best_model_wts)
    model.eval()

    # Test Set Evaluation
    print("\n[+] Evaluating on Test Set (15% unseen data)...")
    all_preds = []
    all_labels = []
    all_probs = []

    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())
            all_probs.extend(probs.cpu().numpy())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)

    test_acc = float(accuracy_score(all_labels, all_preds))
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(all_labels, all_preds, average='macro', zero_division=0)
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(all_labels, all_preds, average='weighted', zero_division=0)
    cm = confusion_matrix(all_labels, all_preds).tolist()
    cls_report = classification_report(all_labels, all_preds, target_names=CLASSES, output_dict=True, zero_division=0)

    print(f"\n--- Real Test Set Performance ---")
    print(f"Accuracy:  {test_acc:.4f}")
    print(f"Precision (Macro): {prec_macro:.4f}")
    print(f"Recall (Macro):    {rec_macro:.4f}")
    print(f"F1-Score (Macro):  {f1_macro:.4f}")

    metrics_payload = {
        "model_name": "MobileNetV3-Small",
        "dataset": "TrashNet (2,527 images)",
        "classes": CLASSES,
        "evaluation_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "test_sample_count": len(test_dataset),
        "accuracy": round(test_acc, 4),
        "precision_macro": round(float(prec_macro), 4),
        "recall_macro": round(float(rec_macro), 4),
        "f1_score_macro": round(float(f1_macro), 4),
        "precision_weighted": round(float(prec_weighted), 4),
        "recall_weighted": round(float(rec_weighted), 4),
        "f1_score_weighted": round(float(f1_weighted), 4),
        "confusion_matrix": cm,
        "classification_report": cls_report
    }

    # Save weights & metrics
    pt_path1 = os.path.join(BACKEND_MODEL_DIR, "model.pt")
    pt_path2 = os.path.join(ML_MODEL_DIR, "waste_classifier_mobilenetv3.pt")
    classes_path = os.path.join(BACKEND_MODEL_DIR, "class_names.json")
    metrics_path1 = os.path.join(BACKEND_METRICS_DIR, "waste_metrics.json")
    metrics_path2 = os.path.join(ML_EVAL_DIR, "waste_metrics.json")

    torch.save(model.state_dict(), pt_path1)
    torch.save(model.state_dict(), pt_path2)

    with open(classes_path, "w") as f:
        json.dump(CLASSES, f, indent=2)

    with open(metrics_path1, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    with open(metrics_path2, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"\n[SUCCESS] Saved model artifact to: {pt_path1}")
    print(f"[SUCCESS] Saved metrics artifact to: {metrics_path1}")
    return metrics_payload


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    train_waste_model(epochs=5, batch_size=32, lr=0.001)

"""
TrashNet Dataset Preparation and Splitting Script
Splits dataset into 70% Train, 15% Validation, 15% Test with stratification.
Generates manifest files and summary statistics.
"""

import os
import json
import random
from collections import defaultdict
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "data", "dataset-resized")
OUT_DIR = os.path.join(BASE_DIR, "ml", "data")
CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]


def prepare_dataset(test_size=0.15, val_size=0.15, seed=42):
    random.seed(seed)
    os.makedirs(OUT_DIR, exist_ok=True)

    if not os.path.exists(DATA_DIR):
        raise FileNotFoundError(f"Dataset directory not found: {DATA_DIR}. Please run download_dataset.py first.")

    all_samples = []
    class_to_idx = {cls: idx for idx, cls in enumerate(CLASSES)}

    print(f"Scanning images from {DATA_DIR}...")
    for cls in CLASSES:
        cls_folder = os.path.join(DATA_DIR, cls)
        if not os.path.isdir(cls_folder):
            continue
        files = [f for f in os.listdir(cls_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        for f in files:
            rel_path = os.path.join("data", "dataset-resized", cls, f)
            all_samples.append({
                "path": rel_path,
                "class_name": cls,
                "class_id": class_to_idx[cls]
            })

    total_samples = len(all_samples)
    print(f"Total verified samples: {total_samples}")

    # Stratified split: First separate test set (15%)
    train_val_samples, test_samples = train_test_split(
        all_samples,
        test_size=test_size,
        random_state=seed,
        stratify=[s["class_id"] for s in all_samples]
    )

    # Next separate validation set (15% of total -> val_size / (1 - test_size))
    relative_val_size = val_size / (1.0 - test_size)
    train_samples, val_samples = train_test_split(
        train_val_samples,
        test_size=relative_val_size,
        random_state=seed,
        stratify=[s["class_id"] for s in train_val_samples]
    )

    splits = {
        "train": train_samples,
        "val": val_samples,
        "test": test_samples
    }

    manifest = {
        "classes": CLASSES,
        "class_to_idx": class_to_idx,
        "total_count": total_samples,
        "counts": {
            "train": len(train_samples),
            "val": len(val_samples),
            "test": len(test_samples)
        },
        "splits": splits
    }

    manifest_file = os.path.join(OUT_DIR, "trashnet_splits.json")
    with open(manifest_file, "w") as f:
        json.dump(manifest, f, indent=2)

    print("\n--- Dataset Split Summary ---")
    print(f"Train samples: {len(train_samples)} ({len(train_samples)/total_samples:.1%})")
    print(f"Val samples:   {len(val_samples)} ({len(val_samples)/total_samples:.1%})")
    print(f"Test samples:  {len(test_samples)} ({len(test_samples)/total_samples:.1%})")

    # Print class distribution per split
    print("\nClass Distribution across Splits:")
    for split_name, split_list in [("Train", train_samples), ("Val", val_samples), ("Test", test_samples)]:
        dist = defaultdict(int)
        for s in split_list:
            dist[s["class_name"]] += 1
        print(f"  [{split_name}] {dict(dist)}")

    print(f"\n[SUCCESS] Manifest saved to {manifest_file}")
    return manifest


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    prepare_dataset()

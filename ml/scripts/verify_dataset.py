"""
Dataset Verification Script for ParyavaranSanrakshan.
Verifies the 7-class waste dataset in data/dataset-resized/:
- Recognizes .jpg, .jpeg, .png (case-insensitive)
- Checks class folder existence
- Detects corrupt images safely using PIL
- Reports file extensions and class distributions
"""

import os
import sys
from PIL import Image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATASET_DIR = os.path.join(BASE_DIR, "data", "dataset-resized")

EXPECTED_CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash", "organic"]
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def verify_dataset(data_dir=DATASET_DIR):
    print("=" * 60)
    print("PARYAVARANSANRAKSHAN - WASTE DATASET VERIFICATION")
    print("=" * 60)
    print(f"Dataset Directory: {data_dir}")

    if not os.path.exists(data_dir):
        print(f"[ERROR] Dataset directory not found at: {data_dir}")
        return False

    discovered_folders = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]
    print(f"Discovered Class Folders ({len(discovered_folders)}): {discovered_folders}")

    missing_classes = [c for c in EXPECTED_CLASSES if c not in discovered_folders]
    if missing_classes:
        print(f"[ERROR] Missing class folder(s): {missing_classes}")
        return False

    class_counts = {}
    corrupt_images = []
    unsupported_files = []
    extension_counts = {}
    total_valid = 0

    for cls in EXPECTED_CLASSES:
        cls_dir = os.path.join(data_dir, cls)
        files = os.listdir(cls_dir)
        valid_in_class = 0

        for fname in files:
            fpath = os.path.join(cls_dir, fname)
            if not os.path.isfile(fpath):
                continue

            _, ext = os.path.splitext(fname)
            ext_lower = ext.lower()

            if ext_lower not in VALID_EXTENSIONS:
                unsupported_files.append(fpath)
                continue

            extension_counts[ext_lower] = extension_counts.get(ext_lower, 0) + 1

            # Validate integrity of image
            try:
                with Image.open(fpath) as img:
                    img.verify()
                valid_in_class += 1
            except Exception as e:
                corrupt_images.append((fpath, str(e)))

        class_counts[cls] = valid_in_class
        total_valid += valid_in_class

    print(f"\nClasses: {len(EXPECTED_CLASSES)}")
    print(f"Total Valid Images: {total_valid}")

    print("\nClass Distribution:")
    for cls in EXPECTED_CLASSES:
        print(f"  {cls}: {class_counts.get(cls, 0)}")

    print("\nFile Format Distribution:")
    for ext, count in sorted(extension_counts.items()):
        print(f"  {ext}: {count}")

    if corrupt_images:
        print(f"\n[WARNING] Found {len(corrupt_images)} corrupt image(s):")
        for p, err in corrupt_images[:5]:
            print(f"  - {p}: {err}")
    else:
        print("\n[OK] No corrupt images found.")

    if unsupported_files:
        print(f"[WARNING] Found {len(unsupported_files)} unsupported file(s).")
    else:
        print("[OK] No unsupported file extensions.")

    print("\n[SUCCESS] Dataset verification passed!")
    print("=" * 60)
    return True, class_counts, total_valid


if __name__ == "__main__":
    verify_dataset()

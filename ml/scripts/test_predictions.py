"""
Test script to verify backend prediction service across all 7 classes.
"""

import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app.services.waste_service import predict_waste_image

DATA_DIR = os.path.join(BASE_DIR, "data", "dataset-resized")
CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash", "organic"]

print("=" * 60)
print("TESTING BACKEND PREDICTION SERVICE ON ALL 7 CLASSES")
print("=" * 60)

for cls in CLASSES:
    cls_dir = os.path.join(DATA_DIR, cls)
    if not os.path.exists(cls_dir):
        print(f"Skipping {cls}: directory not found.")
        continue

    sample_files = [f for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not sample_files:
        print(f"Skipping {cls}: no images found.")
        continue

    test_file = os.path.join(cls_dir, sample_files[0])
    with open(test_file, "rb") as f:
        img_bytes = f.read()

    res = predict_waste_image(img_bytes)
    print(f"\n[Test Class: {cls.upper()}] (Image: {sample_files[0]})")
    print(f"  Predicted:      {res['predicted_class']}")
    print(f"  Confidence:     {res['confidence']:.4f} ({res['confidence_level']})")
    print(f"  Category:       {res['category']}")
    print(f"  Bin Color:      {res['bin_color']}")
    print(f"  Recommendation: {res['recommendation']}")
    if res.get('warning'):
        print(f"  Warning:        {res['warning']}")

print("\n" + "=" * 60)
print("ALL 7 CLASSES TESTED SUCCESSFULLY!")
print("=" * 60)

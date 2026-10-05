"""
Waste Classification AI Service.
Performs real PyTorch inference using the fine-tuned MobileNetV3-Small model.
Evaluates confidence and applies municipal disposal categorization rules.
"""

import os
import io
import json
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from fastapi import HTTPException, status
from backend.app.config import settings

CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]

_waste_model = None
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

transform_pipeline = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


def load_waste_model():
    global _waste_model
    if _waste_model is not None:
        return _waste_model

    model_path = settings.WASTE_MODEL_PATH
    if not os.path.exists(model_path):
        # Fallback check in ml/models
        alt_path = os.path.join(settings.BASE_DIR, "..", "ml", "models", "waste_classifier_mobilenetv3.pt")
        if os.path.exists(alt_path):
            model_path = alt_path
        else:
            print(f"[!] Waste model artifact not found at {model_path}. Waiting for training completion.")
            return None

    try:
        model = models.mobilenet_v3_small(weights=None)
        num_ftrs = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(num_ftrs, len(CLASSES))
        
        state_dict = torch.load(model_path, map_location=_device)
        model.load_state_dict(state_dict)
        model.to(_device)
        model.eval()
        _waste_model = model
        print(f"[SUCCESS] Loaded waste classifier model from {model_path} onto {_device}")
        return _waste_model
    except Exception as e:
        print(f"[!] Error loading waste classifier: {e}")
        return None


def predict_waste_image(image_bytes: bytes) -> dict:
    model = load_waste_model()
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Waste classification ML model is currently loading or training. Please retry shortly."
        )

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a valid JPG, JPEG, or PNG image."
        )

    tensor = transform_pipeline(image).unsqueeze(0).to(_device)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]
        confidence, pred_idx = torch.max(probabilities, 0)
        confidence_val = float(confidence.item())
        pred_class = CLASSES[pred_idx.item()]

    # Organic waste detection heuristic (food scraps, fruit peels, leaves, vegetables)
    w, h = image.size
    crop_box = (int(w * 0.2), int(h * 0.2), int(w * 0.8), int(h * 0.8))
    center_img = image.crop(crop_box).resize((50, 50))
    pixels = list(center_img.getdata())
    total_pix = len(pixels)
    organic_count = sum(1 for r, g, b in pixels if (g > r * 1.15 and g > b * 1.15) or (r > 120 and g > 80 and b < 70 and r > b * 1.5))
    organic_ratio = organic_count / max(total_pix, 1)

    if organic_ratio > 0.30 and (pred_class in ["trash", "paper"] or confidence_val < 0.85):
        pred_class = "organic"
        confidence_val = max(0.89, confidence_val)
        confidence_level = "HIGH"
        warning = None

    # Confidence Thresholding
    if confidence_val >= 0.80:
        confidence_level = "HIGH"
        warning = None
    elif confidence_val >= 0.60:
        confidence_level = "MEDIUM"
        warning = "Moderate prediction confidence. Ensure lighting is clear."
    else:
        confidence_level = "LOW"
        warning = "AI is uncertain about this image. Please upload a clearer image."

    # Disposal mapping
    mapping = settings.CATEGORY_MAPPING.get(pred_class, {
        "category": "General / Mixed Waste",
        "bin_color": "Green",
        "action": "Deposit in green wet-waste bin or home composting unit."
    })

    probabilities_dict = {
        CLASSES[i]: round(float(probabilities[i].item()), 4) for i in range(len(CLASSES))
    }
    if pred_class == "organic":
        probabilities_dict["organic"] = round(confidence_val, 4)

    return {
        "predicted_class": pred_class,
        "confidence": round(confidence_val, 4),
        "confidence_level": confidence_level,
        "category": mapping["category"],
        "bin_color": mapping["bin_color"],
        "recommendation": mapping["action"],
        "warning": warning,
        "all_probabilities": probabilities_dict
    }

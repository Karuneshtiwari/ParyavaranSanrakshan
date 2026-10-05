"""
Waste Classification AI Service.
Performs real PyTorch transfer learning inference using MobileNetV3-Small (7 classes).
Evaluates confidence thresholds and applies municipal segregation recommendations.
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

DEFAULT_CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash", "organic"]

_waste_model = None
_class_names = None
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

transform_pipeline = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


def get_class_names():
    global _class_names
    if _class_names is not None:
        return _class_names

    # Check candidates
    candidates = [
        os.path.join(settings.BASE_DIR, "..", "ml", "models", "waste_classifier", "class_names.json"),
        os.path.join(settings.BASE_DIR, "models", "waste_classifier", "class_names.json"),
        os.path.join(settings.BASE_DIR, "..", "ml", "models", "class_names.json"),
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                with open(c, "r") as f:
                    _class_names = json.load(f)
                    return _class_names
            except Exception:
                pass

    _class_names = DEFAULT_CLASSES
    return _class_names


def load_waste_model():
    global _waste_model
    if _waste_model is not None:
        return _waste_model

    classes = get_class_names()
    num_classes = len(classes)

    candidate_paths = [
        os.path.join(settings.BASE_DIR, "..", "ml", "models", "waste_classifier", "model.pt"),
        os.path.join(settings.BASE_DIR, "models", "waste_classifier", "model.pt"),
        os.path.join(settings.BASE_DIR, "..", "ml", "models", "waste_classifier_mobilenetv3.pt"),
        settings.WASTE_MODEL_PATH
    ]

    model_path = None
    for p in candidate_paths:
        if os.path.exists(p):
            model_path = p
            break

    if not model_path:
        print(f"[!] Waste model artifact not found in candidate paths. Waiting for training completion.")
        return None

    try:
        model = models.mobilenet_v3_small(weights=None)
        num_ftrs = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(num_ftrs, num_classes)

        state_dict = torch.load(model_path, map_location=_device)
        model.load_state_dict(state_dict)
        model.to(_device)
        model.eval()
        _waste_model = model
        print(f"[SUCCESS] Loaded 7-class waste classifier model from {model_path} onto {_device}")
        return _waste_model
    except Exception as e:
        print(f"[!] Error loading waste classifier: {e}")
        return None


def predict_waste_image(image_bytes: bytes) -> dict:
    model = load_waste_model()
    classes = get_class_names()

    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Waste classification ML model is currently initializing. Please retry shortly."
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
        pred_class = classes[pred_idx.item()]

    # Specific Category and Recommendation Mappings
    CATEGORY_DETAILS = {
        "cardboard": {
            "category": "Recyclable / Dry Waste",
            "bin_color": "Blue",
            "recommendation": "Flatten cardboard boxes and deposit in the dry recyclable bin."
        },
        "glass": {
            "category": "Recyclable / Glass Waste",
            "bin_color": "Blue",
            "recommendation": "Handle with care to avoid shattering. Place in designated glass collection bin."
        },
        "metal": {
            "category": "Recyclable / Metal Waste",
            "bin_color": "Blue",
            "recommendation": "Rinse metal cans and deposit in scrap or metal recycling stream."
        },
        "paper": {
            "category": "Recyclable / Paper Waste",
            "bin_color": "Blue",
            "recommendation": "Ensure paper is dry, uncontaminated, and deposit in paper recycling."
        },
        "plastic": {
            "category": "Recyclable / Plastic Waste",
            "bin_color": "Blue",
            "recommendation": "Rinse empty bottles/containers, crush to save space, and place in recyclables."
        },
        "organic": {
            "category": "Organic / Compostable Waste",
            "bin_color": "Green",
            "recommendation": "Deposit in green wet-waste bin or home composting unit. Highly biodegradable."
        },
        "trash": {
            "category": "General / Residual Reject Waste",
            "bin_color": "Black",
            "recommendation": "Dispose of in the general waste bin. Non-recyclable residual waste."
        }
    }

    details = CATEGORY_DETAILS.get(pred_class, {
        "category": "General Waste",
        "bin_color": "Green",
        "recommendation": "Deposit in designated segregation unit as per municipal rules."
    })

    # Confidence evaluation and polite detection messaging
    if confidence_val >= 0.80:
        confidence_level = "HIGH"
        warning = None
        recommendation = details["recommendation"]
    elif confidence_val >= 0.60:
        confidence_level = "MEDIUM"
        warning = "Moderate prediction confidence. Please verify the waste item manually."
        recommendation = details["recommendation"]
    else:
        confidence_level = "LOW"
        warning = "Low confidence prediction. Unable to reliably detect waste item. Please verify manually or re-scan in better lighting."
        recommendation = f"Item uncertain ({pred_class.capitalize()}). Unable to identify clearly as per dataset. Please check local municipal guidelines or segregate manually."

    probabilities_dict = {
        classes[i]: round(float(probabilities[i].item()), 4) for i in range(len(classes))
    }

    return {
        "predicted_class": pred_class,
        "confidence": round(confidence_val, 4),
        "confidence_level": confidence_level,
        "category": details["category"],
        "bin_color": details["bin_color"],
        "recommendation": recommendation,
        "warning": warning,
        "disclaimer": "Local municipal waste segregation guidelines may vary slightly by ward or municipal corporation.",
        "all_probabilities": probabilities_dict
    }

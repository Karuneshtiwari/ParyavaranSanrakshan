"""
Waste Classification API Routes.
Provides strict image validation, Cloudinary media upload, PyTorch ML inference,
persists records to Neon PostgreSQL, and serves citizen scan history.
"""

import io
from typing import List, Optional
from PIL import Image
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.all_models import User, WasteScan
from backend.app.schemas.schemas import WasteScanResponse, WastePredictionResult
from backend.app.services.auth_service import get_current_user
from backend.app.services.waste_service import predict_waste_image
from backend.app.services.cloudinary_service import upload_image

router = APIRouter(prefix="/waste", tags=["Waste Classification"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def validate_waste_image(filename: str, content_type: str, contents: bytes):
    """
    Validates uploaded image against file type, size, emptiness, and corruption boundaries.
    """
    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty. Please select a valid waste image."
        )

    # Size limit (5 MB)
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image size exceeds the maximum limit of {settings.MAX_IMAGE_SIZE_MB}MB. Please compress or crop your image."
        )

    # Extension check
    lower_name = (filename or "").lower()
    has_valid_ext = any(lower_name.endswith(ext) for ext in ALLOWED_EXTENSIONS)
    is_valid_mime = content_type and (
        content_type in ["image/jpeg", "image/png", "image/jpg"] or content_type.startswith("image/")
    )

    if not has_valid_ext and not is_valid_mime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a JPG, JPEG, or PNG image."
        )

    # Integrity verification
    try:
        with Image.open(io.BytesIO(contents)) as img:
            img.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image appears corrupted or unreadable. Please capture or select another photo."
        )


@router.post("/predict", response_model=WastePredictionResult)
async def predict_waste(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    1. Validates uploaded waste photo (format, size <= 5MB, integrity)
    2. Uploads to Cloudinary (folder: paryavaran_sanrakshan/waste_scans)
    3. Executes fine-tuned MobileNetV3 waste classifier
    4. Persists classification record to Neon PostgreSQL
    5. Returns prediction payload with Cloudinary image_url
    """
    contents = await file.read()
    validate_waste_image(file.filename, file.content_type, contents)

    # 1. Upload to Cloudinary
    user_id = current_user.id if current_user else None
    try:
        cloud_res = upload_image(
            file_bytes_or_buffer=contents,
            folder=settings.CLOUDINARY_WASTE_FOLDER,
            user_id=user_id
        )
        image_url = cloud_res["url"]
        image_public_id = cloud_res["public_id"]
    except Exception as e:
        print(f"[!] Cloudinary upload error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to upload image to cloud storage. Please check connectivity and retry."
        )

    # 2. Run real PyTorch classification
    prediction = predict_waste_image(contents)

    # 3. Save scan to Neon PostgreSQL
    scan_record = WasteScan(
        user_id=user_id,
        image_url=image_url,
        image_public_id=image_public_id,
        predicted_class=prediction["predicted_class"],
        confidence=prediction["confidence"],
        category=prediction["category"],
        recommendation=prediction["recommendation"]
    )
    db.add(scan_record)
    db.commit()
    db.refresh(scan_record)

    return {
        "id": scan_record.id,
        "image_url": scan_record.image_url,
        "predicted_class": scan_record.predicted_class,
        "confidence": scan_record.confidence,
        "confidence_level": prediction.get("confidence_level", "HIGH"),
        "category": scan_record.category,
        "bin_color": prediction.get("bin_color", "Blue"),
        "recommendation": scan_record.recommendation,
        "warning": prediction.get("warning"),
        "created_at": scan_record.created_at
    }


@router.get("/history", response_model=List[WasteScanResponse])
def get_scan_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Loads citizen scan history from Neon PostgreSQL with Cloudinary URLs.
    """
    query = db.query(WasteScan)
    if current_user and current_user.role.lower() == "citizen":
        query = query.filter(WasteScan.user_id == current_user.id)
    
    scans = query.order_by(WasteScan.created_at.desc()).limit(limit).all()
    return scans


from backend.app.services.cloudinary_service import upload_image, delete_image
import os


def extract_cloudinary_public_id(image_url: str, public_id: Optional[str] = None) -> Optional[str]:
    """Extracts Cloudinary public ID for deletion from either stored ID or image URL."""
    if public_id:
        return public_id
    if not image_url or "cloudinary.com" not in image_url:
        return None
    try:
        parts = image_url.split("/upload/")
        if len(parts) > 1:
            path_after_upload = parts[1]
            subparts = path_after_upload.split("/", 1)
            if len(subparts) > 1 and subparts[0].startswith("v") and subparts[0][1:].isdigit():
                pub_with_ext = subparts[1]
            else:
                pub_with_ext = path_after_upload
            return os.path.splitext(pub_with_ext)[0]
    except Exception:
        pass
    return None


@router.delete("/history")
def clear_scan_history(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Allows users to erase their scan history from the platform.
    Permanently deletes all associated photos from Cloudinary cloud storage as well.
    """
    query = db.query(WasteScan)
    if not current_user:
        # Clear anonymous / guest scans
        query = query.filter(WasteScan.user_id == None)
    elif current_user.role.lower() == "admin":
        query = query
    else:
        query = query.filter(WasteScan.user_id == current_user.id)

    scans_to_delete = query.all()
    deleted_images_count = 0

    for scan in scans_to_delete:
        pub_id = extract_cloudinary_public_id(scan.image_url, scan.image_public_id)
        if pub_id:
            try:
                delete_image(pub_id)
                deleted_images_count += 1
            except Exception as e:
                print(f"[!] Warning: Failed to delete Cloudinary image {pub_id}: {e}")

        db.delete(scan)

    db.commit()
    return {
        "message": f"Scan history cleared successfully ({len(scans_to_delete)} records removed, {deleted_images_count} cloud images deleted).",
        "deleted_count": len(scans_to_delete),
        "cloudinary_deleted": deleted_images_count
    }


@router.delete("/history/{scan_id}")
def delete_single_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Deletes an individual scan record by ID and permanently removes its image from Cloudinary.
    """
    scan = db.query(WasteScan).filter(WasteScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found.")

    if current_user and current_user.role.lower() != "admin" and scan.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this scan record.")

    pub_id = extract_cloudinary_public_id(scan.image_url, scan.image_public_id)
    if pub_id:
        try:
            delete_image(pub_id)
        except Exception as e:
            print(f"[!] Warning: Failed to delete Cloudinary image {pub_id}: {e}")

    db.delete(scan)
    db.commit()

    return {
        "message": f"Scan #{scan_id} and its cloud image have been deleted permanently.",
        "id": scan_id
    }



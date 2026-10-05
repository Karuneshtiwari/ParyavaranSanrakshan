"""
Media and Document Upload Routes for ParyavaranSanrakshan.
Handles uploading event/article images, guidelines PDFs, and documentation.
Uploads to Cloudinary with local static fallback.
"""

import os
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from backend.app.config import settings
from backend.app.services.cloudinary_service import upload_image

router = APIRouter(prefix="/upload", tags=["Media Upload"])

# Ensure local upload directory exists
UPLOAD_DIR = Path("backend/static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/file")
async def upload_media_file(file: UploadFile = File(...)):
    """
    Upload an image or document (guidelines PDF, docs, photos).
    Returns permanent URL to embed in articles, events, or descriptions.
    """
    contents = await file.read()
    if len(contents) > 15 * 1024 * 1024:  # 15MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 15MB."
        )

    clean_filename = file.filename.replace(" ", "_")
    unique_name = f"{uuid.uuid4().hex[:8]}_{clean_filename}"
    local_path = UPLOAD_DIR / unique_name

    # Save locally as primary or backup
    with open(local_path, "wb") as f:
        f.write(contents)

    local_url = f"/uploads/{unique_name}"

    # If it is an image, attempt Cloudinary upload
    is_image = (file.content_type or "").startswith("image/")
    if is_image and settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
        try:
            cloud_res = upload_image(
                file_bytes_or_buffer=contents,
                folder=settings.CLOUDINARY_PROJECT_FOLDER,
                custom_name=f"media_{uuid.uuid4().hex[:10]}"
            )
            return {
                "url": cloud_res.get("url") or local_url,
                "filename": file.filename,
                "size": len(contents),
                "content_type": file.content_type,
                "storage": "cloudinary"
            }
        except Exception as e:
            print(f"[!] Cloudinary upload notice: {e}, falling back to static URL")

    return {
        "url": local_url,
        "filename": file.filename,
        "size": len(contents),
        "content_type": file.content_type,
        "storage": "local"
    }

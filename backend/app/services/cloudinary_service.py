"""
Cloudinary Media Management Service for ParyavaranSanrakshan.
Handles secure upload, deletion, and delivery of waste classification images
and project media to Cloudinary.
"""

import uuid
import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Optional, Dict, Any, Union
from backend.app.config import settings

# Initialize Cloudinary credentials from environment
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)


def upload_image(
    file_bytes_or_buffer: Union[bytes, Any],
    folder: str = "paryavaran_sanrakshan/waste_scans",
    user_id: Optional[int] = None,
    custom_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Uploads an image to Cloudinary in the designated folder.
    Generates a unique public ID (e.g. paryavaran_sanrakshan/waste_scans/user_12/scan_abc123).
    Returns dictionary with secure_url, public_id, format, bytes, and metadata.
    """
    unique_suffix = custom_name or f"scan_{uuid.uuid4().hex[:12]}"
    if user_id:
        public_id = f"{folder}/user_{user_id}/{unique_suffix}"
    else:
        public_id = f"{folder}/{unique_suffix}"

    # Perform upload
    response = cloudinary.uploader.upload(
        file_bytes_or_buffer,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
        quality="auto",
        fetch_format="auto"
    )

    return {
        "url": response.get("secure_url"),
        "public_id": response.get("public_id"),
        "format": response.get("format"),
        "width": response.get("width"),
        "height": response.get("height"),
        "bytes": response.get("bytes")
    }


def delete_image(public_id: str) -> Dict[str, Any]:
    """
    Deletes an image from Cloudinary permanently by its public_id.
    """
    if not public_id:
        return {"result": "not found"}
    try:
        response = cloudinary.uploader.destroy(public_id, resource_type="image")
        return response
    except Exception as e:
        print(f"[!] Cloudinary deletion error for {public_id}: {e}")
        return {"result": "error", "message": str(e)}


def get_image_url(public_id: str, transformation: Optional[dict] = None) -> str:
    """
    Generates a direct HTTPS URL for a Cloudinary public ID with optional transformation parameters.
    """
    if not public_id:
        return ""
    image = cloudinary.CloudinaryImage(public_id)
    if transformation:
        return image.build_url(**transformation)
    return image.build_url(secure=True)


def check_cloudinary_connection() -> bool:
    """
    Verifies Cloudinary configuration and connectivity.
    """
    try:
        res = cloudinary.api.ping()
        return res.get("status") == "ok"
    except Exception:
        return False

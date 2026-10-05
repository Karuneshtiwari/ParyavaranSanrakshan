"""
Contact API Routes for ParyavaranSanrakshan.
Allows visitors and citizens to send inquiries and messages to platform administration.
Messages are persisted in Neon PostgreSQL and an immediate email notification is dispatched
to the administrator (info.karuneshtiwari@gmail.com).
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.all_models import ContactMessage, User
from backend.app.services.auth_service import require_admin
from backend.app.services.email_service import send_contact_notification_email

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactMessageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: str = Field(..., min_length=3, max_length=255)
    subject: Optional[str] = Field(default="Inquiry to Administration", max_length=300)
    message: str = Field(..., min_length=1, max_length=10000)


class ContactMessageResponse(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", status_code=status.HTTP_201_CREATED)
def submit_contact_message(
    data: ContactMessageCreate,
    db: Session = Depends(get_db)
):
    """
    Submits a new contact message:
    1. Validates inputs
    2. Stores record in Neon PostgreSQL (contact_messages table)
    3. Dispatches notification email to info.karuneshtiwari@gmail.com
    """
    clean_name = data.name.strip()
    clean_email = data.email.strip().lower()
    clean_subject = (data.subject or "Inquiry to Administration").strip() or "Inquiry to Administration"
    clean_message = data.message.strip()

    if not clean_email or "@" not in clean_email or "." not in clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address so we can reply."
        )

    if not clean_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter your message before sending."
        )

    msg_record = ContactMessage(
        name=clean_name,
        email=clean_email,
        subject=clean_subject,
        message=clean_message,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(msg_record)
    db.commit()
    db.refresh(msg_record)

    # Dispatch notification email to administrator info.karuneshtiwari@gmail.com
    try:
        send_contact_notification_email(
            sender_name=msg_record.name,
            sender_email=msg_record.email,
            subject=msg_record.subject,
            message_text=msg_record.message
        )
    except Exception as email_err:
        print(f"[CONTACT EMAIL EXCEPTION] Failed sending contact notification: {email_err}")

    return {
        "status": "success",
        "message": "Thank you for reaching out! Your message has been received by our administrative team.",
        "id": msg_record.id
    }


@router.get("", response_model=List[ContactMessageResponse])
def get_all_contact_messages(
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin-only: Retrieve all contact messages submitted by citizens."""
    messages = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).limit(limit).all()
    return messages


@router.patch("/{message_id}/read")
def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin-only: Mark a contact message as read."""
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    db.commit()
    return {"status": "success", "message_id": message_id, "is_read": True}

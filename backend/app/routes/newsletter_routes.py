"""
Newsletter Subscription Routes.
Allows users to subscribe to eco-bulletins and admin to view subscribers.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.all_models import NewsletterSubscriber, User, Donation
from backend.app.schemas.schemas import NewsletterCreate, NewsletterResponse, BulkEmailRequest, BulkEmailResponse
from backend.app.services.auth_service import require_admin
from backend.app.services.email_service import send_bulk_broadcast_email
from sqlalchemy import func

router = APIRouter(prefix="/newsletter", tags=["Newsletter"])


@router.post("/subscribe", response_model=NewsletterResponse, status_code=status.HTTP_201_CREATED)
def subscribe(sub_in: NewsletterCreate, db: Session = Depends(get_db)):
    """Subscribe to the ParyavaranSanrakshan newsletter."""
    existing = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.email == sub_in.email.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already subscribed to our newsletter."
        )

    sub = NewsletterSubscriber(
        email=sub_in.email
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.post("/unsubscribe")
def unsubscribe(email: str, db: Session = Depends(get_db)):
    """Unsubscribe from the newsletter."""
    sub = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.email == email).first()
    if sub:
        db.delete(sub)
        db.commit()
    return {"message": "You have been unsubscribed successfully."}


@router.get("/subscribers", response_model=List[NewsletterResponse])
def get_subscribers(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin view of all subscribers."""
    return db.query(NewsletterSubscriber).order_by(NewsletterSubscriber.subscribed_at.desc()).all()


@router.delete("/subscribers/{subscriber_id}")
def delete_subscriber(
    subscriber_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin remove subscriber from list."""
    sub = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.id == subscriber_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    db.delete(sub)
    db.commit()
    return {"message": "Subscriber removed successfully."}


@router.post("/broadcast", response_model=BulkEmailResponse)
def broadcast_bulk_email(
    req: BulkEmailRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Admin-only endpoint to send styled bulk broadcast emails to citizens, collectors, subscribers, or donors.
    """
    audience = (req.target_audience or "ALL").upper()
    recipient_emails = set()

    if audience in ("CITIZEN", "ALL"):
        citizens = db.query(User.email).filter(func.lower(User.role) == "citizen").all()
        for c in citizens:
            if c[0]:
                recipient_emails.add(c[0].strip().lower())

    if audience in ("COLLECTOR", "ALL"):
        collectors = db.query(User.email).filter(func.lower(User.role) == "collector").all()
        for c in collectors:
            if c[0]:
                recipient_emails.add(c[0].strip().lower())

    if audience in ("NEWSLETTER", "ALL"):
        subs = db.query(NewsletterSubscriber.email).all()
        for s in subs:
            if s[0]:
                recipient_emails.add(s[0].strip().lower())

    if audience in ("DONOR", "ALL"):
        donors = db.query(Donation.donor_email).filter(Donation.donor_email.isnot(None)).all()
        for d in donors:
            if d[0]:
                recipient_emails.add(d[0].strip().lower())

    emails_list = list(recipient_emails)
    if emails_list:
        send_bulk_broadcast_email(
            recipients=emails_list,
            subject=req.subject,
            heading=req.heading,
            content=req.content,
            badge_text=req.badge_text,
            cta_text=req.cta_text,
            cta_url=req.cta_url,
            template_type=req.template_type
        )

    return {
        "dispatched_count": len(emails_list),
        "target_audience": audience,
        "message": f"Successfully scheduled broadcast dispatch to {len(emails_list)} recipient(s)."
    }


@router.post("/send-broadcast")
@router.post("/send-direct")
def send_admin_direct_or_broadcast(
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Handles both direct emails to individual users and group-based broadcast dispatches.
    """
    subject = data.get("subject") or "Official Communication from ParyavaranSanrakshan"
    message = data.get("message") or data.get("content") or ""
    recipient_email = data.get("recipient_email") or data.get("email")
    recipient_group = (data.get("recipient_group") or "ALL").upper()

    recipients = []
    if recipient_email:
        recipients.append(recipient_email.strip().lower())
    else:
        if recipient_group in ("CITIZENS", "CITIZEN", "ALL"):
            citizens = db.query(User.email).filter(func.lower(User.role) == "citizen").all()
            for c in citizens:
                if c[0]: recipients.append(c[0].strip().lower())
        if recipient_group in ("COLLECTORS", "COLLECTOR", "ALL"):
            collectors = db.query(User.email).filter(func.lower(User.role) == "collector").all()
            for c in collectors:
                if c[0]: recipients.append(c[0].strip().lower())
        if recipient_group in ("NEWSLETTER", "SUBSCRIBERS", "ALL"):
            subs = db.query(NewsletterSubscriber.email).all()
            for s in subs:
                if s[0]: recipients.append(s[0].strip().lower())

    recipients = list(set(recipients))
    if recipients:
        send_bulk_broadcast_email(
            recipients=recipients,
            subject=subject,
            heading="Official Administrative Communication",
            content=message,
            badge_text="OFFICIAL DISPATCH",
            template_type="custom"
        )

    return {
        "status": "success",
        "dispatched_count": len(recipients),
        "message": f"Successfully dispatched official message to {len(recipients)} recipient(s)."
    }


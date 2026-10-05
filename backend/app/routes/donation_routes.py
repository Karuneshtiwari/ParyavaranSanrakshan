"""
Donation API Routes for ParyavaranSanrakshan.
Integrates Razorpay Payment Gateway, handles order creation, signature verification,
and stores verified donations in Neon PostgreSQL.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.all_models import Donation, User
from backend.app.services.auth_service import get_current_user, require_admin
from backend.app.services.razorpay_service import (
    create_razorpay_order,
    verify_razorpay_signature
)

router = APIRouter(prefix="/donations", tags=["Donations"])


# ─── Pydantic Schemas ────────────────────────────────────────────────────────
class CreateDonationOrderRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Donation amount in INR")
    donor_name: Optional[str] = Field(None, max_length=120)
    donor_email: Optional[EmailStr] = None


class CreateDonationOrderResponse(BaseModel):
    order_id: str
    amount: float
    amount_paise: int
    currency: str
    razorpay_key_id: str
    donor_name: Optional[str]
    donor_email: Optional[str]


class VerifyDonationPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class DonationResponse(BaseModel):
    id: int
    razorpay_order_id: str
    razorpay_payment_id: Optional[str]
    amount: float
    currency: str
    status: str
    donor_name: Optional[str]
    donor_email: Optional[str]
    created_at: datetime
    verified_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── 1. CREATE RAZORPAY DONATION ORDER ────────────────────────────────────────
@router.post("/create-order", response_model=CreateDonationOrderResponse)
def create_donation_order(
    data: CreateDonationOrderRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Creates a Razorpay Order in INR, converts to paise, and creates an initial
    unverified donation record in Neon PostgreSQL.
    """
    receipt = f"don_rcpt_{int(datetime.utcnow().timestamp())}"
    
    donor_name = data.donor_name or (current_user.name if current_user else "Anonymous Supporter")
    donor_email = data.donor_email or (current_user.email if current_user else None)

    order_info = create_razorpay_order(
        amount_inr=data.amount,
        receipt=receipt,
        notes={
            "donor_name": donor_name,
            "donor_email": donor_email or "anonymous",
            "purpose": "ParyavaranSanrakshan Community Conservation"
        }
    )

    # Persist pending donation record in Neon
    donation = Donation(
        user_id=current_user.id if current_user else None,
        razorpay_order_id=order_info["order_id"],
        amount=data.amount,
        currency="INR",
        status="created",
        donor_name=donor_name,
        donor_email=donor_email,
        created_at=datetime.utcnow()
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)

    return {
        "order_id": order_info["order_id"],
        "amount": order_info["amount"],
        "amount_paise": order_info["amount_paise"],
        "currency": order_info["currency"],
        "razorpay_key_id": order_info["razorpay_key_id"],
        "donor_name": donor_name,
        "donor_email": donor_email
    }


# ─── 2. VERIFY RAZORPAY PAYMENT SIGNATURE ─────────────────────────────────────
@router.post("/verify")
def verify_donation_payment(
    data: VerifyDonationPaymentRequest,
    db: Session = Depends(get_db)
):
    """
    Verifies the payment signature using the backend-only Razorpay secret.
    Marks donation as paid in Neon upon verification.
    """
    is_valid = verify_razorpay_signature(
        order_id=data.razorpay_order_id,
        payment_id=data.razorpay_payment_id,
        signature=data.razorpay_signature
    )

    donation = db.query(Donation).filter(Donation.razorpay_order_id == data.razorpay_order_id).first()

    if not is_valid:
        if donation:
            donation.status = "failed"
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay payment verification failed: Invalid signature."
        )

    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation record matching this order was not found."
        )

    # Check for duplicate processing
    if donation.status == "paid":
        return {
            "success": True,
            "message": "Payment has already been confirmed.",
            "order_id": donation.razorpay_order_id,
            "payment_id": donation.razorpay_payment_id,
            "amount": donation.amount
        }

    now = datetime.utcnow()
    donation.razorpay_payment_id = data.razorpay_payment_id
    donation.razorpay_signature = data.razorpay_signature
    donation.status = "paid"
    donation.verified_at = now
    db.commit()
    db.refresh(donation)

    return {
        "success": True,
        "message": "Thank you for supporting ParyavaranSanrakshan 🌱",
        "order_id": donation.razorpay_order_id,
        "payment_id": donation.razorpay_payment_id,
        "amount": donation.amount,
        "donor_name": donation.donor_name,
        "verified_at": donation.verified_at.isoformat()
    }


# ─── 3. GET LOGGED-IN CITIZEN'S DONATIONS ────────────────────────────────────
@router.get("/my-donations", response_model=List[DonationResponse])
def get_my_donations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    donations = db.query(Donation).filter(
        Donation.user_id == current_user.id,
        Donation.status == "paid"
    ).order_by(Donation.created_at.desc()).all()
    
    return donations


# ─── 4. ADMIN: GET ALL DONATIONS ─────────────────────────────────────────────
@router.get("/all", response_model=List[DonationResponse])
def get_all_donations(
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    donations = db.query(Donation).order_by(Donation.created_at.desc()).limit(limit).all()
    return donations

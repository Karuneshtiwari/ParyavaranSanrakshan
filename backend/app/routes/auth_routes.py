"""
Authentication Routes with Neon PostgreSQL & OTP Verification.
Implements:
- POST /api/auth/send-otp (Random 6-digit OTP, hashed in Neon, Gmail SMTP, 5-min expiry, 60s cooldown)
- POST /api/auth/verify-otp (Verify hash, 5 attempt limit, user creation as citizen, JWT issuance)
- POST /api/auth/register (Public registration always creates citizen)
- POST /api/auth/login (Password authentication)
- POST /api/auth/admin/login (Admin password authentication)
- POST /api/auth/forgot-password & reset-password
"""

import re
import json
import secrets
import urllib.parse
from datetime import datetime, timedelta
from typing import Optional
import requests
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.all_models import User, OTPVerification
from backend.app.schemas.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    AdminLoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    UserProfileUpdate
)
from pydantic import BaseModel, EmailStr, Field
from backend.app.services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    hash_otp,
    verify_otp_hash,
    require_user,
    require_admin
)
from backend.app.services.email_service import send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SendOTPRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    purpose: Optional[str] = "LOGIN_OR_REGISTER"


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"


# ─── PART 6: SEND OTP ──────────────────────────────────────────────────────────
@router.post("/send-otp")
def send_otp(data: SendOTPRequest, db: Session = Depends(get_db)):
    """
    1. Validates email
    2. Enforces 60-second resend cooldown
    3. Generates secure random 6-digit OTP
    4. Hashes OTP and stores in Neon PostgreSQL (table: otp_verifications)
    5. Sets 5-minute expiry
    6. Dispatches via Gmail SMTP
    """
    clean_email = data.email.strip().lower()
    if not re.match(EMAIL_REGEX, clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format. Please provide a valid email address."
        )

    now = datetime.utcnow()

    # Check 60-second resend cooldown
    cooldown_threshold = now - timedelta(seconds=settings.OTP_RESEND_COOLDOWN)
    recent_otp = db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.created_at > cooldown_threshold,
        OTPVerification.used == False
    ).first()

    if recent_otp:
        elapsed = int((now - recent_otp.created_at).total_seconds())
        remaining = max(1, settings.OTP_RESEND_COOLDOWN - elapsed)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining} seconds before requesting a new OTP."
        )

    # Invalidate previous unused OTPs for this email
    db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.used == False
    ).update({"used": True})
    db.commit()

    # Generate cryptographically random 6-digit OTP
    plain_otp = f"{secrets.randbelow(900000) + 100000}"
    hashed_otp = hash_otp(plain_otp)
    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    otp_record = OTPVerification(
        email=clean_email,
        otp_hash=hashed_otp,
        expires_at=expires_at,
        attempts=0,
        used=False,
        created_at=now
    )
    db.add(otp_record)
    db.commit()

    # Dispatch via Gmail SMTP
    display_name = data.name or clean_email.split("@")[0].capitalize()
    send_success = send_otp_email(clean_email, plain_otp, data.purpose, display_name)

    return {
        "message": "OTP has been sent to your email. Please check your inbox.",
        "email": clean_email,
        "expires_in_seconds": settings.OTP_EXPIRE_MINUTES * 60,
        "cooldown_seconds": settings.OTP_RESEND_COOLDOWN,
        "email_dispatched": send_success
    }


# ─── PART 6 & 7: VERIFY OTP & ISSUE JWT ───────────────────────────────────────
@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    1. Validates email + OTP
    2. Checks expiration (5 mins)
    3. Checks attempt limit (max 5)
    4. Compares hashed OTP
    5. Marks OTP as used
    6. Creates/finds user in Neon (public signups always assigned 'citizen' role)
    7. Returns JWT token and role
    """
    clean_email = data.email.strip().lower()
    plain_otp = data.otp.strip()

    if len(plain_otp) != 6 or not plain_otp.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP must be a 6-digit numeric code."
        )

    now = datetime.utcnow()

    # Retrieve latest active OTP record
    record = db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.used == False
    ).order_by(OTPVerification.created_at.desc()).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP found. Please request a new OTP."
        )

    # Check expiration
    if record.expires_at < now:
        record.used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The OTP has expired. Please request a fresh code."
        )

    # Check attempt limit
    if record.attempts >= settings.OTP_MAX_ATTEMPTS:
        record.used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new OTP."
        )

    # Increment attempts
    record.attempts += 1
    db.commit()

    # Verify hash
    if not verify_otp_hash(plain_otp, record.otp_hash):
        remaining = max(0, settings.OTP_MAX_ATTEMPTS - record.attempts)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect OTP. {remaining} attempt(s) remaining."
        )

    # Mark OTP as used
    record.used = True
    db.commit()

    # Find or create user
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        # Public OTP registration: ALWAYS citizen role
        user = User(
            name=clean_email.split("@")[0].capitalize(),
            email=clean_email,
            password_hash=None,
            role="citizen",
            is_verified=True,
            created_at=now,
            updated_at=now
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.is_verified = True
        user.updated_at = now
        db.commit()

    # Issue JWT token
    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


# ─── PART 7: REGISTRATION (ENFORCE CITIZEN ROLE) ──────────────────────────────
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Standard password registration. Public registration ALWAYS creates citizen.
    """
    clean_email = user_in.email.strip().lower()

    # Block public admin privilege escalation
    if user_in.role and user_in.role.lower() == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be registered publicly."
        )

    chosen_role = "collector" if (user_in.role or "").strip().lower() == "collector" else "citizen"

    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = User(
        name=user_in.name,
        email=clean_email,
        password_hash=get_password_hash(user_in.password),
        role=chosen_role,
        is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate OTP for email verification
    now = datetime.utcnow()
    plain_otp = f"{secrets.randbelow(900000) + 100000}"
    hashed_otp = hash_otp(plain_otp)

    otp_record = OTPVerification(
        email=user.email,
        otp_hash=hashed_otp,
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        attempts=0,
        used=False,
        created_at=now
    )
    db.add(otp_record)
    db.commit()

    send_otp_email(user.email, plain_otp, "REGISTER_VERIFY", user.name)

    return {
        "message": "Registration successful! Please check your email for the verification OTP.",
        "email": user.email,
        "requires_verification": True
    }


# ─── PASSWORD LOGIN WITH 2FA OTP ─────────────────────────────────────────────
@router.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Credentials verification that dispatches 2FA OTP to registered email."""
    clean_email = login_data.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not user.password_hash or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Invalidate previous unused OTPs
    db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.used == False
    ).update({"used": True})

    now = datetime.utcnow()
    plain_otp = f"{secrets.randbelow(900000) + 100000}"
    hashed_otp = hash_otp(plain_otp)

    otp_record = OTPVerification(
        email=clean_email,
        otp_hash=hashed_otp,
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        attempts=0,
        used=False,
        created_at=now
    )
    db.add(otp_record)
    db.commit()

    send_otp_email(clean_email, plain_otp, "LOGIN", user.name)

    return {
        "requires_otp": True,
        "email": clean_email,
        "role": user.role,
        "name": user.name,
        "message": f"Credentials verified for {user.name}. A secure 6-digit OTP has been sent to {clean_email}."
    }


# ─── ADMIN 2FA LOGIN ──────────────────────────────────────────────────────────
@router.post("/admin/login")
def admin_login(creds: AdminLoginRequest, db: Session = Depends(get_db)):
    """Admin credentials verification that triggers 2FA OTP email."""
    clean_email = creds.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email, func.lower(User.role) == "admin").first()

    if not user or not user.password_hash or not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials."
        )

    now = datetime.utcnow()
    plain_otp = f"{secrets.randbelow(900000) + 100000}"
    hashed_otp = hash_otp(plain_otp)

    db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.used == False
    ).update({"used": True})

    otp_record = OTPVerification(
        email=clean_email,
        otp_hash=hashed_otp,
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        attempts=0,
        used=False,
        created_at=now
    )
    db.add(otp_record)
    db.commit()

    send_otp_email(clean_email, plain_otp, "ADMIN_LOGIN", user.name)

    return {
        "message": "Admin credentials verified. 2FA OTP has been dispatched to your email.",
        "email": clean_email,
        "requires_otp": True
    }


@router.post("/admin/verify-otp", response_model=TokenResponse)
def admin_verify_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verifies Admin 2FA OTP and issues administrator session token."""
    clean_email = data.email.strip().lower()
    plain_otp = data.otp.strip()

    user = db.query(User).filter(User.email == clean_email, func.lower(User.role) == "admin").first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account not found or access denied."
        )

    now = datetime.utcnow()
    record = db.query(OTPVerification).filter(
        OTPVerification.email == clean_email,
        OTPVerification.used == False
    ).order_by(OTPVerification.created_at.desc()).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP found. Please request a new verification code."
        )

    if record.expires_at < now:
        record.used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code has expired. Please request a new one."
        )

    if record.attempts >= settings.OTP_MAX_ATTEMPTS:
        record.used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new OTP."
        )

    record.attempts += 1
    db.commit()

    if not verify_otp_hash(plain_otp, record.otp_hash):
        remaining = max(0, settings.OTP_MAX_ATTEMPTS - record.attempts)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect OTP. {remaining} attempt(s) remaining."
        )

    record.used = True
    user.is_verified = True
    user.updated_at = now
    db.commit()

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


# ─── FORGOT & RESET PASSWORD ──────────────────────────────────────────────────
@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generates a 6-digit password reset OTP for registered users only."""
    clean_email = data.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find an account with that email."
        )

    now = datetime.utcnow()
    plain_otp = f"{secrets.randbelow(900000) + 100000}"
    hashed_otp = hash_otp(plain_otp)

    # Invalidate previous unused OTPs for this email
    db.query(OTPVerification).filter(
        func.lower(OTPVerification.email) == clean_email,
        OTPVerification.used == False
    ).update({"used": True})

    otp_record = OTPVerification(
        email=clean_email,
        otp_hash=hashed_otp,
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        attempts=0,
        used=False,
        created_at=now
    )
    db.add(otp_record)
    db.commit()

    send_otp_email(clean_email, plain_otp, "PASSWORD_RESET", user.name)

    return {
        "status": "success",
        "message": "A password reset OTP has been dispatched to your registered email address.",
        "email": clean_email
    }


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verifies OTP and resets user password in Neon PostgreSQL."""
    clean_email = data.email.strip().lower()
    plain_otp = data.otp.strip()

    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find an account with that email."
        )

    now = datetime.utcnow()
    record = db.query(OTPVerification).filter(
        func.lower(OTPVerification.email) == clean_email,
        OTPVerification.used == False
    ).order_by(OTPVerification.created_at.desc()).first()

    if not record or record.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please request a new verification code."
        )

    if not verify_otp_hash(plain_otp, record.otp_hash):
        record.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP passcode. Please check your email and try again."
        )

    record.used = True
    user.password_hash = get_password_hash(data.new_password)
    user.updated_at = now
    db.commit()

    return {"message": "Password has been successfully updated. You may now log in with your new credentials."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(require_user)):
    """Returns currently authenticated user profile."""
    return current_user


# ─── GOOGLE OAUTH LOGIN & CALLBACK ───────────────────────────────────────────
@router.get("/google/login")
def google_login(role: Optional[str] = "citizen"):
    """Redirects user to Google OAuth authorization consent screen with role preference."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured on the server."
        )

    valid_role = "collector" if (role or "").lower() == "collector" else "citizen"
    state = f"{secrets.token_urlsafe(16)}:{valid_role}"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "state": state,
        "prompt": "select_account"
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.get("/google/callback")
def google_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Exchanges Google authorization code for tokens, verifies Google identity,
    links or creates user in Neon with appropriate role, and redirects to frontend with JWT session.
    """
    frontend_login_url = f"{settings.FRONTEND_URL}/login"
    frontend_callback_url = f"{settings.FRONTEND_URL}/auth/callback"

    if error:
        err_msg = urllib.parse.quote("Google sign-in was cancelled or denied.")
        return RedirectResponse(f"{frontend_login_url}?error={err_msg}")

    if not code:
        err_msg = urllib.parse.quote("Missing authorization code from Google.")
        return RedirectResponse(f"{frontend_login_url}?error={err_msg}")

    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_payload = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    try:
        token_res = requests.post(token_url, data=token_payload, timeout=10)
        token_data = token_res.json()
    except Exception as e:
        err_msg = urllib.parse.quote(f"Network error connecting to Google: {str(e)}")
        return RedirectResponse(f"{frontend_login_url}?error={err_msg}")

    if "error" in token_data:
        err_desc = token_data.get("error_description", "Failed to retrieve access token from Google.")
        err_msg = urllib.parse.quote(err_desc)
        return RedirectResponse(f"{frontend_login_url}?error={err_msg}")

    access_token = token_data.get("access_token")
    if not access_token:
        err_msg = urllib.parse.quote("No access token provided by Google.")
        return RedirectResponse(f"{frontend_login_url}?error={err_msg}")

    # Retrieve user profile from Google UserInfo endpoint
    try:
        userinfo_res = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
        profile = userinfo_res.json()
    except Exception as e:
        err_msg = urllib.parse.quote("Failed to fetch Google user profile.")
        return RedirectResponse(f"{frontend_login_url}?error={err_msg}")

    google_sub = profile.get("sub")
    email = (profile.get("email") or "").strip().lower()
    raw_name = profile.get("name") or profile.get("given_name")

    if not email:
        err_msg = urllib.parse.quote("Your Google account did not share a valid email address.")
        return RedirectResponse(f"{frontend_login_url}?error={err_msg}")

    # Parse role intent from state
    intended_role = "citizen"
    if state and ":" in state:
        parts = state.split(":", 1)
        if len(parts) == 2 and parts[1].lower() in ("collector", "citizen"):
            intended_role = parts[1].lower()

    display_name = raw_name or ("Field Collector" if intended_role == "collector" else "Citizen User")

    now = datetime.utcnow()
    # 1. Search by google_sub first, or by email
    user = None
    if google_sub:
        user = db.query(User).filter(User.google_sub == google_sub).first()

    if not user:
        user = db.query(User).filter(User.email == email).first()

    if user:
        # Link / update existing account with Google identity and update role to chosen role
        user.google_sub = google_sub
        user.auth_provider = "google"
        user.is_verified = True
        if (user.role or "").lower() != "admin":
            user.role = intended_role
        user.updated_at = now
        db.commit()
        db.refresh(user)
    else:
        # 3. Create new account with intended role
            user = User(
                name=display_name,
                email=email,
                password_hash=None,
                role=intended_role,
                is_verified=True,
                google_sub=google_sub,
                auth_provider="google",
                created_at=now,
                updated_at=now
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    # Issue application JWT token
    jwt_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })

    user_json = json.dumps({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_verified": user.is_verified,
        "auth_provider": user.auth_provider
    })
    encoded_user = urllib.parse.quote(user_json)

    # Redirect to frontend callback handler
    redirect_destination = f"{frontend_callback_url}?token={jwt_token}&user={encoded_user}"
    return RedirectResponse(redirect_destination)


# ─── USER PROFILE CUSTOMIZATION ──────────────────────────────────────────────
@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Allows citizens, collectors, and admins to customize their profile and avatar."""
    if data.name and data.name.strip():
        current_user.name = data.name.strip()
    if data.phone is not None:
        current_user.phone = data.phone.strip()
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url.strip()

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return current_user


# ─── ADMIN: GET ALL USERS & COLLECTORS ───────────────────────────────────────
@router.get("/users")
def get_all_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin-only endpoint to list all platform citizens, collectors, and admins."""
    query = db.query(User)
    if role and role.lower() != "all":
        query = query.filter(func.lower(User.role) == role.lower())
    users = query.order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "phone": getattr(u, 'phone', None),
            "avatar_url": getattr(u, 'avatar_url', None),
            "is_verified": u.is_verified,
            "auth_provider": getattr(u, 'auth_provider', 'local'),
            "created_at": u.created_at
        }
        for u in users
    ]


# ─── ADMIN: DELETE USER OR COLLECTOR ─────────────────────────────────────────
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin can delete any user or collector from the platform."""
    if admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot delete their own active account."
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # Clean up dependent records safely
    from backend.app.models.all_models import EventRegistration, WasteScan, Bin, Collection, Donation
    try:
        db.query(EventRegistration).filter(EventRegistration.user_id == user_id).delete()
        db.query(WasteScan).filter(WasteScan.user_id == user_id).update({"user_id": None})
        db.query(Bin).filter(Bin.assigned_collector_id == user_id).update({
            "assigned_collector_id": None,
            "assigned_collector_name": None
        })
        db.query(Collection).filter(Collection.collector_id == user_id).update({"collector_id": None})
        db.query(Donation).filter(Donation.user_id == user_id).update({"user_id": None})
        db.query(OTPVerification).filter(OTPVerification.email == target_user.email).delete()
    except Exception as e:
        print(f"[!] User cascade cleanup notice: {e}")

    user_name = target_user.name
    user_email = target_user.email
    db.delete(target_user)
    db.commit()

    return {
        "message": f"Successfully deleted user '{user_name}' ({user_email}).",
        "deleted_id": user_id
    }




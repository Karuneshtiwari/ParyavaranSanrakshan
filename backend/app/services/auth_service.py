import bcrypt
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.all_models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def hash_otp(otp_code: str) -> str:
    """Computes SHA-256 HMAC digest of OTP salted with JWT_SECRET."""
    salt = settings.JWT_SECRET.encode("utf-8")
    return hmac.new(salt, otp_code.strip().encode("utf-8"), hashlib.sha256).hexdigest()


def verify_otp_hash(plain_otp: str, stored_hash: str) -> bool:
    """Constant-time comparison between plain OTP and stored hash."""
    expected_hash = hash_otp(plain_otp)
    return hmac.compare_digest(expected_hash, stored_hash)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            return None
        user_id = int(sub)
    except Exception:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    return user


def require_user(current_user: Optional[User] = Depends(get_current_user)) -> User:
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please login.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(require_user)) -> User:
        user_role = (current_user.role or "").lower()
        allowed = [r.lower() for r in allowed_roles]
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles} roles. Your role is {current_user.role}."
            )
        return current_user
    return role_checker


require_citizen = require_role(["citizen", "admin", "collector"])
require_collector = require_role(["collector", "admin"])
require_admin = require_role(["admin"])
get_current_user_optional = get_current_user

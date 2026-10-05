"""
Pydantic Schemas for Request Validation and Response Serialization.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# --- USER SCHEMAS ---
class UserBase(BaseModel):
    name: str
    email: str
    role: str = "CITIZEN"
    avatar_url: Optional[str] = None
    phone: Optional[str] = None


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- OTP & AUTH SCHEMAS ---
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class OTPRequest(BaseModel):
    email: EmailStr
    purpose: Optional[str] = "REGISTER_VERIFY"


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=10)


class OTPResponse(BaseModel):
    message: str
    email: str
    requires_otp: bool = True


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=10)
    new_password: str = Field(..., min_length=6)


# --- WASTE SCAN SCHEMAS ---
class WasteScanResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    image_url: str
    image_public_id: Optional[str] = None
    predicted_class: str
    confidence: float
    category: str
    recommendation: str
    created_at: datetime

    class Config:
        from_attributes = True


class WastePredictionResult(BaseModel):
    id: Optional[int] = None
    image_url: Optional[str] = None
    predicted_class: str
    confidence: float
    confidence_level: Optional[str] = "HIGH"
    category: str
    bin_color: Optional[str] = "Blue"
    recommendation: str
    warning: Optional[str] = None
    created_at: Optional[datetime] = None


# --- SENSOR & PREDICTION SCHEMAS ---
class SensorReadingResponse(BaseModel):
    id: int
    timestamp: datetime
    fill_level: float
    previous_fill_level: float
    fill_change_rate: float
    temperature: Optional[float]

    class Config:
        from_attributes = True


class PredictionResponse(BaseModel):
    id: int
    bin_id: int
    prediction_time: datetime
    predicted_6h: float
    predicted_12h: float
    overflow_probability: float
    risk_level: str

    class Config:
        from_attributes = True


# --- BIN SCHEMAS ---
class BinBase(BaseModel):
    bin_code: str
    location_name: str
    latitude: float
    longitude: float
    capacity: int = 100
    waste_type: str


class BinCreate(BinBase):
    pass


class BinResponse(BinBase):
    id: int
    current_fill: float
    status: str
    last_collection: datetime
    assigned_collector_id: Optional[int] = None
    assigned_collector_name: Optional[str] = None
    latest_prediction: Optional[PredictionResponse] = None
    priority_score: Optional[float] = None
    priority_level: Optional[str] = None

    class Config:
        from_attributes = True


class BinAssignRequest(BaseModel):
    collector_id: Optional[int] = None
    collector_name: Optional[str] = None


# --- COLLECTION SCHEMAS ---
class CollectionCreate(BaseModel):
    bin_id: int
    after_fill: float = 10.0


class CollectionResponse(BaseModel):
    id: int
    bin_id: int
    bin_code: Optional[str] = None
    location_name: Optional[str] = None
    collector_id: Optional[int] = None
    collector_name: Optional[str] = None
    collection_time: datetime
    before_fill: float
    after_fill: float
    status: str

    class Config:
        from_attributes = True


# --- DASHBOARD & ANALYTICS SCHEMAS ---
class DashboardSummary(BaseModel):
    total_bins: int
    normal_count: int
    warning_count: int
    critical_count: int
    average_fill: float
    predicted_overflow_count: int
    total_scans_today: int
    total_collections_today: int


class PriorityItem(BaseModel):
    rank: int
    bin_id: int
    bin_code: str
    location_name: str
    waste_type: str
    current_fill: float
    predicted_6h: float
    predicted_12h: float
    risk_level: str
    overflow_probability: float
    priority_score: float
    priority_level: str  # CRITICAL, HIGH, MEDIUM, LOW
    last_collection: datetime
    assigned_collector_id: Optional[int] = None
    assigned_collector_name: Optional[str] = None


# --- BLOG / FEATURED ACTIVITIES SCHEMAS ---
class BlogPostBase(BaseModel):
    title: str
    title_hi: Optional[str] = None
    summary: str
    summary_hi: Optional[str] = None
    content: str
    content_hi: Optional[str] = None
    image_url: Optional[str] = None
    category: str = "Activity"
    is_published: bool = True


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    title_hi: Optional[str] = None
    summary: Optional[str] = None
    summary_hi: Optional[str] = None
    content: Optional[str] = None
    content_hi: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None


class BlogPostResponse(BlogPostBase):
    id: int
    author_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- NEWSLETTER SCHEMAS ---
class NewsletterCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class NewsletterResponse(BaseModel):
    id: int
    email: str
    subscribed_at: datetime

    class Config:
        from_attributes = True


# --- PASSWORD RESET SCHEMAS ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


# --- EVENT SCHEMAS ---
class EventBase(BaseModel):
    title: str
    title_hi: Optional[str] = None
    description: str
    description_hi: Optional[str] = None
    category: str = "Cleanliness Drive"
    status: str = "upcoming"  # upcoming, ongoing, completed
    event_date: datetime
    end_date: Optional[datetime] = None
    location: str
    image_url: Optional[str] = None
    max_participants: int = 150


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    title_hi: Optional[str] = None
    description: Optional[str] = None
    description_hi: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    event_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    max_participants: Optional[int] = None


class EventResponse(EventBase):
    id: int
    created_at: datetime
    registration_count: int = 0
    is_registered: bool = False

    class Config:
        from_attributes = True


class EventRegistrationResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    registered_at: datetime
    phone: Optional[str] = None
    attendees: Optional[int] = 1
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


class EventRegisterRequest(BaseModel):
    phone: str
    attendees: Optional[int] = 1
    notes: Optional[str] = None


class BulkEmailRequest(BaseModel):
    target_audience: str = "ALL"  # CITIZEN, COLLECTOR, NEWSLETTER, DONOR, ALL
    subject: str
    heading: str
    content: str
    badge_text: Optional[str] = "PARYAVARAN OFFICIAL"
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    template_type: Optional[str] = "custom"  # custom, event_enrolled, article_read


class BulkEmailResponse(BaseModel):
    dispatched_count: int
    target_audience: str
    message: str


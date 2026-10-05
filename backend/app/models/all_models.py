"""
SQLAlchemy Models for ParyavaranSanrakshan.
Neon PostgreSQL Schema Specification.
Tables:
- users
- otp_verifications
- waste_scans
- bins
- sensor_readings
- predictions
- collections
- blog_posts
- newsletter_subscribers
- events
- event_registrations
"""

import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from backend.app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Nullable if citizen signs in solely via OTP
    role = Column(String(50), default="citizen", nullable=False)  # citizen, collector, admin
    is_verified = Column(Boolean, default=False, nullable=False)
    google_sub = Column(String(255), unique=True, index=True, nullable=True)
    auth_provider = Column(String(50), default="local", nullable=False)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    scans = relationship("WasteScan", back_populates="user", cascade="all, delete-orphan")
    collections = relationship("Collection", back_populates="collector")


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WasteScan(Base):
    __tablename__ = "waste_scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(String(1000), nullable=False)
    image_public_id = Column(String(255), nullable=True)
    predicted_class = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    category = Column(String(100), nullable=False)
    recommendation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="scans")


class Bin(Base):
    __tablename__ = "bins"

    id = Column(Integer, primary_key=True, index=True)
    bin_code = Column(String(50), unique=True, index=True, nullable=False)
    location_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, default=100, nullable=False)
    waste_type = Column(String(100), nullable=False)
    current_fill = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="Normal", nullable=False)  # Normal, Warning, Critical
    assigned_collector_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_collector_name = Column(String(150), nullable=True)
    last_collection = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    readings = relationship("SensorReading", back_populates="bin", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="bin", cascade="all, delete-orphan")
    collections = relationship("Collection", back_populates="bin", cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(Integer, ForeignKey("bins.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    fill_level = Column(Float, nullable=False)
    previous_fill_level = Column(Float, nullable=False)
    fill_change_rate = Column(Float, nullable=False)
    temperature = Column(Float, nullable=True)
    waste_type = Column(String(100), nullable=True)

    bin = relationship("Bin", back_populates="readings")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(Integer, ForeignKey("bins.id", ondelete="CASCADE"), nullable=False)
    prediction_time = Column(DateTime, default=datetime.datetime.utcnow)
    predicted_6h = Column(Float, nullable=False)
    predicted_12h = Column(Float, nullable=False)
    overflow_probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH

    bin = relationship("Bin", back_populates="predictions")


class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(Integer, ForeignKey("bins.id", ondelete="CASCADE"), nullable=False)
    collector_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    collection_time = Column(DateTime, default=datetime.datetime.utcnow)
    before_fill = Column(Float, nullable=False)
    after_fill = Column(Float, nullable=False)
    status = Column(String(50), default="Completed", nullable=False)

    bin = relationship("Bin", back_populates="collections")
    collector = relationship("User", back_populates="collections")


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    title_hi = Column(String(255), nullable=True)
    summary = Column(Text, nullable=False)
    summary_hi = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    content_hi = Column(Text, nullable=True)
    category = Column(String(100), default="Campaign")
    image_url = Column(String(500), nullable=True)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    subscribed_at = Column(DateTime, default=datetime.datetime.utcnow)


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    title_hi = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    description_hi = Column(Text, nullable=True)
    event_type = Column(String(100), default="Awareness")
    status = Column(String(50), default="upcoming")  # upcoming, ongoing, completed
    location = Column(String(255), nullable=False)
    event_date = Column(DateTime, nullable=False)
    max_capacity = Column(Integer, default=100)
    current_registered = Column(Integer, default=0)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")


class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    phone = Column(String(50), nullable=True)
    attendees = Column(Integer, default=1)
    notes = Column(Text, nullable=True)
    registered_at = Column(DateTime, default=datetime.datetime.utcnow)

    event = relationship("Event", back_populates="registrations")
    user = relationship("User")


class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    razorpay_order_id = Column(String(255), unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String(255), nullable=True, index=True)
    razorpay_signature = Column(String(500), nullable=True)
    amount = Column(Float, nullable=False)  # in INR
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(50), default="created", nullable=False)  # created, paid, failed
    donor_name = Column(String(255), nullable=True)
    donor_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)

    user = relationship("User")


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

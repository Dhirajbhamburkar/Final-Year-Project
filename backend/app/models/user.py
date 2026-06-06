"""
User Profile Models
MongoDB Schema: UserProfiles collection
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    NORMAL = "normal"
    AT_RISK = "at_risk"
    ADDICTED = "addicted"


class UserPreferences(BaseModel):
    """User notification and threshold preferences."""
    daily_limit_minutes: int = Field(default=240, ge=30, le=1440)
    continuous_limit_minutes: int = Field(default=180, ge=15, le=480)
    enable_push_notifications: bool = True
    enable_focus_mode: bool = True
    detox_reminder_interval_hours: int = Field(default=2, ge=1, le=12)
    preferred_detox_activities: List[str] = Field(
        default=["meditation", "walking", "reading"]
    )


class UserProfile(BaseModel):
    """
    MongoDB Document Schema: user_profiles
    
    {
        "_id": ObjectId,
        "username": "john_doe",
        "email": "john@example.com",
        "password_hash": "$2b$12$...",
        "full_name": "John Doe",
        "age": 22,
        "current_risk_level": "normal",
        "current_addiction_index": 32.5,
        "total_screen_time_today_minutes": 145,
        "preferences": { ... },
        "created_at": ISODate,
        "updated_at": ISODate,
        "last_active_at": ISODate
    }
    """
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password_hash: str
    full_name: str = Field(..., min_length=1, max_length=100)
    age: Optional[int] = Field(default=None, ge=13, le=120)
    current_risk_level: RiskLevel = RiskLevel.NORMAL
    current_addiction_index: float = Field(default=0.0, ge=0.0, le=100.0)
    total_screen_time_today_minutes: float = 0.0
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_active_at: Optional[datetime] = None


# ── Request/Response DTOs ──

class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=100)
    age: Optional[int] = Field(default=None, ge=13, le=120)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    age: Optional[int]
    current_risk_level: str
    current_addiction_index: float
    total_screen_time_today_minutes: float
    preferences: UserPreferences
    created_at: datetime
    last_active_at: Optional[datetime]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse

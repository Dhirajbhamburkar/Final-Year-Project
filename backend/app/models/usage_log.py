"""
Usage Log Models
MongoDB Schema: usage_logs (Time-Series Collection)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Platform(str, Enum):
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    SNAPCHAT = "snapchat"
    REDDIT = "reddit"
    WHATSAPP = "whatsapp"
    LINKEDIN = "linkedin"
    OTHER = "other"


class UsageLog(BaseModel):
    """
    MongoDB Time-Series Document Schema: usage_logs
    
    {
        "timestamp": ISODate("2026-02-23T10:30:00Z"),  // timeField
        "user_id": "65a1b2c3d4e5f6...",                // metaField
        "platform": "instagram",
        "session_duration_minutes": 45.5,
        "session_start": ISODate,
        "session_end": ISODate,
        "app_switches": 12,
        "scroll_depth_percentage": 78.5,
        "interactions": {
            "likes": 23,
            "comments": 5,
            "shares": 2,
            "posts_viewed": 156
        },
        "is_continuous": true,
        "device_type": "mobile"
    }
    """
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str
    platform: Platform
    session_duration_minutes: float = Field(..., ge=0)
    session_start: datetime
    session_end: datetime
    app_switches: int = Field(default=0, ge=0)
    scroll_depth_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    interactions: dict = Field(default_factory=lambda: {
        "likes": 0,
        "comments": 0,
        "shares": 0,
        "posts_viewed": 0
    })
    is_continuous: bool = False
    device_type: str = "mobile"


# ── Request DTOs ──

class UsageLogRequest(BaseModel):
    """Single usage log entry submitted from client."""
    platform: Platform
    session_duration_minutes: float = Field(..., ge=0)
    session_start: datetime
    session_end: datetime
    app_switches: int = Field(default=0, ge=0)
    scroll_depth_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    interactions: Optional[dict] = None
    device_type: str = "mobile"


class BatchUsageLogRequest(BaseModel):
    """Batch submission of usage logs."""
    logs: List[UsageLogRequest] = Field(..., min_length=1, max_length=100)


# ── Response DTOs ──

class UsageLogResponse(BaseModel):
    id: str
    timestamp: datetime
    platform: str
    session_duration_minutes: float
    app_switches: int
    scroll_depth_percentage: float
    interactions: dict
    is_continuous: bool


class DailyUsageSummary(BaseModel):
    """Aggregated daily usage summary."""
    date: str
    total_screen_time_minutes: float
    total_sessions: int
    total_app_switches: int
    avg_session_duration_minutes: float
    most_used_platform: str
    platforms_breakdown: dict
    addiction_index: float
    risk_level: str


class WeeklyTrend(BaseModel):
    """Weekly trend data for longitudinal tracking."""
    week_start: str
    week_end: str
    avg_daily_screen_time_minutes: float
    avg_daily_sessions: int
    avg_addiction_index: float
    risk_level_distribution: dict
    recovery_score: float  # 0-100, higher = better recovery


class HeatmapData(BaseModel):
    """Hourly usage heatmap data."""
    day_of_week: int  # 0=Monday, 6=Sunday
    hour: int  # 0-23
    usage_minutes: float
    intensity: float  # 0.0-1.0 normalized

"""
Alert Models
MongoDB Schema: addiction_alerts
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class AlertType(str, Enum):
    CONTINUOUS_USAGE = "continuous_usage"       # 3+ hours non-stop
    DAILY_LIMIT_EXCEEDED = "daily_limit"        # Exceeded daily limit
    ADDICTION_INDEX_WARNING = "ai_warning"      # Addiction index > 65
    ADDICTION_INDEX_CRITICAL = "ai_critical"    # Addiction index > 85
    HIGH_FREQUENCY = "high_frequency"           # Too many sessions
    LATE_NIGHT_USAGE = "late_night"             # Usage between 12AM-5AM
    BSMAS_ESCALATION = "bsmas_escalation"      # BSMAS score increase


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AddictionAlert(BaseModel):
    """
    MongoDB Document Schema: addiction_alerts
    
    {
        "_id": ObjectId,
        "user_id": "65a1b2c3d4e5f6...",
        "alert_type": "continuous_usage",
        "severity": "warning",
        "title": "⚠️ Extended Session Detected",
        "message": "You've been scrolling for 3+ hours...",
        "metadata": {
            "session_duration_minutes": 195,
            "platform": "instagram",
            "current_addiction_index": 72.5
        },
        "is_read": false,
        "is_dismissed": false,
        "action_taken": null,
        "created_at": ISODate,
        "read_at": null
    }
    """
    user_id: str
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    metadata: dict = Field(default_factory=dict)
    is_read: bool = False
    is_dismissed: bool = False
    action_taken: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None


# ── Response DTOs ──

class AlertResponse(BaseModel):
    id: str
    alert_type: str
    severity: str
    title: str
    message: str
    metadata: dict
    is_read: bool
    created_at: datetime


class AlertsSummary(BaseModel):
    total_unread: int
    alerts: List[AlertResponse]
    critical_count: int
    warning_count: int

"""
Alert Service
Handles creating, reading, and managing addiction alerts.
"""

from datetime import datetime
from app.utils.time_utils import now_ist
from typing import List, Optional, Dict
from bson import ObjectId
from app.database import get_database
from app.config import settings


async def get_user_alerts(
    user_id: str,
    unread_only: bool = False,
    limit: int = 20
) -> dict:
    """
    Get alerts for a user with summary counts.

    Args:
        user_id: The user's string ID
        unread_only: If True, only return unread alerts
        limit: Maximum number of alerts to return

    Returns:
        Dict with total_unread, critical_count, warning_count, and alerts list
    """
    db = get_database()
    query = {"user_id": user_id}
    if unread_only:
        query["is_read"] = False

    alerts_cursor = db.addiction_alerts.find(query).sort("created_at", -1).limit(limit)
    alerts = await alerts_cursor.to_list(limit)

    # Count unread
    total_unread = await db.addiction_alerts.count_documents(
        {"user_id": user_id, "is_read": False}
    )
    critical_count = await db.addiction_alerts.count_documents(
        {"user_id": user_id, "is_read": False, "severity": "critical"}
    )
    warning_count = await db.addiction_alerts.count_documents(
        {"user_id": user_id, "is_read": False, "severity": "warning"}
    )

    formatted = []
    for a in alerts:
        formatted.append({
            "id": str(a["_id"]),
            "alert_type": a.get("alert_type", ""),
            "severity": a.get("severity", "info"),
            "title": a.get("title", ""),
            "message": a.get("message", ""),
            "metadata": a.get("metadata", {}),
            "is_read": a.get("is_read", False),
            "created_at": a.get("created_at", now_ist()).isoformat(),
        })

    return {
        "total_unread": total_unread,
        "critical_count": critical_count,
        "warning_count": warning_count,
        "alerts": formatted,
    }


async def mark_alert_read(alert_id: str, user_id: str) -> bool:
    """
    Mark a single alert as read.

    Args:
        alert_id: The alert's string ID
        user_id: The user's string ID

    Returns:
        True if the alert was updated, False if not found
    """
    db = get_database()
    try:
        result = await db.addiction_alerts.update_one(
            {"_id": ObjectId(alert_id), "user_id": user_id},
            {"$set": {"is_read": True, "read_at": now_ist()}}
        )
        return result.modified_count > 0
    except Exception:
        return False


async def mark_all_alerts_read(user_id: str) -> int:
    """
    Mark all alerts for a user as read.

    Args:
        user_id: The user's string ID

    Returns:
        The number of alerts marked as read
    """
    db = get_database()
    result = await db.addiction_alerts.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True, "read_at": now_ist()}}
    )
    return result.modified_count


async def create_alert(
    user_id: str,
    alert_type: str,
    severity: str,
    title: str,
    message: str,
    metadata: Optional[dict] = None
) -> str:
    """
    Create a new alert for a user.

    Args:
        user_id: The user's string ID
        alert_type: Type of alert (e.g. 'continuous_usage')
        severity: 'info', 'warning', or 'critical'
        title: Short alert title
        message: Full alert message
        metadata: Optional extra data to store with the alert

    Returns:
        The inserted alert's string ID
    """
    db = get_database()
    doc = {
        "user_id": user_id,
        "alert_type": alert_type,
        "severity": severity,
        "title": title,
        "message": message,
        "metadata": metadata or {},
        "is_read": False,
        "is_dismissed": False,
        "action_taken": None,
        "created_at": now_ist(),
        "read_at": None,
    }
    result = await db.addiction_alerts.insert_one(doc)
    return str(result.inserted_id)


async def check_and_generate_alerts(
    user_id: str,
    daily_summary: Dict,
    addiction_index: Optional[float] = None,
    session_data: Optional[Dict] = None,
) -> List[str]:
    """
    Check usage thresholds and generate alerts when limits are exceeded.

    Args:
        user_id: The user's string ID
        daily_summary: Aggregated daily usage data from get_daily_summary
        addiction_index: Current addiction index (0-100)
        session_data: Optional data for the most recent session

    Returns:
        List of created alert IDs
    """
    created_alerts = []
    ai = addiction_index or daily_summary.get("addiction_index", 0)

    # ── 1. Addiction Index Warning ──
    if ai >= settings.ADDICTION_INDEX_CRITICAL_THRESHOLD:
        alert_id = await create_alert(
            user_id=user_id,
            alert_type="ai_critical",
            severity="critical",
            title="🚨 Critical Addiction Risk Detected",
            message=(
                f"Your addiction index has reached {ai:.1f}/100. "
                "Immediate intervention is recommended. Please activate Focus Mode."
            ),
            metadata={"addiction_index": ai},
        )
        created_alerts.append(alert_id)

    elif ai >= settings.ADDICTION_INDEX_WARNING_THRESHOLD:
        alert_id = await create_alert(
            user_id=user_id,
            alert_type="ai_warning",
            severity="warning",
            title="⚠️ High Addiction Risk Warning",
            message=(
                f"Your addiction index is {ai:.1f}/100. "
                "Consider reducing your screen time and trying a detox activity."
            ),
            metadata={"addiction_index": ai},
        )
        created_alerts.append(alert_id)

    # ── 2. Daily Limit Exceeded ──
    total_minutes = daily_summary.get("total_screen_time_minutes", 0)
    if total_minutes >= settings.DAILY_USAGE_THRESHOLD_MINUTES:
        alert_id = await create_alert(
            user_id=user_id,
            alert_type="daily_limit",
            severity="warning",
            title="📵 Daily Screen Time Limit Exceeded",
            message=(
                f"You have used social media for {total_minutes:.0f} minutes today "
                f"(limit: {settings.DAILY_USAGE_THRESHOLD_MINUTES} min). "
                "Take a break!"
            ),
            metadata={"total_minutes": total_minutes, "limit_minutes": settings.DAILY_USAGE_THRESHOLD_MINUTES},
        )
        created_alerts.append(alert_id)

    # ── 3. Continuous Session Alert ──
    if session_data:
        session_duration = session_data.get("session_duration_minutes", 0)
        if session_duration >= settings.CONTINUOUS_USAGE_THRESHOLD_MINUTES:
            platform = session_data.get("platform", "social media")
            alert_id = await create_alert(
                user_id=user_id,
                alert_type="continuous_usage",
                severity="warning",
                title="⏰ Extended Session Detected",
                message=(
                    f"You've been using {platform} for {session_duration:.0f} minutes in one go. "
                    "Take a 10-minute break to rest your eyes."
                ),
                metadata={
                    "session_duration_minutes": session_duration,
                    "platform": platform,
                },
            )
            created_alerts.append(alert_id)

        # ── 4. Late Night Usage ──
        session_start_raw = session_data.get("session_start")
        if session_start_raw:
            try:
                if isinstance(session_start_raw, str):
                    from datetime import datetime as dt
                    # Handle both ISO format with/without fractional seconds
                    for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
                        try:
                            session_start_dt = dt.fromisoformat(session_start_raw.replace("Z", ""))
                            break
                        except ValueError:
                            continue
                    else:
                        session_start_dt = None
                else:
                    session_start_dt = session_start_raw

                if session_start_dt and 0 <= session_start_dt.hour < 5:
                    alert_id = await create_alert(
                        user_id=user_id,
                        alert_type="late_night",
                        severity="warning",
                        title="🌙 Late Night Usage Detected",
                        message=(
                            "You're using social media between midnight and 5 AM. "
                            "Late night phone use disrupts sleep. Try putting your phone away."
                        ),
                        metadata={"hour": session_start_dt.hour},
                    )
                    created_alerts.append(alert_id)
            except Exception:
                pass

    # ── 5. High Session Frequency ──
    total_sessions = daily_summary.get("total_sessions", 0)
    if total_sessions >= settings.SESSION_FREQUENCY_THRESHOLD:
        alert_id = await create_alert(
            user_id=user_id,
            alert_type="high_frequency",
            severity="info",
            title="🔄 High Session Frequency",
            message=(
                f"You've opened social media {total_sessions} times today. "
                "Consider turning off notifications to reduce compulsive checking."
            ),
            metadata={"total_sessions": total_sessions, "threshold": settings.SESSION_FREQUENCY_THRESHOLD},
        )
        created_alerts.append(alert_id)

    return created_alerts

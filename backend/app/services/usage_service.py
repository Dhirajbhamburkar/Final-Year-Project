"""
Usage Data Service
Handles ingestion, aggregation, and querying of usage logs.
"""

from datetime import datetime, timedelta
from app.utils.time_utils import now_ist
from typing import List, Dict, Optional
from bson import ObjectId
from app.database import get_database
from app.services.addiction_index import calculate_addiction_index


async def ingest_usage_log(user_id: str, log_data: dict) -> dict:
    """
    Ingest a single usage log entry into the time-series collection.
    Also checks for continuous usage and updates daily totals.
    """
    db = get_database()

    document = {
        "timestamp": now_ist(),
        "user_id": user_id,
        "platform": log_data["platform"],
        "session_duration_minutes": log_data["session_duration_minutes"],
        "session_start": log_data["session_start"],
        "session_end": log_data["session_end"],
        "app_switches": log_data.get("app_switches", 0),
        "scroll_depth_percentage": log_data.get("scroll_depth_percentage", 0),
        "interactions": log_data.get("interactions", {
            "likes": 0, "comments": 0, "shares": 0, "posts_viewed": 0
        }),
        "is_continuous": log_data["session_duration_minutes"] >= 180,
        "device_type": log_data.get("device_type", "mobile"),
    }

    result = await db.usage_logs.insert_one(document)

    # Update user's daily screen time
    await _update_daily_screen_time(user_id, log_data["session_duration_minutes"])

    return {"id": str(result.inserted_id), "status": "ingested"}


async def ingest_batch_usage_logs(user_id: str, logs: List[dict]) -> dict:
    """Ingest multiple usage logs in batch."""
    db = get_database()
    documents = []
    total_duration = 0

    for log_data in logs:
        doc = {
            "timestamp": now_ist(),
            "user_id": user_id,
            "platform": log_data["platform"],
            "session_duration_minutes": log_data["session_duration_minutes"],
            "session_start": log_data["session_start"],
            "session_end": log_data["session_end"],
            "app_switches": log_data.get("app_switches", 0),
            "scroll_depth_percentage": log_data.get("scroll_depth_percentage", 0),
            "interactions": log_data.get("interactions", {}),
            "is_continuous": log_data["session_duration_minutes"] >= 180,
            "device_type": log_data.get("device_type", "mobile"),
        }
        documents.append(doc)
        total_duration += log_data["session_duration_minutes"]

    result = await db.usage_logs.insert_many(documents)
    await _update_daily_screen_time(user_id, total_duration)

    return {
        "inserted_count": len(result.inserted_ids),
        "total_duration_minutes": total_duration,
        "status": "batch_ingested"
    }


async def get_daily_summary(user_id: str, date: Optional[str] = None) -> dict:
    """
    Get aggregated usage summary for a specific day.
    """
    db = get_database()

    if date:
        target_date = datetime.strptime(date, "%Y-%m-%d")
    else:
        target_date = now_ist().replace(hour=0, minute=0, second=0, microsecond=0)

    next_date = target_date + timedelta(days=1)

    pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "timestamp": {"$gte": target_date, "$lt": next_date}
            }
        },
        {
            "$group": {
                "_id": None,
                "total_screen_time_minutes": {"$sum": "$session_duration_minutes"},
                "total_sessions": {"$sum": 1},
                "total_app_switches": {"$sum": "$app_switches"},
                "avg_session_duration": {"$avg": "$session_duration_minutes"},
                "max_session_duration": {"$max": "$session_duration_minutes"},
                "avg_scroll_depth": {"$avg": "$scroll_depth_percentage"},
                "platforms": {"$addToSet": "$platform"},
            }
        }
    ]

    result = await db.usage_logs.aggregate(pipeline).to_list(1)

    if not result:
        return {
            "date": target_date.strftime("%Y-%m-%d"),
            "total_screen_time_minutes": 0,
            "total_sessions": 0,
            "total_app_switches": 0,
            "avg_session_duration_minutes": 0,
            "most_used_platform": "none",
            "platforms_breakdown": {},
            "addiction_index": 0,
            "risk_level": "normal",
        }

    summary = result[0]

    # Get platform breakdown
    platform_pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "timestamp": {"$gte": target_date, "$lt": next_date}
            }
        },
        {
            "$group": {
                "_id": "$platform",
                "time": {"$sum": "$session_duration_minutes"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"time": -1}}
    ]

    platforms = await db.usage_logs.aggregate(platform_pipeline).to_list(20)
    platforms_breakdown = {p["_id"]: round(p["time"], 1) for p in platforms}
    most_used = platforms[0]["_id"] if platforms else "none"

    # Count late-night sessions
    late_night_pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "timestamp": {"$gte": target_date, "$lt": next_date},
            }
        },
        {
            "$addFields": {
                "hour": {"$hour": "$session_start"}
            }
        },
        {
            "$match": {
                "hour": {"$gte": 0, "$lt": 5}
            }
        },
        {"$count": "count"}
    ]
    late_result = await db.usage_logs.aggregate(late_night_pipeline).to_list(1)
    late_night_count = late_result[0]["count"] if late_result else 0

    # Calculate addiction index
    total_hours = summary["total_screen_time_minutes"] / 60
    app_switches_per_hour = (
        summary["total_app_switches"] / max(total_hours, 0.1)
    )

    index_result = calculate_addiction_index(
        total_screen_time_minutes=summary["total_screen_time_minutes"],
        session_count=summary["total_sessions"],
        longest_session_minutes=summary["max_session_duration"],
        app_switches_per_hour=app_switches_per_hour,
        late_night_session_count=late_night_count,
        avg_scroll_depth=summary.get("avg_scroll_depth", 0) or 0,
    )

    return {
        "date": target_date.strftime("%Y-%m-%d"),
        "total_screen_time_minutes": round(summary["total_screen_time_minutes"], 1),
        "total_sessions": summary["total_sessions"],
        "total_app_switches": summary["total_app_switches"],
        "avg_session_duration_minutes": round(summary["avg_session_duration"], 1),
        "most_used_platform": most_used,
        "platforms_breakdown": platforms_breakdown,
        "addiction_index": index_result["addiction_index"],
        "risk_level": index_result["risk_level"],
        "factors": index_result["factors"],
        "recommendations": index_result["recommendations"],
    }


async def get_weekly_trends(user_id: str, weeks: int = 4) -> List[dict]:
    """Get weekly aggregated trends for longitudinal tracking."""
    db = get_database()
    trends = []

    for week_offset in range(weeks):
        end_date = now_ist() - timedelta(weeks=week_offset)
        start_date = end_date - timedelta(days=7)

        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "timestamp": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_time": {"$sum": "$session_duration_minutes"},
                    "total_sessions": {"$sum": 1},
                    "avg_session": {"$avg": "$session_duration_minutes"},
                }
            }
        ]

        result = await db.usage_logs.aggregate(pipeline).to_list(1)

        if result:
            data = result[0]
            avg_daily = data["total_time"] / 7
            avg_daily_sessions = data["total_sessions"] / 7

            trends.append({
                "week_start": start_date.strftime("%Y-%m-%d"),
                "week_end": end_date.strftime("%Y-%m-%d"),
                "avg_daily_screen_time_minutes": round(avg_daily, 1),
                "avg_daily_sessions": round(avg_daily_sessions, 1),
                "total_screen_time_minutes": round(data["total_time"], 1),
            })
        else:
            trends.append({
                "week_start": start_date.strftime("%Y-%m-%d"),
                "week_end": end_date.strftime("%Y-%m-%d"),
                "avg_daily_screen_time_minutes": 0,
                "avg_daily_sessions": 0,
                "total_screen_time_minutes": 0,
            })

    return list(reversed(trends))


async def get_heatmap_data(user_id: str, days: int = 30) -> List[dict]:
    """
    Get hourly usage heatmap data for the last N days.
    Returns usage intensity by day-of-week and hour.
    """
    db = get_database()
    start_date = now_ist() - timedelta(days=days)

    pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "timestamp": {"$gte": start_date}
            }
        },
        {
            "$addFields": {
                "day_of_week": {"$dayOfWeek": "$session_start"},
                "hour": {"$hour": "$session_start"}
            }
        },
        {
            "$group": {
                "_id": {"day": "$day_of_week", "hour": "$hour"},
                "total_minutes": {"$sum": "$session_duration_minutes"},
                "session_count": {"$sum": 1}
            }
        },
        {"$sort": {"_id.day": 1, "_id.hour": 1}}
    ]

    results = await db.usage_logs.aggregate(pipeline).to_list(200)

    # Find max for normalization
    max_minutes = max((r["total_minutes"] for r in results), default=1)

    heatmap = []
    for r in results:
        heatmap.append({
            "day_of_week": r["_id"]["day"] - 1,  # Convert to 0-indexed (Mon=0)
            "hour": r["_id"]["hour"],
            "usage_minutes": round(r["total_minutes"], 1),
            "sessions": r["session_count"],
            "intensity": round(r["total_minutes"] / max_minutes, 2),
        })

    return heatmap


async def _update_daily_screen_time(user_id: str, additional_minutes: float):
    """Update the user's running daily screen time total."""
    db = get_database()
    await db.user_profiles.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$inc": {"total_screen_time_today_minutes": additional_minutes},
            "$set": {
                "last_active_at": now_ist(),
                "updated_at": now_ist()
            }
        }
    )

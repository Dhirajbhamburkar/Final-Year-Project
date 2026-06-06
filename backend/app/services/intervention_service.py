"""
Smart Intervention Service
Suggests digital detox activities and manages Focus Mode triggers.
"""

from datetime import datetime, timedelta
from app.utils.time_utils import now_ist
from typing import List, Dict, Optional
from bson import ObjectId
from app.database import get_database

# Digital Detox Activity Library
DETOX_ACTIVITIES = {
    "mindfulness": [
        {"name": "5-Minute Breathing Exercise", "duration_min": 5,
         "description": "Focus on deep breathing to reset your attention.",
         "icon": "🧘", "category": "mindfulness"},
        {"name": "Body Scan Meditation", "duration_min": 10,
         "description": "Progressive relaxation from head to toe.",
         "icon": "🧠", "category": "mindfulness"},
        {"name": "Gratitude Journaling", "duration_min": 10,
         "description": "Write 3 things you're grateful for today.",
         "icon": "📝", "category": "mindfulness"},
    ],
    "physical": [
        {"name": "Quick Walk Outside", "duration_min": 15,
         "description": "A brisk walk to boost endorphins naturally.",
         "icon": "🚶", "category": "physical"},
        {"name": "Stretching Routine", "duration_min": 10,
         "description": "Desk stretches to relieve tension.",
         "icon": "🤸", "category": "physical"},
        {"name": "Dance Break", "duration_min": 5,
         "description": "Put on your favorite song and move!",
         "icon": "💃", "category": "physical"},
    ],
    "creative": [
        {"name": "Doodle Session", "duration_min": 15,
         "description": "Free-form drawing to engage creativity.",
         "icon": "🎨", "category": "creative"},
        {"name": "Read a Book Chapter", "duration_min": 20,
         "description": "Swap screen time for page time.",
         "icon": "📖", "category": "creative"},
    ],
    "social": [
        {"name": "Call a Friend", "duration_min": 15,
         "description": "Real conversation > social media.",
         "icon": "📞", "category": "social"},
        {"name": "Face-to-Face Chat", "duration_min": 20,
         "description": "Connect with someone nearby in person.",
         "icon": "👥", "category": "social"},
    ],
}


async def get_intervention_suggestions(
    user_id: str, risk_level: str, addiction_index: float
) -> Dict:
    """Get contextual intervention suggestions based on risk."""
    db = get_database()
    user = await db.user_profiles.find_one({"_id": ObjectId(user_id)})
    preferred = (user or {}).get("preferences", {}).get(
        "preferred_detox_activities", ["mindfulness", "physical"]
    )

    suggestions = []
    if risk_level == "addicted":
        for cat in DETOX_ACTIVITIES:
            suggestions.extend(DETOX_ACTIVITIES[cat])
        focus_mode = {
            "recommended": True,
            "duration_minutes": 60,
            "message": "🚨 Strongly recommended: Activate Focus Mode now."
        }
    elif risk_level == "at_risk":
        for cat in preferred:
            if cat in DETOX_ACTIVITIES:
                suggestions.extend(DETOX_ACTIVITIES[cat])
        if not suggestions:
            suggestions.extend(DETOX_ACTIVITIES["mindfulness"])
        focus_mode = {
            "recommended": True,
            "duration_minutes": 30,
            "message": "⚠️ Consider Focus Mode to reset your attention."
        }
    else:
        suggestions.extend(DETOX_ACTIVITIES["mindfulness"][:1])
        suggestions.extend(DETOX_ACTIVITIES["physical"][:1])
        focus_mode = {
            "recommended": False,
            "duration_minutes": 0,
            "message": "✅ You're doing great! No Focus Mode needed."
        }

    return {
        "risk_level": risk_level,
        "addiction_index": addiction_index,
        "activities": suggestions,
        "focus_mode": focus_mode,
        "generated_at": now_ist().isoformat(),
    }


async def activate_focus_mode(
    user_id: str, duration_minutes: int = 30
) -> Dict:
    """Activate Focus Mode for a user."""
    db = get_database()
    intervention = {
        "user_id": user_id,
        "type": "focus_mode",
        "duration_minutes": duration_minutes,
        "started_at": now_ist(),
        "ends_at": now_ist() + timedelta(minutes=duration_minutes),
        "completed": False,
        "triggered_at": now_ist(),
    }
    result = await db.interventions.insert_one(intervention)
    return {
        "id": str(result.inserted_id),
        "status": "activated",
        "duration_minutes": duration_minutes,
        "ends_at": intervention["ends_at"].isoformat(),
        "message": f"🎯 Focus Mode ON for {duration_minutes} minutes."
    }


async def complete_focus_mode(intervention_id: str, user_id: str) -> Dict:
    """Mark a Focus Mode session as completed."""
    db = get_database()
    result = await db.interventions.update_one(
        {"_id": ObjectId(intervention_id), "user_id": user_id},
        {"$set": {"completed": True, "completed_at": now_ist()}}
    )
    if result.modified_count > 0:
        return {"status": "completed", "message": "🎉 Focus session completed!"}
    return {"status": "not_found", "message": "Intervention not found."}


async def get_intervention_history(user_id: str, limit: int = 20) -> List[dict]:
    """Get intervention history for a user."""
    db = get_database()
    interventions = await db.interventions.find(
        {"user_id": user_id}
    ).sort("triggered_at", -1).limit(limit).to_list(limit)

    return [{
        "id": str(i["_id"]),
        "type": i["type"],
        "duration_minutes": i["duration_minutes"],
        "completed": i.get("completed", False),
        "triggered_at": i["triggered_at"].isoformat(),
    } for i in interventions]

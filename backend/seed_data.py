"""
Database Seed Script
Generates realistic demo data for the SMADS platform.
"""

import asyncio
import random
import sys
import io
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGODB_URI = "mongodb://localhost:27017"
DB_NAME = "smads_db"

PLATFORMS = ["instagram", "facebook", "twitter", "tiktok", "youtube", "snapchat", "reddit"]

DEMO_USERS = [
    {"username": "demo_user", "email": "demo@smads.com", "password": "Demo@1234",
     "full_name": "Demo User", "age": 22},
    {"username": "alice_health", "email": "alice@smads.com", "password": "Alice@1234",
     "full_name": "Alice Johnson", "age": 20},
    {"username": "bob_atrisk", "email": "bob@smads.com", "password": "Bob@12345",
     "full_name": "Bob Smith", "age": 24},
]


async def seed():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]

    # Clear existing data
    for col in ["user_profiles", "usage_logs", "addiction_alerts", "bsmas_scores", "interventions"]:
        await db[col].drop()
    print("[x] Cleared existing collections.")

    # Create time-series collection
    existing = await db.list_collection_names()
    if "usage_logs" not in existing:
        await db.create_collection(
            "usage_logs",
            timeseries={"timeField": "timestamp", "metaField": "user_id", "granularity": "minutes"}
        )

    # Seed users
    user_ids = []
    for u in DEMO_USERS:
        doc = {
            "username": u["username"],
            "email": u["email"],
            "password_hash": pwd_context.hash(u["password"]),
            "full_name": u["full_name"],
            "age": u["age"],
            "current_risk_level": "normal",
            "current_addiction_index": 0.0,
            "total_screen_time_today_minutes": 0.0,
            "preferences": {
                "daily_limit_minutes": 240,
                "continuous_limit_minutes": 180,
                "enable_push_notifications": True,
                "enable_focus_mode": True,
                "detox_reminder_interval_hours": 2,
                "preferred_detox_activities": ["mindfulness", "walking", "reading"]
            },
            "created_at": datetime.utcnow() - timedelta(days=30),
            "updated_at": datetime.utcnow(),
            "last_active_at": datetime.utcnow(),
        }
        result = await db.user_profiles.insert_one(doc)
        user_ids.append(str(result.inserted_id))
        print(f"  [+] Created user: {u['username']} ({u['email']})")

    # Seed usage logs (30 days of data for each user)
    profiles = [
        {"screen_range": (30, 150), "sessions": (2, 8), "switches": (1, 5)},
        {"screen_range": (20, 120), "sessions": (1, 6), "switches": (0, 3)},
        {"screen_range": (60, 240), "sessions": (5, 20), "switches": (3, 12)},
    ]

    total_logs = 0
    for idx, uid in enumerate(user_ids):
        profile = profiles[idx]
        logs = []
        for day_offset in range(30, 0, -1):
            date = datetime.utcnow() - timedelta(days=day_offset)
            num_sessions = random.randint(*profile["sessions"])

            for _ in range(num_sessions):
                hour = random.choices(range(24), weights=[
                    1,1,1,1,1,2,3,5,7,8,9,9,8,8,9,9,8,7,6,7,8,6,3,2
                ])[0]
                duration = random.uniform(*profile["screen_range"]) / num_sessions
                start = date.replace(hour=hour, minute=random.randint(0, 59))

                logs.append({
                    "timestamp": start,
                    "user_id": uid,
                    "platform": random.choice(PLATFORMS),
                    "session_duration_minutes": round(duration, 1),
                    "session_start": start,
                    "session_end": start + timedelta(minutes=duration),
                    "app_switches": random.randint(*profile["switches"]),
                    "scroll_depth_percentage": round(random.uniform(10, 90), 1),
                    "interactions": {
                        "likes": random.randint(0, 30),
                        "comments": random.randint(0, 5),
                        "shares": random.randint(0, 3),
                        "posts_viewed": random.randint(5, 100),
                    },
                    "is_continuous": duration >= 180,
                    "device_type": random.choice(["mobile", "desktop", "tablet"]),
                })

        if logs:
            await db.usage_logs.insert_many(logs)
            total_logs += len(logs)

    print(f"  [+] Seeded {total_logs} usage logs across {len(user_ids)} users.")

    # Seed BSMAS scores
    for idx, uid in enumerate(user_ids):
        base = [2, 1.5, 3][idx]
        for week in range(4):
            score_doc = {
                "user_id": uid,
                "responses": {
                    "salience": max(1, min(5, int(base + random.uniform(-0.5, 0.5)))),
                    "tolerance": max(1, min(5, int(base + random.uniform(-0.5, 0.5)))),
                    "mood_modification": max(1, min(5, int(base + random.uniform(-0.5, 1)))),
                    "relapse": max(1, min(5, int(base + random.uniform(-1, 0.5)))),
                    "withdrawal": max(1, min(5, int(base + random.uniform(-0.5, 0.5)))),
                    "conflict": max(1, min(5, int(base + random.uniform(-1, 0)))),
                    "sleep_impact": max(1, min(5, int(base + random.uniform(-0.5, 1)))),
                    "fomo": max(1, min(5, int(base + random.uniform(-0.5, 0.5)))),
                    "comparison": max(1, min(5, int(base + random.uniform(-0.5, 1)))),
                },
                "total_score": 0,
                "max_score": 45,
                "percentage": 0,
                "classification": "normal",
                "assessed_at": datetime.utcnow() - timedelta(weeks=4-week),
            }
            total = sum(score_doc["responses"].values())
            score_doc["total_score"] = total
            score_doc["percentage"] = round((total / 45) * 100, 1)
            if score_doc["percentage"] >= 75:
                score_doc["classification"] = "addicted"
            elif score_doc["percentage"] >= 50:
                score_doc["classification"] = "at_risk"
            await db.bsmas_scores.insert_one(score_doc)

    print("  [+] Seeded BSMAS assessment history.")

    # Create indexes
    await db.user_profiles.create_index("email", unique=True)
    await db.user_profiles.create_index("username", unique=True)

    print("\n[OK] Database seeded successfully!")
    print(f"   Demo login: demo@smads.com / Demo@1234")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())

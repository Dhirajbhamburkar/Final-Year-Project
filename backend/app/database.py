"""
SMADS Database Module
MongoDB connection management with Motor (async driver).
Configures Time-Series collections for high-frequency usage logs.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
from app.config import settings

# Global database references
client: AsyncIOMotorClient = None
db = None


async def connect_to_database():
    """Initialize MongoDB connection and create collections/indexes."""
    global client, db

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]

    # ── Create Time-Series Collection for UsageLogs ──
    existing_collections = await db.list_collection_names()

    if "usage_logs" not in existing_collections:
        await db.create_collection(
            "usage_logs",
            timeseries={
                "timeField": "timestamp",
                "metaField": "user_id",
                "granularity": "minutes"
            },
            expireAfterSeconds=31536000  # 1 year retention
        )
        print("[DB] Created Time-Series collection: usage_logs")

    # ── Create Indexes ──
    # UserProfiles indexes
    await db.user_profiles.create_index("email", unique=True)
    await db.user_profiles.create_index("username", unique=True)

    # UsageLogs indexes (time-series has auto-indexes, add compound)
    await db.usage_logs.create_index([
        ("user_id", ASCENDING),
        ("timestamp", DESCENDING)
    ])

    # AddictionAlerts indexes
    await db.addiction_alerts.create_index([
        ("user_id", ASCENDING),
        ("created_at", DESCENDING)
    ])
    await db.addiction_alerts.create_index("is_read")

    # BSMASScores indexes
    await db.bsmas_scores.create_index([
        ("user_id", ASCENDING),
        ("assessed_at", DESCENDING)
    ])

    # Interventions indexes
    await db.interventions.create_index([
        ("user_id", ASCENDING),
        ("triggered_at", DESCENDING)
    ])

    print(f"[DB] Connected to MongoDB: {settings.MONGODB_DB_NAME}")
    return db


async def close_database_connection():
    """Close the MongoDB connection."""
    global client
    if client:
        client.close()
        print("[DB] MongoDB connection closed.")


def get_database():
    """Get the database instance."""
    return db

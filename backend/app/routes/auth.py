"""
Authentication Routes
Register, Login, Profile endpoints with JWT/Bcrypt.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from app.utils.time_utils import now_ist
from bson import ObjectId
from app.database import get_database
from app.models.user import (
    UserRegisterRequest, UserLoginRequest,
    UserProfileResponse, UserPreferences, TokenResponse
)
from app.services.auth_service import (
    hash_password, verify_password,
    create_access_token, get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(request: UserRegisterRequest):
    """Register a new user account."""
    db = get_database()

    # Check existing
    existing = await db.user_profiles.find_one({
        "$or": [
            {"email": request.email},
            {"username": request.username}
        ]
    })
    if existing:
        field = "email" if existing.get("email") == request.email else "username"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with this {field} already exists."
        )

    # Create user document
    user_doc = {
        "username": request.username,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "full_name": request.full_name,
        "age": request.age,
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
        "created_at": now_ist(),
        "updated_at": now_ist(),
        "last_active_at": now_ist(),
    }

    result = await db.user_profiles.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Generate JWT
    token = create_access_token(data={"sub": user_id, "email": request.email})

    return TokenResponse(
        access_token=token,
        user=UserProfileResponse(
            id=user_id,
            username=request.username,
            email=request.email,
            full_name=request.full_name,
            age=request.age,
            current_risk_level="normal",
            current_addiction_index=0.0,
            total_screen_time_today_minutes=0.0,
            preferences=UserPreferences(**user_doc["preferences"]),
            created_at=user_doc["created_at"],
            last_active_at=user_doc["last_active_at"],
        )
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest):
    """Login with email and password."""
    db = get_database()

    user = await db.user_profiles.find_one({"email": request.email})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_id = str(user["_id"])
    token = create_access_token(data={"sub": user_id, "email": user["email"]})

    # Update last active
    await db.user_profiles.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_active_at": now_ist()}}
    )

    return TokenResponse(
        access_token=token,
        user=UserProfileResponse(
            id=user_id,
            username=user["username"],
            email=user["email"],
            full_name=user["full_name"],
            age=user.get("age"),
            current_risk_level=user.get("current_risk_level", "normal"),
            current_addiction_index=user.get("current_addiction_index", 0),
            total_screen_time_today_minutes=user.get("total_screen_time_today_minutes", 0),
            preferences=UserPreferences(**user.get("preferences", {})),
            created_at=user["created_at"],
            last_active_at=now_ist(),
        )
    )


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(user=Depends(get_current_user)):
    """Get the authenticated user's profile."""
    return UserProfileResponse(
        id=user["_id"],
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        age=user.get("age"),
        current_risk_level=user.get("current_risk_level", "normal"),
        current_addiction_index=user.get("current_addiction_index", 0),
        total_screen_time_today_minutes=user.get("total_screen_time_today_minutes", 0),
        preferences=user.get("preferences", {}),
        created_at=user["created_at"],
        last_active_at=user.get("last_active_at"),
    )


@router.put("/preferences")
async def update_preferences(preferences: dict, user=Depends(get_current_user)):
    """Update user preferences."""
    db = get_database()
    await db.user_profiles.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {
            "preferences": preferences,
            "updated_at": now_ist()
        }}
    )
    return {"status": "updated", "preferences": preferences}

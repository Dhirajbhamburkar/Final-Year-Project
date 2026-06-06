"""
Analytics Routes
ML prediction, BSMAS assessment, and recovery tracking.
"""

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from app.utils.time_utils import now_ist
from bson import ObjectId
from app.services.auth_service import get_current_user
from app.services.ml_engine import get_ml_engine, engineer_features_from_logs
from app.services.addiction_index import calculate_recovery_score
from app.models.bsmas import BSMASSubmitRequest, BSMAS_THRESHOLDS
from app.database import get_database

router = APIRouter(prefix="/api/analytics", tags=["Analytics & ML"])


@router.get("/predict")
async def predict_addiction_risk(user=Depends(get_current_user)):
    """Run ML prediction on user's recent usage data."""
    db = get_database()
    user_id = user["_id"]

    # Fetch last 7 days of logs
    week_ago = now_ist() - timedelta(days=7)
    logs = await db.usage_logs.find(
        {"user_id": user_id, "timestamp": {"$gte": week_ago}}
    ).to_list(500)

    # Get latest BSMAS
    latest_bsmas = await db.bsmas_scores.find_one(
        {"user_id": user_id}, sort=[("assessed_at", -1)]
    )
    bsmas_responses = latest_bsmas.get("responses", {}) if latest_bsmas else None

    # Engineer features
    features = engineer_features_from_logs(
        [dict(l) for l in logs], bsmas_responses
    )

    # Predict
    engine = get_ml_engine()
    if not engine.is_trained:
        engine.train()

    prediction = engine.predict(features)
    prediction["features_used"] = features
    return prediction


@router.post("/train")
async def train_model(user=Depends(get_current_user)):
    """Trigger model training (admin/dev endpoint)."""
    engine = get_ml_engine()
    metrics = engine.train()
    return {"status": "trained", "metrics": metrics}


@router.post("/bsmas")
async def submit_bsmas_assessment(
    assessment: BSMASSubmitRequest,
    user=Depends(get_current_user)
):
    """Submit a BSMAS self-assessment."""
    db = get_database()
    user_id = user["_id"]

    responses = {
        "salience": assessment.salience,
        "tolerance": assessment.tolerance,
        "mood_modification": assessment.mood_modification,
        "relapse": assessment.relapse,
        "withdrawal": assessment.withdrawal,
        "conflict": assessment.conflict,
        "sleep_impact": assessment.sleep_impact,
        "fomo": assessment.fomo,
        "comparison": assessment.comparison,
    }

    total_score = sum(responses.values())
    max_score = 45
    percentage = round((total_score / max_score) * 100, 1)

    # Classify
    classification = "normal"
    for level, (low, high) in BSMAS_THRESHOLDS.items():
        if low <= percentage <= high:
            classification = level
            break

    # Get previous score for trend
    prev = await db.bsmas_scores.find_one(
        {"user_id": user_id}, sort=[("assessed_at", -1)]
    )

    doc = {
        "user_id": user_id,
        "responses": responses,
        "total_score": total_score,
        "max_score": max_score,
        "percentage": percentage,
        "classification": classification,
        "assessed_at": now_ist(),
        "notes": assessment.notes,
    }

    result = await db.bsmas_scores.insert_one(doc)

    trend = None
    prev_score = None
    if prev:
        prev_score = prev.get("total_score")
        diff = total_score - prev_score
        if diff > 3:
            trend = "worsening"
        elif diff < -3:
            trend = "improving"
        else:
            trend = "stable"

    return {
        "id": str(result.inserted_id),
        "total_score": total_score,
        "max_score": max_score,
        "percentage": percentage,
        "classification": classification,
        "breakdown": responses,
        "assessed_at": doc["assessed_at"].isoformat(),
        "previous_score": prev_score,
        "trend": trend,
    }


@router.get("/bsmas/history")
async def get_bsmas_history(user=Depends(get_current_user)):
    """Get BSMAS assessment history."""
    db = get_database()
    scores = await db.bsmas_scores.find(
        {"user_id": user["_id"]}
    ).sort("assessed_at", -1).limit(20).to_list(20)

    return [{
        "id": str(s["_id"]),
        "total_score": s["total_score"],
        "percentage": s["percentage"],
        "classification": s["classification"],
        "assessed_at": s["assessed_at"].isoformat(),
    } for s in scores]


@router.get("/recovery")
async def get_recovery_progress(user=Depends(get_current_user)):
    """Get digital recovery progress score."""
    db = get_database()
    user_id = user["_id"]

    # Get last 30 days of daily addiction indices
    thirty_days_ago = now_ist() - timedelta(days=30)
    logs = await db.usage_logs.find(
        {"user_id": user_id, "timestamp": {"$gte": thirty_days_ago}}
    ).to_list(1000)

    current_index = user.get("current_addiction_index", 0)

    # Simulate historical indices from BSMAS
    scores = await db.bsmas_scores.find(
        {"user_id": user_id}
    ).sort("assessed_at", -1).limit(30).to_list(30)

    prev_indices = [s["percentage"] for s in scores]

    recovery = calculate_recovery_score(
        current_index=current_index,
        previous_indices=prev_indices,
        days_tracked=len(prev_indices),
    )

    return recovery

"""
Smart Interventions Routes
Focus Mode and detox activity endpoints.
"""

from fastapi import APIRouter, Depends, Query
from app.services.auth_service import get_current_user
from app.services.intervention_service import (
    get_intervention_suggestions,
    activate_focus_mode,
    complete_focus_mode,
    get_intervention_history,
)

router = APIRouter(prefix="/api/interventions", tags=["Interventions"])


@router.get("/suggestions")
async def get_suggestions(user=Depends(get_current_user)):
    """Get intervention suggestions based on current risk."""
    return await get_intervention_suggestions(
        user_id=user["_id"],
        risk_level=user.get("current_risk_level", "normal"),
        addiction_index=user.get("current_addiction_index", 0),
    )


@router.post("/focus-mode")
async def start_focus_mode(
    duration: int = Query(30, ge=5, le=120),
    user=Depends(get_current_user)
):
    """Activate Focus Mode."""
    return await activate_focus_mode(user["_id"], duration)


@router.put("/focus-mode/{intervention_id}/complete")
async def end_focus_mode(
    intervention_id: str,
    user=Depends(get_current_user)
):
    """Complete a Focus Mode session."""
    return await complete_focus_mode(intervention_id, user["_id"])


@router.get("/history")
async def intervention_history(
    limit: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user)
):
    """Get intervention history."""
    return await get_intervention_history(user["_id"], limit)

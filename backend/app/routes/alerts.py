"""
Alert Management Routes
"""

from fastapi import APIRouter, Depends, Query
from app.services.auth_service import get_current_user
from app.services.alert_service import (
    get_user_alerts, mark_alert_read, mark_all_alerts_read
)

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("/")
async def get_alerts(
    unread_only: bool = Query(False),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user)
):
    """Get user alerts with summary."""
    return await get_user_alerts(user["_id"], unread_only, limit)


@router.put("/{alert_id}/read")
async def read_alert(alert_id: str, user=Depends(get_current_user)):
    """Mark a single alert as read."""
    success = await mark_alert_read(alert_id, user["_id"])
    return {"status": "read" if success else "not_found"}


@router.put("/read-all")
async def read_all_alerts(user=Depends(get_current_user)):
    """Mark all alerts as read."""
    count = await mark_all_alerts_read(user["_id"])
    return {"status": "done", "marked_read": count}

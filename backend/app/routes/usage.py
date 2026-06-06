"""
Usage Data Ingestion Routes
Endpoints for submitting and querying usage data.
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.services.auth_service import get_current_user
from app.services.usage_service import (
    ingest_usage_log, ingest_batch_usage_logs,
    get_daily_summary, get_weekly_trends, get_heatmap_data,
)
from app.services.alert_service import check_and_generate_alerts
from app.models.usage_log import UsageLogRequest, BatchUsageLogRequest

router = APIRouter(prefix="/api/usage", tags=["Usage Data"])


@router.post("/log")
async def submit_usage_log(
    log: UsageLogRequest,
    user=Depends(get_current_user)
):
    """Submit a single usage log entry."""
    user_id = user["_id"]
    log_data = log.model_dump()
    log_data["session_start"] = log_data["session_start"].isoformat()
    log_data["session_end"] = log_data["session_end"].isoformat()

    result = await ingest_usage_log(user_id, log.model_dump())

    # Check alerts after ingestion
    daily = await get_daily_summary(user_id)
    alerts = await check_and_generate_alerts(
        user_id=user_id,
        session_data=log.model_dump(),
        daily_summary=daily,
        addiction_index=daily.get("addiction_index"),
    )

    result["alerts_generated"] = len(alerts)
    result["current_addiction_index"] = daily.get("addiction_index", 0)
    result["risk_level"] = daily.get("risk_level", "normal")
    return result


@router.post("/log/batch")
async def submit_batch_usage_logs(
    batch: BatchUsageLogRequest,
    user=Depends(get_current_user)
):
    """Submit multiple usage logs in one request."""
    user_id = user["_id"]
    logs = [log.model_dump() for log in batch.logs]
    result = await ingest_batch_usage_logs(user_id, logs)

    daily = await get_daily_summary(user_id)
    await check_and_generate_alerts(
        user_id=user_id,
        daily_summary=daily,
        addiction_index=daily.get("addiction_index"),
    )

    result["current_addiction_index"] = daily.get("addiction_index", 0)
    return result


@router.get("/summary/daily")
async def daily_usage_summary(
    date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    user=Depends(get_current_user)
):
    """Get daily usage summary with addiction index."""
    return await get_daily_summary(user["_id"], date)


@router.get("/trends/weekly")
async def weekly_usage_trends(
    weeks: int = Query(4, ge=1, le=12),
    user=Depends(get_current_user)
):
    """Get weekly trend data for longitudinal tracking."""
    return await get_weekly_trends(user["_id"], weeks)


@router.get("/heatmap")
async def usage_heatmap(
    days: int = Query(30, ge=7, le=90),
    user=Depends(get_current_user)
):
    """Get hourly usage heatmap data."""
    return await get_heatmap_data(user["_id"], days)

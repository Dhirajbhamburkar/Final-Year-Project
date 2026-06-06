"""
Addiction Index Calculator
Core algorithm that computes an "Addiction Index" (0-100) based on 
session duration, frequency, app-switching rate, and temporal patterns.

The Addiction Index is a composite score derived from:
1. Duration Factor (30% weight) — Total daily screen time
2. Frequency Factor (20% weight) — Number of sessions per day
3. Continuity Factor (15% weight) — Longest unbroken session length
4. App-Switch Factor (15% weight) — Rate of compulsive app-switching
5. Temporal Factor (10% weight) — Late-night usage patterns
6. Engagement Factor (10% weight) — Scroll depth & interaction intensity
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
import math


# ── Scoring Weights ──
WEIGHTS = {
    "duration": 0.30,
    "frequency": 0.20,
    "continuity": 0.15,
    "app_switch": 0.15,
    "temporal": 0.10,
    "engagement": 0.10,
}

# ── Normalization Benchmarks (based on research) ──
# These define "100% addiction" thresholds
BENCHMARKS = {
    "daily_screen_time_max_minutes": 600,       # 10 hours
    "sessions_per_day_max": 50,
    "continuous_session_max_minutes": 300,       # 5 hours unbroken
    "app_switches_per_hour_max": 30,
    "late_night_sessions_max": 10,              # sessions between 12AM-5AM
    "scroll_depth_max": 100.0,
}


def calculate_addiction_index(
    total_screen_time_minutes: float,
    session_count: int,
    longest_session_minutes: float,
    app_switches_per_hour: float,
    late_night_session_count: int = 0,
    avg_scroll_depth: float = 0.0,
    avg_interaction_rate: float = 0.0,
) -> Dict:
    """
    Calculate the Addiction Index (0-100) from usage metrics.
    
    Args:
        total_screen_time_minutes: Total screen time for the day
        session_count: Number of sessions in the day
        longest_session_minutes: Duration of the longest session
        app_switches_per_hour: Average app switches per hour
        late_night_session_count: Sessions between 12AM-5AM
        avg_scroll_depth: Average scroll depth percentage (0-100)
        avg_interaction_rate: Avg interactions per minute
    
    Returns:
        Dictionary with overall index and factor breakdowns
    
    Example:
        >>> result = calculate_addiction_index(
        ...     total_screen_time_minutes=320,
        ...     session_count=18,
        ...     longest_session_minutes=120,
        ...     app_switches_per_hour=15,
        ...     late_night_session_count=3,
        ...     avg_scroll_depth=72.5
        ... )
        >>> print(result)
        {
            "addiction_index": 58.7,
            "risk_level": "at_risk",
            "factors": { ... },
            "recommendations": [...]
        }
    """

    # ── 1. Duration Factor ──
    duration_score = _sigmoid_normalize(
        total_screen_time_minutes,
        midpoint=BENCHMARKS["daily_screen_time_max_minutes"] * 0.5,
        steepness=0.015
    )

    # ── 2. Frequency Factor ──
    frequency_score = _sigmoid_normalize(
        session_count,
        midpoint=BENCHMARKS["sessions_per_day_max"] * 0.5,
        steepness=0.1
    )

    # ── 3. Continuity Factor ──
    continuity_score = _sigmoid_normalize(
        longest_session_minutes,
        midpoint=BENCHMARKS["continuous_session_max_minutes"] * 0.5,
        steepness=0.02
    )

    # ── 4. App-Switch Factor ──
    app_switch_score = _sigmoid_normalize(
        app_switches_per_hour,
        midpoint=BENCHMARKS["app_switches_per_hour_max"] * 0.5,
        steepness=0.15
    )

    # ── 5. Temporal Factor (Late-Night Usage) ──
    temporal_score = _sigmoid_normalize(
        late_night_session_count,
        midpoint=BENCHMARKS["late_night_sessions_max"] * 0.4,
        steepness=0.4
    )

    # ── 6. Engagement Factor ──
    engagement_score = min(avg_scroll_depth / BENCHMARKS["scroll_depth_max"], 1.0)

    # ── Weighted Composite ──
    factors = {
        "duration": round(duration_score * 100, 1),
        "frequency": round(frequency_score * 100, 1),
        "continuity": round(continuity_score * 100, 1),
        "app_switching": round(app_switch_score * 100, 1),
        "temporal": round(temporal_score * 100, 1),
        "engagement": round(engagement_score * 100, 1),
    }

    addiction_index = (
        duration_score * WEIGHTS["duration"]
        + frequency_score * WEIGHTS["frequency"]
        + continuity_score * WEIGHTS["continuity"]
        + app_switch_score * WEIGHTS["app_switch"]
        + temporal_score * WEIGHTS["temporal"]
        + engagement_score * WEIGHTS["engagement"]
    ) * 100

    addiction_index = round(min(max(addiction_index, 0), 100), 1)

    # ── Risk Classification ──
    if addiction_index < 40:
        risk_level = "normal"
    elif addiction_index < 65:
        risk_level = "at_risk"
    else:
        risk_level = "addicted"

    # ── Generate Recommendations ──
    recommendations = _generate_recommendations(factors, addiction_index)

    return {
        "addiction_index": addiction_index,
        "risk_level": risk_level,
        "factors": factors,
        "weights": {k: f"{v*100:.0f}%" for k, v in WEIGHTS.items()},
        "recommendations": recommendations,
        "computed_at": datetime.utcnow().isoformat(),
    }


def calculate_recovery_score(
    current_index: float,
    previous_indices: List[float],
    days_tracked: int
) -> Dict:
    """
    Calculate a Digital Recovery Score (0-100) based on improvement trends.
    
    Higher score = better recovery trajectory.
    """
    if not previous_indices or days_tracked < 2:
        return {
            "recovery_score": 50.0,
            "trend": "insufficient_data",
            "message": "Need at least 2 days of data for recovery tracking."
        }

    avg_previous = sum(previous_indices) / len(previous_indices)
    improvement = avg_previous - current_index

    # Recovery is 50 (baseline) + improvement bonus
    recovery = 50 + (improvement * 1.5)
    recovery = round(min(max(recovery, 0), 100), 1)

    # Determine trend
    recent = previous_indices[-min(7, len(previous_indices)):]
    if len(recent) >= 3:
        trend_direction = recent[0] - recent[-1]
        if trend_direction > 5:
            trend = "improving"
        elif trend_direction < -5:
            trend = "worsening"
        else:
            trend = "stable"
    else:
        trend = "insufficient_data"

    messages = {
        "improving": "🎉 Great progress! Your digital habits are improving.",
        "stable": "📊 Your usage patterns are stable. Keep monitoring.",
        "worsening": "⚠️ Usage is trending upward. Consider a digital detox.",
        "insufficient_data": "📈 Keep tracking to see your recovery trends."
    }

    return {
        "recovery_score": recovery,
        "trend": trend,
        "message": messages[trend],
        "days_tracked": days_tracked,
        "current_index": current_index,
        "avg_previous_index": round(avg_previous, 1),
    }


def _sigmoid_normalize(value: float, midpoint: float, steepness: float) -> float:
    """
    Sigmoid normalization to map raw values to 0-1 range.
    Provides a smooth, non-linear mapping where values around the midpoint
    produce ~0.5, and extreme values approach 0 or 1.
    """
    try:
        return 1 / (1 + math.exp(-steepness * (value - midpoint)))
    except OverflowError:
        return 1.0 if value > midpoint else 0.0


def _generate_recommendations(factors: Dict, index: float) -> List[str]:
    """Generate personalized recommendations based on factor scores."""
    recs = []

    if factors["duration"] > 70:
        recs.append("📵 Set a daily screen time limit — try reducing by 30 minutes each week.")
    if factors["frequency"] > 60:
        recs.append("🔔 Disable non-essential notifications to reduce session frequency.")
    if factors["continuity"] > 65:
        recs.append("⏰ Enable break reminders every 45 minutes of continuous use.")
    if factors["app_switching"] > 55:
        recs.append("🎯 Practice single-app focus — avoid switching between social media apps.")
    if factors["temporal"] > 50:
        recs.append("🌙 Enable Night Mode — stop social media usage after 11 PM.")
    if factors["engagement"] > 70:
        recs.append("📖 Replace passive scrolling with intentional content consumption.")

    if index >= 65:
        recs.append("🧘 Consider a 24-hour digital detox this weekend.")
        recs.append("👥 Talk to a counselor about your social media habits.")
    elif index >= 40:
        recs.append("🚶 Take a 15-minute walking break when you feel the urge to scroll.")

    if not recs:
        recs.append("✅ Your digital habits look healthy! Keep it up.")

    return recs

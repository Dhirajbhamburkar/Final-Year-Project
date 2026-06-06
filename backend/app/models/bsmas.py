"""
BSMAS (Bergen Social Media Addiction Scale) Models
Modified BSMAS scoring for digital addiction detection.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class BSMASFrequency(int, Enum):
    """
    Modified Bergen Scale Response Options (1-5):
    1 = Very rarely
    2 = Rarely
    3 = Sometimes
    4 = Often
    5 = Very often
    """
    VERY_RARELY = 1
    RARELY = 2
    SOMETIMES = 3
    OFTEN = 4
    VERY_OFTEN = 5


class BSMASAssessment(BaseModel):
    """
    Modified Bergen Social Media Addiction Scale (BSMAS)
    6 core items + 3 extended items for comprehensive assessment.
    
    MongoDB Document Schema: bsmas_scores
    
    {
        "_id": ObjectId,
        "user_id": "65a1b2c3...",
        "responses": {
            "salience": 4,      // Spent a lot of time thinking about SM
            "tolerance": 3,      // Felt urge to use SM more and more
            "mood_mod": 5,       // Used SM to forget personal problems
            "relapse": 4,        // Tried to cut down but failed
            "withdrawal": 3,     // Become restless without SM
            "conflict": 2,       // Used SM so much it impacted studies
            "sleep_impact": 4,   // [Extended] SM affected sleep quality
            "fomo": 3,           // [Extended] Fear of missing out
            "comparison": 4      // [Extended] Negative self-comparison
        },
        "total_score": 32,
        "max_score": 45,
        "percentage": 71.1,
        "classification": "at_risk",
        "assessed_at": ISODate,
        "notes": "Weekly self-assessment"
    }
    """
    user_id: str
    responses: dict = Field(
        ...,
        description="BSMAS item responses (1-5 each)",
        json_schema_extra={
            "example": {
                "salience": 3,
                "tolerance": 2,
                "mood_modification": 4,
                "relapse": 3,
                "withdrawal": 2,
                "conflict": 1,
                "sleep_impact": 3,
                "fomo": 2,
                "comparison": 3
            }
        }
    )
    total_score: int = 0
    max_score: int = 45  # 9 items × 5 max
    percentage: float = 0.0
    classification: str = "normal"
    assessed_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None


# ── Request/Response DTOs ──

class BSMASSubmitRequest(BaseModel):
    """Submit a BSMAS self-assessment."""
    salience: int = Field(..., ge=1, le=5, description="Time spent thinking about SM")
    tolerance: int = Field(..., ge=1, le=5, description="Urge to use SM more and more")
    mood_modification: int = Field(..., ge=1, le=5, description="Using SM to forget problems")
    relapse: int = Field(..., ge=1, le=5, description="Failed attempts to cut down")
    withdrawal: int = Field(..., ge=1, le=5, description="Restlessness without SM")
    conflict: int = Field(..., ge=1, le=5, description="SM impacting work/studies")
    sleep_impact: int = Field(..., ge=1, le=5, description="SM affecting sleep quality")
    fomo: int = Field(..., ge=1, le=5, description="Fear of missing out")
    comparison: int = Field(..., ge=1, le=5, description="Negative self-comparison on SM")
    notes: Optional[str] = None


class BSMASScoreResponse(BaseModel):
    id: str
    total_score: int
    max_score: int
    percentage: float
    classification: str
    breakdown: dict
    assessed_at: datetime
    previous_score: Optional[int] = None
    trend: Optional[str] = None  # "improving", "stable", "worsening"


# ── Classification Thresholds ──
BSMAS_THRESHOLDS = {
    "normal": (0, 49.9),       # < 50% → Normal
    "at_risk": (50.0, 74.9),   # 50-75% → At Risk
    "addicted": (75.0, 100.0)  # > 75% → Addicted
}

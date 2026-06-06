"""
time_utils.py  –  Central timezone helper for SMADS.
All timestamps are stored and returned in IST (Asia/Kolkata, UTC+5:30).
"""
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))


def now_ist() -> datetime:
    """Return the current datetime in Indian Standard Time (UTC+5:30)."""
    return datetime.now(tz=IST).replace(tzinfo=None)


def today_ist() -> str:
    """Return today's date string (YYYY-MM-DD) in IST."""
    return datetime.now(tz=IST).strftime("%Y-%m-%d")

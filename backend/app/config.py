"""
SMADS Configuration Module
Loads environment variables and provides app-wide settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "smads_db"

    # JWT Authentication
    JWT_SECRET_KEY: str = "smads-dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Application
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # Safety Thresholds (in minutes unless specified)
    CONTINUOUS_USAGE_THRESHOLD_MINUTES: int = 180     # 3 hours
    DAILY_USAGE_THRESHOLD_MINUTES: int = 480           # 8 hours
    SESSION_FREQUENCY_THRESHOLD: int = 25              # sessions per day
    ADDICTION_INDEX_WARNING_THRESHOLD: float = 65.0
    ADDICTION_INDEX_CRITICAL_THRESHOLD: float = 85.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

from __future__ import annotations

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Personal Resource Agent"
    debug: bool = False
    api_key: str = "dev-api-key-change-me"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/resources_db"

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    embedding_model: str = "gemini-embedding-001"
    embedding_dimensions: int = 768

    # Cloud Tasks (optional, for production)
    gcp_project_id: str = ""
    gcp_location: str = "us-central1"
    cloud_tasks_queue: str = "resource-processing"
    backend_url: str = "http://localhost:8000"

    # Spaced repetition intervals (days)
    review_intervals: list[int] = [1, 3, 7, 14, 30, 60, 120]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()

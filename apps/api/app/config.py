from dataclasses import dataclass
from functools import lru_cache
import os


@dataclass(frozen=True)
class Settings:
    app_name: str = "AI Product Feedback Synthesizer API"
    app_version: str = "0.1.0"
    environment: str = os.getenv("APP_ENV", "development")
    api_prefix: str = "/api"


@lru_cache
def get_settings() -> Settings:
    return Settings()

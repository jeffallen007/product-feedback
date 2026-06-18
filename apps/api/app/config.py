from dataclasses import dataclass, field
from functools import lru_cache
import os


@dataclass(frozen=True)
class Settings:
    app_name: str = "AI Product Feedback Synthesizer API"
    app_version: str = "0.1.0"
    environment: str = field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    api_prefix: str = "/api"
    supabase_url: str | None = field(default_factory=lambda: os.getenv("SUPABASE_URL"))
    supabase_service_role_key: str | None = field(
        default_factory=lambda: os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

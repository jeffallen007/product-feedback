from dataclasses import dataclass, field
from functools import lru_cache
import os


def _parse_frontend_origins() -> list[str]:
    configured = os.getenv("FRONTEND_ORIGINS", "")
    if configured.strip():
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]


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
    openai_api_key: str | None = field(default_factory=lambda: os.getenv("OPENAI_API_KEY"))
    openai_model: str = field(default_factory=lambda: os.getenv("OPENAI_MODEL", "gpt-5.4-mini"))
    frontend_origins: list[str] = field(default_factory=_parse_frontend_origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()

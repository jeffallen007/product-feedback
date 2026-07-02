from dataclasses import dataclass, field
from functools import lru_cache
import logging
import os

logger = logging.getLogger(__name__)


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


def _parse_float_env(name: str, default: float) -> float:
    raw_value = os.getenv(name)
    if raw_value is None or not raw_value.strip():
        return default

    try:
        parsed = float(raw_value)
    except ValueError:
        logger.warning(
            "Invalid float env var; using default. name=%s raw_value=%s default=%s",
            name,
            raw_value,
            default,
        )
        return default

    if parsed <= 0:
        logger.warning(
            "Non-positive float env var; using default. name=%s raw_value=%s default=%s",
            name,
            raw_value,
            default,
        )
        return default

    return parsed


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
    openai_model: str = field(default_factory=lambda: os.getenv("OPENAI_MODEL", "gpt-4.1-mini"))
    openai_timeout_seconds: float = field(
        default_factory=lambda: _parse_float_env("OPENAI_TIMEOUT_SECONDS", 12.0),
    )
    frontend_origins: list[str] = field(default_factory=_parse_frontend_origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()

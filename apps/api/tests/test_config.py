from app.config import get_settings


def test_settings_uses_local_frontend_origins_by_default(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.delenv("FRONTEND_ORIGINS", raising=False)
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.frontend_origins == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    get_settings.cache_clear()


def test_settings_parses_configured_frontend_origins(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setenv(
        "FRONTEND_ORIGINS",
        "https://demo.example.com, https://preview.example.com ",
    )
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.frontend_origins == [
        "https://demo.example.com",
        "https://preview.example.com",
    ]
    get_settings.cache_clear()

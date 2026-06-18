from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.feedback_sets import router as feedback_sets_router
from app.api.health import router as health_router
from app.config import get_settings
from app.errors import MissingSupabaseConfigError, SupabaseInsertError


def handle_missing_supabase_config(
    _request: Request,
    exc: MissingSupabaseConfigError,
) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


def handle_supabase_insert_error(
    _request: Request,
    exc: SupabaseInsertError,
) -> JSONResponse:
    return JSONResponse(
        status_code=502,
        content={"detail": str(exc)},
    )


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.add_exception_handler(
        MissingSupabaseConfigError,
        handle_missing_supabase_config,
    )
    app.add_exception_handler(
        SupabaseInsertError,
        handle_supabase_insert_error,
    )
    app.include_router(health_router)
    app.include_router(feedback_sets_router)
    return app


app = create_app()

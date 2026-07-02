from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.analysis_runs import router as analysis_runs_router
from app.api.feedback_sets import router as feedback_sets_router
from app.api.health import router as health_router
from app.config import get_settings
from app.errors import (
    AnalysisRunNotFoundError,
    EmptyFeedbackSetError,
    FeedbackSetNotFoundError,
    InvalidPastedFeedbackError,
    InvalidDemoProductError,
    MissingSupabaseConfigError,
    SupabaseInsertError,
)


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


def handle_invalid_demo_product(
    _request: Request,
    exc: InvalidDemoProductError,
) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"detail": str(exc)},
    )


def handle_feedback_set_not_found(
    _request: Request,
    exc: FeedbackSetNotFoundError,
) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"detail": str(exc)},
    )


def handle_empty_feedback_set(
    _request: Request,
    exc: EmptyFeedbackSetError,
) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )


def handle_analysis_run_not_found(
    _request: Request,
    exc: AnalysisRunNotFoundError,
) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"detail": str(exc)},
    )


def handle_invalid_pasted_feedback(
    _request: Request,
    exc: InvalidPastedFeedbackError,
) -> JSONResponse:
    return JSONResponse(
        status_code=400,
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
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )
    app.add_exception_handler(
        MissingSupabaseConfigError,
        handle_missing_supabase_config,
    )
    app.add_exception_handler(
        SupabaseInsertError,
        handle_supabase_insert_error,
    )
    app.add_exception_handler(
        InvalidDemoProductError,
        handle_invalid_demo_product,
    )
    app.add_exception_handler(
        FeedbackSetNotFoundError,
        handle_feedback_set_not_found,
    )
    app.add_exception_handler(
        EmptyFeedbackSetError,
        handle_empty_feedback_set,
    )
    app.add_exception_handler(
        AnalysisRunNotFoundError,
        handle_analysis_run_not_found,
    )
    app.add_exception_handler(
        InvalidPastedFeedbackError,
        handle_invalid_pasted_feedback,
    )
    app.include_router(health_router)
    app.include_router(feedback_sets_router)
    app.include_router(analysis_runs_router)
    return app


app = create_app()

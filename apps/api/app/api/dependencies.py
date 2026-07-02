import logging

from app.clients.supabase import SupabaseRestClient
from app.config import get_settings
from app.services.analysis_runs import AnalysisRunService
from app.services.feedback_chat import FeedbackChatService
from app.services.feedback_synthesis import FeedbackSynthesisService
from app.services.feedback_sets import FeedbackSetService

logger = logging.getLogger(__name__)


def get_feedback_set_service() -> FeedbackSetService:
    settings = get_settings()
    client = SupabaseRestClient.from_settings(settings)
    return FeedbackSetService(client)


def get_analysis_run_service() -> AnalysisRunService:
    settings = get_settings()
    client = SupabaseRestClient.from_settings(settings)
    try:
        synthesis_service = FeedbackSynthesisService.from_settings(settings)
    except Exception:
        logger.exception(
            "Failed to initialize LLM synthesis service; using deterministic fallback service. "
            "openai_key_present=%s model=%s timeout_seconds=%s",
            bool(settings.openai_api_key),
            settings.openai_model,
            settings.openai_timeout_seconds,
        )
        synthesis_service = FeedbackSynthesisService(llm_client=None)
    try:
        chat_service = FeedbackChatService.from_settings(settings)
    except Exception:
        logger.exception(
            "Failed to initialize LLM chat service; using deterministic fallback chat. "
            "openai_key_present=%s model=%s timeout_seconds=%s",
            bool(settings.openai_api_key),
            settings.openai_model,
            settings.openai_timeout_seconds,
        )
        chat_service = FeedbackChatService(llm_client=None)
    return AnalysisRunService(client, synthesis_service=synthesis_service, chat_service=chat_service)

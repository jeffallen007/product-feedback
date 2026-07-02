from app.clients.supabase import SupabaseRestClient
from app.config import get_settings
from app.services.analysis_runs import AnalysisRunService
from app.services.feedback_synthesis import FeedbackSynthesisService
from app.services.feedback_sets import FeedbackSetService


def get_feedback_set_service() -> FeedbackSetService:
    settings = get_settings()
    client = SupabaseRestClient.from_settings(settings)
    return FeedbackSetService(client)


def get_analysis_run_service() -> AnalysisRunService:
    settings = get_settings()
    client = SupabaseRestClient.from_settings(settings)
    synthesis_service = FeedbackSynthesisService.from_settings(settings)
    return AnalysisRunService(client, synthesis_service=synthesis_service)

from app.clients.supabase import SupabaseRestClient
from app.config import get_settings
from app.services.feedback_sets import FeedbackSetService


def get_feedback_set_service() -> FeedbackSetService:
    settings = get_settings()
    client = SupabaseRestClient.from_settings(settings)
    return FeedbackSetService(client)

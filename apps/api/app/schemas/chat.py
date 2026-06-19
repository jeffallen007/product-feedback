from datetime import datetime

from app.schemas.base import CamelModel


class AskAnalysisQuestionRequest(CamelModel):
    question: str
    scope: str = "all"


class ChatEvidenceItemResponse(CamelModel):
    feedback_item_id: str
    text: str
    source_label: str
    theme_name: str | None = None
    category: str | None = None


class ChatMessageResponse(CamelModel):
    id: str
    analysis_run_id: str
    role: str
    question: str | None = None
    answer: str | None = None
    scope: str
    evidence: list[ChatEvidenceItemResponse]
    follow_up_suggestions: list[str]
    created_at: datetime | None = None


class AskAnalysisQuestionResponse(CamelModel):
    answer: str
    scope_used: str
    evidence: list[ChatEvidenceItemResponse]
    follow_up_suggestions: list[str]
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse


class GetAnalysisChatHistoryResponse(CamelModel):
    messages: list[ChatMessageResponse]

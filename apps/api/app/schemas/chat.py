from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.feedback_sets import to_camel


class AskAnalysisQuestionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    question: str
    scope: str = "all"


class ChatEvidenceItemResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    feedback_item_id: str
    text: str
    source_label: str
    theme_name: str | None = None
    category: str | None = None


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    analysis_run_id: str
    role: str
    question: str | None = None
    answer: str | None = None
    scope: str
    evidence: list[ChatEvidenceItemResponse]
    follow_up_suggestions: list[str]
    created_at: datetime | None = None


class AskAnalysisQuestionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    answer: str
    scope_used: str
    evidence: list[ChatEvidenceItemResponse]
    follow_up_suggestions: list[str]
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse

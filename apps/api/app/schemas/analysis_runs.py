from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.feedback_sets import to_camel


class SynthesizeFeedbackSetRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    analysis_goal: str | None = None


class AnalysisRunResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    feedback_set_id: str
    status: str
    current_step: str | None = None
    steps: list[dict[str, object]] = []
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None
    metadata: dict[str, object]


class SynthesizeFeedbackSetResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    analysis_run: AnalysisRunResponse


class GetAnalysisRunResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    analysis_run: AnalysisRunResponse
    dashboard: dict[str, object] | None = None
    placeholder_message: str | None = None

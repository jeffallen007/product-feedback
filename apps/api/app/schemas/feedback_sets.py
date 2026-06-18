from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class AnalysisTargetInput(BaseModel):
    name: str = Field(min_length=1)
    description: str = Field(min_length=1)


class CreateFeedbackSetRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    analysis_target: AnalysisTargetInput
    analysis_goal: str = Field(min_length=1)
    name: str | None = None


class AnalysisTargetResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    name: str
    description: str
    created_at: datetime


class FeedbackSetResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    analysis_target_id: str
    name: str | None = None
    analysis_goal: str
    status: str
    total_feedback_count: int
    created_at: datetime
    updated_at: datetime


class CreateFeedbackSetResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    analysis_target: AnalysisTargetResponse
    feedback_set: FeedbackSetResponse

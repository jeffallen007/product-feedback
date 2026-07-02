from datetime import datetime

from app.schemas.base import CamelModel, NonEmptyString, to_camel


class AnalysisTargetInput(CamelModel):
    name: NonEmptyString
    description: NonEmptyString


class CreateFeedbackSetRequest(CamelModel):
    analysis_target: AnalysisTargetInput
    analysis_goal: NonEmptyString
    name: str | None = None


class AnalysisTargetResponse(CamelModel):
    id: str
    name: str
    description: str
    created_at: datetime


class FeedbackSetResponse(CamelModel):
    id: str
    analysis_target_id: str
    name: str | None = None
    analysis_goal: str
    status: str
    total_feedback_count: int
    created_at: datetime
    updated_at: datetime


class DataSourceResponse(CamelModel):
    id: str
    feedback_set_id: str
    source_type: str
    source_label: str
    item_count: int
    status: str
    metadata: dict[str, object]
    created_at: datetime


class CreateFeedbackSetResponse(CamelModel):
    analysis_target: AnalysisTargetResponse
    feedback_set: FeedbackSetResponse


class AddDemoSourceRequest(CamelModel):
    demo_product_id: NonEmptyString


class AddDemoSourceResponse(CamelModel):
    source: DataSourceResponse


class AddPastedSourceRequest(CamelModel):
    pasted_text: str
    source_label: str | None = None


class AddPastedSourceResponse(CamelModel):
    source: DataSourceResponse


class AddCsvSourceResponse(CamelModel):
    source: DataSourceResponse

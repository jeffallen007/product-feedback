from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AnalysisTargetCreate(BaseModel):
    name: str
    description: str


class FeedbackSetCreate(BaseModel):
    analysis_target_id: str
    analysis_goal: str
    name: str | None = None


class DataSourceRecord(BaseModel):
    id: str
    feedback_set_id: str
    source_type: str
    source_label: str
    item_count: int
    status: str
    metadata: dict[str, Any]
    created_at: datetime


class AnalysisRunRecord(BaseModel):
    id: str
    feedback_set_id: str
    status: str
    current_step: str | None = None
    metadata: dict[str, Any]
    started_at: datetime | None = None
    completed_at: datetime | None = None

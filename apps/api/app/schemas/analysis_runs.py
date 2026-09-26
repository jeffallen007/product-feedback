from datetime import datetime
from uuid import UUID

from app.schemas.base import CamelModel
from app.schemas.chat import ChatMessageResponse
from app.schemas.feedback_sets import (
    AnalysisTargetResponse,
    DataSourceResponse,
    FeedbackSetResponse,
)


class SynthesizeFeedbackSetRequest(CamelModel):
    analysis_goal: str | None = None


class QueueAnalysisRunRequest(CamelModel):
    analysis_goal: str | None = None
    request_key: UUID


class AnalysisRunResponse(CamelModel):
    id: str
    feedback_set_id: str
    status: str
    current_step: str | None = None
    steps: list[dict[str, object]] = []
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None
    metadata: dict[str, object]


class QueueAnalysisRunResponse(CamelModel):
    analysis_run: AnalysisRunResponse


class AnalysisRunProgressResponse(CamelModel):
    analysis_run: AnalysisRunResponse


class DashboardContextResponse(CamelModel):
    analysis_run_id: str
    product_name: str
    product_description: str
    goal: str
    processing_method: str
    source_count: int
    feedback_item_count: int
    last_run_at: str


class DashboardSourceMixItemResponse(CamelModel):
    source_id: str
    source_type: str
    label: str
    count: int
    unit: str
    percent: int


class DashboardKpiResponse(CamelModel):
    label: str
    value: str | int


class SentimentBreakdownItemResponse(CamelModel):
    label: str
    value: int


class SentimentBySourceItemResponse(CamelModel):
    source_label: str
    negative_percent: int


class ClassificationSummaryItemResponse(CamelModel):
    category: str
    count: int
    percent: int


class ThemeSummaryResponse(CamelModel):
    id: str
    rank: int
    name: str
    description: str
    count: int
    percent: int
    sentiment: str
    priority: str
    source_coverage: str


class QuoteEvidenceResponse(CamelModel):
    text: str
    source_label: str


class PainPointSummaryResponse(CamelModel):
    title: str
    summary: str
    evidence_count: int
    impact: str
    recommended_action: str
    representative_quotes: list[QuoteEvidenceResponse]


class FeatureRequestSummaryResponse(CamelModel):
    request: str
    user_need: str
    supporting_evidence: str
    priority: str


class RoadmapRecommendationItemResponse(CamelModel):
    title: str
    rationale: str


class RoadmapRecommendationPhaseResponse(CamelModel):
    phase: str
    items: list[RoadmapRecommendationItemResponse]


class RepresentativeQuoteResponse(CamelModel):
    text: str
    source_label: str
    theme_name: str | None = None
    category: str | None = None


class ModelSignalResponse(CamelModel):
    label: str
    value: str


class SentimentBreakdownResponse(CamelModel):
    overall: list[SentimentBreakdownItemResponse]
    by_source: list[SentimentBySourceItemResponse]


class DashboardPayloadResponse(CamelModel):
    analysis_context: DashboardContextResponse
    source_mix: list[DashboardSourceMixItemResponse]
    kpis: list[DashboardKpiResponse]
    executive_summary: str
    sentiment_breakdown: SentimentBreakdownResponse
    classification_summary: list[ClassificationSummaryItemResponse]
    top_themes: list[ThemeSummaryResponse]
    pain_points: list[PainPointSummaryResponse]
    feature_requests: list[FeatureRequestSummaryResponse]
    roadmap_recommendations: list[RoadmapRecommendationPhaseResponse]
    representative_quotes: list[RepresentativeQuoteResponse]
    model_signals: list[ModelSignalResponse]


class SynthesizeFeedbackSetResponse(CamelModel):
    analysis_run: AnalysisRunResponse


class GetAnalysisRunResponse(CamelModel):
    analysis_run: AnalysisRunResponse
    dashboard: DashboardPayloadResponse | None = None
    placeholder_message: str | None = None


class AnalysisRunBundleResponse(CamelModel):
    analysis_run: AnalysisRunResponse
    feedback_set: FeedbackSetResponse
    analysis_target: AnalysisTargetResponse
    sources: list[DataSourceResponse]
    dashboard: DashboardPayloadResponse | None = None
    chat_history: list[ChatMessageResponse]
    placeholder_message: str | None = None

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


class DashboardContextResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    analysis_run_id: str
    product_name: str
    product_description: str
    goal: str
    processing_method: str
    source_count: int
    feedback_item_count: int
    last_run_at: str


class DashboardSourceMixItemResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    source_id: str
    source_type: str
    label: str
    count: int
    unit: str
    percent: int


class DashboardKpiResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    label: str
    value: str | int


class SentimentBreakdownItemResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    label: str
    value: int


class SentimentBySourceItemResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    source_label: str
    negative_percent: int


class ClassificationSummaryItemResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    category: str
    count: int
    percent: int


class ThemeSummaryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    rank: int
    name: str
    description: str
    count: int
    percent: int
    sentiment: str
    priority: str
    source_coverage: str


class QuoteEvidenceResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    text: str
    source_label: str


class PainPointSummaryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    title: str
    summary: str
    evidence_count: int
    impact: str
    recommended_action: str
    representative_quotes: list[QuoteEvidenceResponse]


class FeatureRequestSummaryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    request: str
    user_need: str
    supporting_evidence: str
    priority: str


class RoadmapRecommendationItemResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    title: str
    rationale: str


class RoadmapRecommendationPhaseResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    phase: str
    items: list[RoadmapRecommendationItemResponse]


class RepresentativeQuoteResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    text: str
    source_label: str
    theme_name: str | None = None
    category: str | None = None


class ModelSignalResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    label: str
    value: str


class SentimentBreakdownResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    overall: list[SentimentBreakdownItemResponse]
    by_source: list[SentimentBySourceItemResponse]


class DashboardPayloadResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

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


class SynthesizeFeedbackSetResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    analysis_run: AnalysisRunResponse


class GetAnalysisRunResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    analysis_run: AnalysisRunResponse
    dashboard: DashboardPayloadResponse | None = None
    placeholder_message: str | None = None

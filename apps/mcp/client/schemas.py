from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class AgentModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CreateFeedbackSetInput(AgentModel):
    product_name: str = Field(min_length=1)
    product_description: str = Field(min_length=1)
    analysis_goal: str = Field(min_length=1)


class CreateFeedbackSetOutput(AgentModel):
    feedback_set_id: str
    status: Literal["created"]


class AddPastedFeedbackInput(AgentModel):
    feedback_set_id: str = Field(min_length=1)
    text: str = Field(min_length=1)


class AddPastedFeedbackOutput(AgentModel):
    feedback_set_id: str
    source_type: Literal["pasted_text"]
    items_created: int
    status: Literal["ingested"]


class RunSynthesisInput(AgentModel):
    feedback_set_id: str = Field(min_length=1)


class RunSynthesisOutput(AgentModel):
    analysis_run_id: str
    feedback_set_id: str
    status: str
    synthesis_method: str


class GetAnalysisBundleInput(AgentModel):
    analysis_run_id: str = Field(min_length=1)


class AnalysisBundleOutput(AgentModel):
    analysis_run_id: str
    product_name: str
    executive_summary: str
    top_themes: list[dict[str, Any]]
    pain_points: list[dict[str, Any]]
    feature_requests: list[dict[str, Any]]
    roadmap_recommendations: list[dict[str, Any]]
    source_mix: list[dict[str, Any]]
    representative_quotes: list[dict[str, Any]]


class AskAnalysisQuestionInput(AgentModel):
    analysis_run_id: str = Field(min_length=1)
    question: str = Field(min_length=1)


class AskAnalysisQuestionOutput(AgentModel):
    analysis_run_id: str
    answer: str
    chat_method: str
    evidence: list[dict[str, Any]]


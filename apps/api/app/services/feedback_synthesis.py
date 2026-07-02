from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Protocol

import httpx
from pydantic import BaseModel, ValidationError

from app.config import Settings
from app.demo_synthesis import build_demo_dashboard_payload
from app.schemas.analysis_runs import DashboardPayloadResponse


logger = logging.getLogger(__name__)

MAX_PROMPT_FEEDBACK_ITEMS = 120
MAX_PROMPT_FEEDBACK_CHARS = 45000


class TopThemeModel(BaseModel):
    id: str
    rank: int
    name: str
    description: str
    count: int
    percent: int
    sentiment: str
    priority: str
    sourceCoverage: str


class QuoteEvidenceModel(BaseModel):
    text: str
    sourceLabel: str


class PainPointModel(BaseModel):
    title: str
    summary: str
    evidenceCount: int
    impact: str
    recommendedAction: str
    representativeQuotes: list[QuoteEvidenceModel]


class FeatureRequestModel(BaseModel):
    request: str
    userNeed: str
    supportingEvidence: str
    priority: str


class RoadmapItemModel(BaseModel):
    title: str
    rationale: str


class RoadmapPhaseModel(BaseModel):
    phase: str
    items: list[RoadmapItemModel]


class RepresentativeQuoteModel(BaseModel):
    text: str
    sourceLabel: str
    themeName: str | None = None
    category: str | None = None


class ModelSignalModel(BaseModel):
    label: str
    value: str


class LLMSynthesisSections(BaseModel):
    executiveSummary: str
    topThemes: list[TopThemeModel]
    painPoints: list[PainPointModel]
    featureRequests: list[FeatureRequestModel]
    roadmapRecommendations: list[RoadmapPhaseModel]
    representativeQuotes: list[RepresentativeQuoteModel]
    modelSignals: list[ModelSignalModel]


@dataclass(frozen=True)
class SynthesisRequest:
    analysis_run_id: str
    analysis_goal: str
    product_name: str
    product_description: str
    completed_at: str
    dataset_id: str | None
    sources: list[dict[str, Any]]
    feedback_items: list[dict[str, Any]]


@dataclass(frozen=True)
class SynthesisResult:
    dashboard_payload: DashboardPayloadResponse
    metadata: dict[str, object]


class StructuredLLMClient(Protocol):
    def create_structured_output(
        self,
        *,
        developer_prompt: str,
        user_prompt: str,
        schema: dict[str, Any],
    ) -> str: ...


class OpenAIResponsesClient:
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        timeout_seconds: float,
        base_url: str = "https://api.openai.com/v1/responses",
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._timeout_seconds = timeout_seconds
        self._base_url = base_url

    @classmethod
    def from_settings(cls, settings: Settings) -> OpenAIResponsesClient | None:
        if not settings.openai_api_key:
            return None
        return cls(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            timeout_seconds=settings.openai_timeout_seconds,
        )

    @property
    def model(self) -> str:
        return self._model

    def create_structured_output(
        self,
        *,
        developer_prompt: str,
        user_prompt: str,
        schema: dict[str, Any],
    ) -> str:
        payload = {
            "model": self._model,
            "input": [
                {
                    "role": "developer",
                    "content": [{"type": "input_text", "text": developer_prompt}],
                },
                {
                    "role": "user",
                    "content": [{"type": "input_text", "text": user_prompt}],
                },
            ],
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "feedback_synthesis_sections",
                    "strict": True,
                    "schema": schema,
                }
            },
            "temperature": 0.2,
            "store": False,
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        try:
            timeout = httpx.Timeout(
                timeout=self._timeout_seconds,
                connect=min(self._timeout_seconds, 5.0),
            )
            with httpx.Client(timeout=timeout) as client:
                response = client.post(self._base_url, headers=headers, json=payload)
        except httpx.HTTPError as exc:
            raise RuntimeError("OpenAI Responses API request failed.") from exc

        if response.status_code >= 400:
            error_excerpt = response.text[:500]
            raise RuntimeError(
                f"OpenAI Responses API returned status {response.status_code}: {error_excerpt}",
            )

        body = response.json()
        output_text = self._extract_output_text(body)
        if not output_text:
            raise RuntimeError("OpenAI Responses API returned no output text.")
        return output_text

    @staticmethod
    def _extract_output_text(body: dict[str, Any]) -> str | None:
        output = body.get("output", [])
        if not isinstance(output, list):
            return None

        for item in output:
            if not isinstance(item, dict) or item.get("type") != "message":
                continue
            content = item.get("content", [])
            if not isinstance(content, list):
                continue
            for part in content:
                if not isinstance(part, dict):
                    continue
                if part.get("type") == "output_text" and isinstance(part.get("text"), str):
                    return str(part["text"])
                if part.get("type") == "refusal":
                    raise RuntimeError(f"OpenAI model refusal: {part.get('refusal', 'No reason provided')}")
        return None


class FeedbackSynthesisService:
    def __init__(
        self,
        *,
        llm_client: StructuredLLMClient | None,
        llm_model: str | None = None,
    ) -> None:
        self._llm_client = llm_client
        self._llm_model = llm_model

    @classmethod
    def from_settings(cls, settings: Settings) -> FeedbackSynthesisService:
        llm_client = OpenAIResponsesClient.from_settings(settings)
        return cls(
            llm_client=llm_client,
            llm_model=llm_client.model if llm_client is not None else None,
        )

    def synthesize(self, request: SynthesisRequest) -> SynthesisResult:
        if self._llm_client is None:
            return self._build_fallback_result(
                request,
                fallback_reason="missing_openai_api_key",
            )

        try:
            llm_sections = self._run_llm(request)
            dashboard_payload = self._merge_llm_sections(request, llm_sections)
            metadata = {
                "synthesis_method": "llm_openai",
                "llm_model": self._llm_model,
                "included_feedback_item_count": self._count_prompt_items(request),
                "total_feedback_item_count": len(request.feedback_items),
            }
            return SynthesisResult(dashboard_payload=dashboard_payload, metadata=metadata)
        except Exception as exc:
            logger.exception(
                "LLM synthesis failed; falling back to deterministic synthesis. "
                "model=%s reason=%s",
                self._llm_model,
                exc,
            )
            return self._build_fallback_result(
                request,
                fallback_reason=f"llm_error:{exc}",
                llm_model=self._llm_model,
            )

    def _run_llm(self, request: SynthesisRequest) -> LLMSynthesisSections:
        selected_items, selected_count, selected_chars = self._select_feedback_for_prompt(
            request.feedback_items,
        )
        source_summary = [
            {
                "source_label": str(source.get("source_label")),
                "source_type": str(source.get("source_type")),
                "item_count": int(source.get("item_count", 0)),
            }
            for source in request.sources
        ]
        developer_prompt = (
            "You are a senior product research analyst synthesizing customer feedback for a product team. "
            "Base findings only on the supplied feedback. Do not invent customer quotes. "
            "Use concise product-leader language. Prioritize insights by frequency, severity, and business impact. "
            "Return valid JSON only and match the supplied schema exactly."
        )
        user_prompt = json.dumps(
            {
                "analysis_goal": request.analysis_goal,
                "product_name": request.product_name,
                "product_description": request.product_description,
                "total_feedback_item_count": len(request.feedback_items),
                "included_feedback_item_count": selected_count,
                "included_feedback_characters": selected_chars,
                "source_summary": source_summary,
                "instructions": {
                    "top_themes": "Return the most important recurring themes with concise descriptions, counts, percents, sentiment, priority, and source coverage.",
                    "pain_points": "Call out concrete pain points, the impact on users/business, and recommended actions.",
                    "feature_requests": "Highlight requested capabilities tied to clear user needs.",
                    "roadmap_recommendations": "Group recommended actions into Now, Next, and Later phases.",
                    "representative_quotes": "Use exact customer quotes copied from the provided feedback items only.",
                    "model_signals": "Use these for confidence notes, churn/retention risks, product areas affected, and recommended next actions.",
                },
                "feedback_items": selected_items,
            },
            ensure_ascii=True,
        )
        raw_output = self._llm_client.create_structured_output(
            developer_prompt=developer_prompt,
            user_prompt=user_prompt,
            schema=self._llm_output_schema(),
        )
        try:
            payload = json.loads(raw_output)
        except json.JSONDecodeError as exc:
            raise RuntimeError("LLM response was not valid JSON.") from exc
        try:
            return LLMSynthesisSections.model_validate(payload)
        except ValidationError as exc:
            raise RuntimeError("LLM response did not match the expected schema.") from exc

    def _merge_llm_sections(
        self,
        request: SynthesisRequest,
        llm_sections: LLMSynthesisSections,
    ) -> DashboardPayloadResponse:
        base_payload = self._build_deterministic_payload(
            request,
            processing_method="LLM OpenAI Feedback Synthesis",
        )
        validated_quotes = self._validate_quotes(
            feedback_items=request.feedback_items,
            llm_quotes=llm_sections.representativeQuotes,
            fallback_quotes=base_payload.representative_quotes,
        )
        validated_pain_points = self._validate_pain_point_quotes(
            feedback_items=request.feedback_items,
            llm_pain_points=llm_sections.painPoints,
            fallback_pain_points=base_payload.pain_points,
        )
        payload = base_payload.model_dump(by_alias=True)
        payload.update(
            {
                "executiveSummary": llm_sections.executiveSummary,
                "topThemes": [item.model_dump(by_alias=True) for item in llm_sections.topThemes],
                "painPoints": validated_pain_points,
                "featureRequests": [item.model_dump(by_alias=True) for item in llm_sections.featureRequests],
                "roadmapRecommendations": [
                    item.model_dump(by_alias=True) for item in llm_sections.roadmapRecommendations
                ],
                "representativeQuotes": validated_quotes,
                "modelSignals": [item.model_dump(by_alias=True) for item in llm_sections.modelSignals],
            }
        )
        return DashboardPayloadResponse.model_validate(payload)

    def _build_fallback_result(
        self,
        request: SynthesisRequest,
        *,
        fallback_reason: str,
        llm_model: str | None = None,
    ) -> SynthesisResult:
        dashboard_payload = self._build_deterministic_payload(
            request,
            processing_method="Deterministic Feedback Synthesis Fallback",
        )
        metadata = {
            "synthesis_method": "deterministic_fallback",
            "fallback_reason": fallback_reason,
            "included_feedback_item_count": len(request.feedback_items),
            "total_feedback_item_count": len(request.feedback_items),
        }
        if llm_model:
            metadata["llm_model"] = llm_model
        return SynthesisResult(dashboard_payload=dashboard_payload, metadata=metadata)

    def _build_deterministic_payload(
        self,
        request: SynthesisRequest,
        *,
        processing_method: str,
    ) -> DashboardPayloadResponse:
        return DashboardPayloadResponse.model_validate(
            build_demo_dashboard_payload(
                dataset_id=request.dataset_id,
                analysis_run_id=request.analysis_run_id,
                analysis_goal=request.analysis_goal,
                completed_at=request.completed_at,
                product_name=request.product_name,
                product_description=request.product_description,
                sources=request.sources,
                feedback_items=request.feedback_items,
                processing_method=processing_method,
            )
        )

    @staticmethod
    def _normalize_for_match(text: str) -> str:
        return " ".join(text.split()).strip()

    def _validate_quotes(
        self,
        *,
        feedback_items: list[dict[str, Any]],
        llm_quotes: list[RepresentativeQuoteModel],
        fallback_quotes: list[Any],
    ) -> list[dict[str, Any]]:
        valid_texts = {
            self._normalize_for_match(str(item.get("raw_text") or "")): item
            for item in feedback_items
            if str(item.get("raw_text") or "").strip()
        }
        validated: list[dict[str, Any]] = []
        for quote in llm_quotes:
            matched_item = valid_texts.get(self._normalize_for_match(quote.text))
            if matched_item is None:
                continue
            validated.append(
                {
                    "text": str(matched_item.get("raw_text")),
                    "sourceLabel": quote.sourceLabel or str(matched_item.get("source_label")),
                    "themeName": quote.themeName,
                    "category": quote.category,
                }
            )
        if validated:
            return validated[:4]
        return [
            {
                "text": item.text,
                "sourceLabel": item.source_label,
                "themeName": item.theme_name,
                "category": item.category,
            }
            for item in fallback_quotes[:4]
        ]

    def _validate_pain_point_quotes(
        self,
        *,
        feedback_items: list[dict[str, Any]],
        llm_pain_points: list[PainPointModel],
        fallback_pain_points: list[Any],
    ) -> list[dict[str, Any]]:
        valid_texts = {
            self._normalize_for_match(str(item.get("raw_text") or "")): item
            for item in feedback_items
            if str(item.get("raw_text") or "").strip()
        }
        validated: list[dict[str, Any]] = []
        for index, pain_point in enumerate(llm_pain_points[:3]):
            quotes = []
            for quote in pain_point.representativeQuotes:
                matched_item = valid_texts.get(self._normalize_for_match(quote.text))
                if matched_item is None:
                    continue
                quotes.append(
                    {
                        "text": str(matched_item.get("raw_text")),
                        "sourceLabel": quote.sourceLabel or str(matched_item.get("source_label")),
                    }
                )
            fallback_quotes = []
            if index < len(fallback_pain_points):
                fallback_quotes = [
                    {"text": quote.text, "sourceLabel": quote.source_label}
                    for quote in fallback_pain_points[index].representative_quotes[:2]
                ]
            validated.append(
                {
                    "title": pain_point.title,
                    "summary": pain_point.summary,
                    "evidenceCount": pain_point.evidenceCount,
                    "impact": pain_point.impact,
                    "recommendedAction": pain_point.recommendedAction,
                    "representativeQuotes": quotes[:2] or fallback_quotes,
                }
            )
        return validated or [
            {
                "title": pain_point.title,
                "summary": pain_point.summary,
                "evidenceCount": pain_point.evidence_count,
                "impact": pain_point.impact,
                "recommendedAction": pain_point.recommended_action,
                "representativeQuotes": [
                    {"text": quote.text, "sourceLabel": quote.source_label}
                    for quote in pain_point.representative_quotes[:2]
                ],
            }
            for pain_point in fallback_pain_points[:3]
        ]

    def _select_feedback_for_prompt(
        self,
        feedback_items: list[dict[str, Any]],
    ) -> tuple[list[dict[str, object]], int, int]:
        severity_rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        sentiment_rank = {"negative": 0, "mixed": 1, "neutral": 2, "positive": 3}
        sorted_items = sorted(
            feedback_items,
            key=lambda item: (
                severity_rank.get(str(item.get("severity")), 9),
                0 if bool(item.get("churn_risk")) else 1,
                sentiment_rank.get(str(item.get("sentiment")), 9),
                float(item.get("rating")) if item.get("rating") is not None else 99.0,
                -len(str(item.get("raw_text") or "")),
                str(item.get("id") or ""),
            ),
        )
        selected: list[dict[str, object]] = []
        total_chars = 0
        for item in sorted_items:
            if len(selected) >= MAX_PROMPT_FEEDBACK_ITEMS:
                break
            text = str(item.get("raw_text") or "").strip()
            if not text:
                continue
            row = {
                "id": str(item.get("id")),
                "source_label": str(item.get("source_label")),
                "source_type": str(item.get("source_type")),
                "rating": item.get("rating"),
                "feedback_date": item.get("feedback_date"),
                "author_handle": item.get("author_handle"),
                "category": item.get("category"),
                "sentiment": item.get("sentiment"),
                "severity": item.get("severity"),
                "churn_risk": item.get("churn_risk"),
                "feedback_text": text,
            }
            row_chars = len(text)
            if selected and total_chars + row_chars > MAX_PROMPT_FEEDBACK_CHARS:
                continue
            selected.append(row)
            total_chars += row_chars

        if not selected:
            for item in sorted_items[: min(len(sorted_items), 10)]:
                text = str(item.get("raw_text") or "").strip()
                if not text:
                    continue
                selected.append(
                    {
                        "id": str(item.get("id")),
                        "source_label": str(item.get("source_label")),
                        "source_type": str(item.get("source_type")),
                        "rating": item.get("rating"),
                        "feedback_date": item.get("feedback_date"),
                        "author_handle": item.get("author_handle"),
                        "category": item.get("category"),
                        "sentiment": item.get("sentiment"),
                        "severity": item.get("severity"),
                        "churn_risk": item.get("churn_risk"),
                        "feedback_text": text[:2000],
                    }
                )
            total_chars = sum(len(str(item["feedback_text"])) for item in selected)

        return selected, len(selected), total_chars

    def _count_prompt_items(self, request: SynthesisRequest) -> int:
        selected_items, _selected_count, _selected_chars = self._select_feedback_for_prompt(
            request.feedback_items,
        )
        return len(selected_items)

    @staticmethod
    def _llm_output_schema() -> dict[str, Any]:
        return {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "executiveSummary",
                "topThemes",
                "painPoints",
                "featureRequests",
                "roadmapRecommendations",
                "representativeQuotes",
                "modelSignals",
            ],
            "properties": {
                "executiveSummary": {"type": "string"},
                "topThemes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": [
                            "id",
                            "rank",
                            "name",
                            "description",
                            "count",
                            "percent",
                            "sentiment",
                            "priority",
                            "sourceCoverage",
                        ],
                        "properties": {
                            "id": {"type": "string"},
                            "rank": {"type": "integer"},
                            "name": {"type": "string"},
                            "description": {"type": "string"},
                            "count": {"type": "integer"},
                            "percent": {"type": "integer"},
                            "sentiment": {"type": "string"},
                            "priority": {"type": "string"},
                            "sourceCoverage": {"type": "string"},
                        },
                    },
                },
                "painPoints": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": [
                            "title",
                            "summary",
                            "evidenceCount",
                            "impact",
                            "recommendedAction",
                            "representativeQuotes",
                        ],
                        "properties": {
                            "title": {"type": "string"},
                            "summary": {"type": "string"},
                            "evidenceCount": {"type": "integer"},
                            "impact": {"type": "string"},
                            "recommendedAction": {"type": "string"},
                            "representativeQuotes": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "additionalProperties": False,
                                    "required": ["text", "sourceLabel"],
                                    "properties": {
                                        "text": {"type": "string"},
                                        "sourceLabel": {"type": "string"},
                                    },
                                },
                            },
                        },
                    },
                },
                "featureRequests": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["request", "userNeed", "supportingEvidence", "priority"],
                        "properties": {
                            "request": {"type": "string"},
                            "userNeed": {"type": "string"},
                            "supportingEvidence": {"type": "string"},
                            "priority": {"type": "string"},
                        },
                    },
                },
                "roadmapRecommendations": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["phase", "items"],
                        "properties": {
                            "phase": {"type": "string"},
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "additionalProperties": False,
                                    "required": ["title", "rationale"],
                                    "properties": {
                                        "title": {"type": "string"},
                                        "rationale": {"type": "string"},
                                    },
                                },
                            },
                        },
                    },
                },
                "representativeQuotes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["text", "sourceLabel", "themeName", "category"],
                        "properties": {
                            "text": {"type": "string"},
                            "sourceLabel": {"type": "string"},
                            "themeName": {"type": ["string", "null"]},
                            "category": {"type": ["string", "null"]},
                        },
                    },
                },
                "modelSignals": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["label", "value"],
                        "properties": {
                            "label": {"type": "string"},
                            "value": {"type": "string"},
                        },
                    },
                },
            },
        }


def iso_now() -> str:
    return datetime.now(UTC).isoformat()


def infer_generic_feedback_attributes(item: dict[str, Any]) -> dict[str, Any]:
    metadata = item.get("metadata_json", {})
    normalized_metadata = dict(metadata) if isinstance(metadata, dict) else {}
    text = str(item.get("normalized_text") or item.get("raw_text") or "").lower()
    rating = _coerce_number(item.get("rating"))

    category = str(item.get("category")) if item.get("category") else None
    sentiment = str(item.get("sentiment")) if item.get("sentiment") else None
    severity = str(item.get("severity")) if item.get("severity") else None
    churn_risk = item.get("churn_risk")

    if category is None:
        if any(token in text for token in ("bug", "crash", "broken", "error", "fail")):
            category = "bug_report"
        elif any(token in text for token in ("feature", "add", "would love", "please add", "wish")):
            category = "feature_request"
        elif any(token in text for token in ("slow", "lag", "freeze", "loading", "performance")):
            category = "performance_issue"
        elif any(token in text for token in ("price", "pricing", "expensive", "cost")):
            category = "pricing_concern"
        elif any(token in text for token in ("setup", "onboard", "confusing", "hard to use")):
            category = "onboarding_friction"
        elif any(token in text for token in ("support", "help desk", "customer service")):
            category = "support_complaint"
        elif rating is not None and rating >= 4:
            category = "positive_feedback"
        else:
            category = "ux_issue" if any(token in text for token in ("difficult", "friction", "annoying")) else "unknown"

    if sentiment is None:
        if rating is not None:
            if rating >= 4:
                sentiment = "positive"
            elif rating <= 2:
                sentiment = "negative"
            else:
                sentiment = "mixed"
        elif any(token in text for token in ("love", "great", "helpful", "excellent")):
            sentiment = "positive"
        elif any(token in text for token in ("hate", "bad", "terrible", "broken", "frustrating")):
            sentiment = "negative"
        else:
            sentiment = "neutral"

    if severity is None:
        if any(token in text for token in ("crash", "blocked", "unusable", "lost data")):
            severity = "high"
        elif category in {"performance_issue", "bug_report", "support_complaint"}:
            severity = "medium"
        elif sentiment == "positive":
            severity = "low"
        else:
            severity = "medium"

    if churn_risk is None:
        churn_risk = bool(
            (rating is not None and rating <= 2)
            or any(token in text for token in ("cancel", "churn", "switch", "uninstall", "leave"))
        )

    normalized_metadata.update(
        {
            "category": category,
            "sentiment": sentiment,
            "severity": severity,
            "churn_risk": churn_risk,
        }
    )
    return {
        "category": category,
        "sentiment": sentiment,
        "severity": severity,
        "churn_risk": churn_risk,
        "metadata_json": normalized_metadata,
    }


def _coerce_number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

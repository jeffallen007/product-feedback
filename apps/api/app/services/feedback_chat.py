from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import Any, Protocol

from pydantic import BaseModel, ValidationError

from app.config import Settings
from app.schemas.analysis_runs import DashboardPayloadResponse
from app.schemas.chat import ChatEvidenceItemResponse, ChatMessageResponse
from app.services.feedback_synthesis import OpenAIResponsesClient


logger = logging.getLogger(__name__)

MAX_CHAT_FEEDBACK_SNIPPETS = 40
MAX_CHAT_FEEDBACK_CHARS = 18000
MAX_CHAT_HISTORY_MESSAGES = 6


class ChatLLMClient(Protocol):
    @property
    def model(self) -> str: ...

    def create_structured_output(
        self,
        *,
        developer_prompt: str,
        user_prompt: str,
        schema: dict[str, Any],
    ) -> str: ...


class LLMChatEvidenceModel(BaseModel):
    feedbackItemId: str


class LLMChatResponseModel(BaseModel):
    answer: str
    evidence: list[LLMChatEvidenceModel]
    followUpSuggestions: list[str]


@dataclass(frozen=True)
class FeedbackChatRequest:
    analysis_run_id: str
    question: str
    scope: str
    analysis_goal: str
    product_name: str
    product_description: str
    sources: list[dict[str, Any]]
    feedback_items: list[dict[str, Any]]
    dashboard_payload: DashboardPayloadResponse | None
    chat_history: list[ChatMessageResponse]


@dataclass(frozen=True)
class FeedbackChatResult:
    answer: str
    evidence: list[ChatEvidenceItemResponse]
    follow_up_suggestions: list[str]
    metadata: dict[str, object]


class FeedbackChatService:
    def __init__(
        self,
        *,
        llm_client: ChatLLMClient | None,
        llm_model: str | None = None,
        llm_timeout_seconds: float | None = None,
    ) -> None:
        self._llm_client = llm_client
        self._llm_model = llm_model
        self._llm_timeout_seconds = llm_timeout_seconds

    @classmethod
    def from_settings(cls, settings: Settings) -> FeedbackChatService:
        llm_client = OpenAIResponsesClient.from_settings(settings)
        return cls(
            llm_client=llm_client,
            llm_model=llm_client.model if llm_client is not None else None,
            llm_timeout_seconds=settings.openai_timeout_seconds,
        )

    def answer(self, request: FeedbackChatRequest) -> FeedbackChatResult | None:
        if self._llm_client is None:
            logger.info(
                "LLM chat unavailable; using deterministic fallback. analysis_run_id=%s reason=%s",
                request.analysis_run_id,
                "missing_openai_api_key",
            )
            return None

        try:
            selected_items, selected_count, selected_chars = self._select_feedback_for_prompt(
                question=request.question,
                feedback_items=request.feedback_items,
            )
            logger.info(
                "Starting LLM chat attempt. analysis_run_id=%s model=%s included_feedback_item_count=%s",
                request.analysis_run_id,
                self._llm_model,
                selected_count,
            )
            llm_response = self._run_llm(
                request=request,
                selected_items=selected_items,
                selected_count=selected_count,
                selected_chars=selected_chars,
            )
            answer = llm_response.answer.strip()
            if not answer:
                raise RuntimeError("LLM chat response was empty.")

            evidence = self._resolve_llm_evidence(
                llm_response=llm_response,
                selected_items=selected_items,
                feedback_items=request.feedback_items,
                dashboard_payload=request.dashboard_payload,
            )
            logger.info(
                "LLM chat succeeded. analysis_run_id=%s model=%s included_feedback_item_count=%s",
                request.analysis_run_id,
                self._llm_model,
                selected_count,
            )
            return FeedbackChatResult(
                answer=answer,
                evidence=evidence,
                follow_up_suggestions=self._normalize_follow_ups(llm_response.followUpSuggestions),
                metadata={
                    "chat_method": "llm_openai",
                    "llm_model": self._llm_model,
                    "included_context_counts": {
                        "total_feedback_item_count": len(request.feedback_items),
                        "included_feedback_item_count": selected_count,
                        "included_feedback_characters": selected_chars,
                    },
                },
            )
        except Exception as exc:
            logger.exception(
                "LLM chat failed; using deterministic fallback. analysis_run_id=%s model=%s reason=%s",
                request.analysis_run_id,
                self._llm_model,
                exc,
            )
            return None

    def _run_llm(
        self,
        *,
        request: FeedbackChatRequest,
        selected_items: list[dict[str, object]],
        selected_count: int,
        selected_chars: int,
    ) -> LLMChatResponseModel:
        raw_output = self._llm_client.create_structured_output(
            developer_prompt=self._developer_prompt(),
            user_prompt=self._build_user_prompt(
                request=request,
                selected_items=selected_items,
                selected_count=selected_count,
                selected_chars=selected_chars,
            ),
            schema=self._llm_output_schema(),
        )
        try:
            payload = json.loads(raw_output)
        except json.JSONDecodeError as exc:
            raise RuntimeError("LLM chat response was not valid JSON.") from exc
        try:
            return LLMChatResponseModel.model_validate(payload)
        except ValidationError as exc:
            raise RuntimeError("LLM chat response did not match the expected schema.") from exc

    @staticmethod
    def _developer_prompt() -> str:
        return (
            "You are a senior product strategy analyst answering follow-up questions about customer feedback. "
            "Use only the supplied analysis bundle, chat history, and feedback snippets. "
            "Do not invent facts, metrics, customer segments, or quotes. "
            "If the evidence is thin or absent, say that directly. "
            "Use concise product-leader language and prefer bullets for multi-part answers. "
            "Return valid JSON only and match the supplied schema exactly."
        )

    def _build_user_prompt(
        self,
        *,
        request: FeedbackChatRequest,
        selected_items: list[dict[str, object]],
        selected_count: int,
        selected_chars: int,
    ) -> str:
        dashboard = request.dashboard_payload
        context = {
            "question": request.question,
            "scope": request.scope,
            "product_name": request.product_name,
            "product_description": request.product_description,
            "analysis_goal": request.analysis_goal,
            "source_mix": self._source_summary(request.sources),
            "total_feedback_item_count": len(request.feedback_items),
            "included_feedback_item_count": selected_count,
            "included_feedback_characters": selected_chars,
            "executive_summary": dashboard.executive_summary if dashboard else None,
            "top_themes": [item.model_dump(by_alias=True) for item in dashboard.top_themes[:6]] if dashboard else [],
            "pain_points": [item.model_dump(by_alias=True) for item in dashboard.pain_points[:6]] if dashboard else [],
            "feature_requests": [item.model_dump(by_alias=True) for item in dashboard.feature_requests[:6]] if dashboard else [],
            "roadmap_recommendations": [
                item.model_dump(by_alias=True) for item in dashboard.roadmap_recommendations[:4]
            ]
            if dashboard
            else [],
            "representative_quotes": [
                item.model_dump(by_alias=True) for item in dashboard.representative_quotes[:8]
            ]
            if dashboard
            else [],
            "recent_chat_history": self._chat_history_context(request.chat_history),
            "feedback_snippets": selected_items,
            "answer_instructions": [
                "Answer the user's question directly.",
                "Ground the answer in the analysis bundle first, then feedback snippets.",
                "When citing evidence, use only supplied representative quotes or feedback snippets.",
                "Mention when only a sample of feedback snippets was included.",
                "Return 2-4 follow-up suggestions that would be useful to a PM.",
                "For evidence, return feedbackItemId values from supplied feedback_snippets only.",
            ],
        }
        return json.dumps(context, ensure_ascii=True)

    @staticmethod
    def _source_summary(sources: list[dict[str, Any]]) -> list[dict[str, object]]:
        return [
            {
                "source_label": str(source.get("source_label")),
                "source_type": str(source.get("source_type")),
                "item_count": int(source.get("item_count", 0)),
            }
            for source in sources
        ]

    @staticmethod
    def _chat_history_context(chat_history: list[ChatMessageResponse]) -> list[dict[str, object]]:
        recent = chat_history[-MAX_CHAT_HISTORY_MESSAGES:]
        return [
            {
                "role": message.role,
                "question": message.question,
                "answer": message.answer,
            }
            for message in recent
        ]

    def _select_feedback_for_prompt(
        self,
        *,
        question: str,
        feedback_items: list[dict[str, Any]],
    ) -> tuple[list[dict[str, object]], int, int]:
        terms = self._question_terms(question)
        ranked_items = sorted(
            feedback_items,
            key=lambda item: (
                -self._match_score(item, terms),
                self._severity_rank(str(item.get("severity"))),
                0 if bool(item.get("churn_risk")) else 1,
                self._sentiment_rank(str(item.get("sentiment"))),
                float(item.get("rating")) if item.get("rating") is not None else 99.0,
                str(item.get("id") or ""),
            ),
        )

        selected: list[dict[str, object]] = []
        total_chars = 0
        for item in ranked_items:
            if len(selected) >= MAX_CHAT_FEEDBACK_SNIPPETS:
                break
            text = str(item.get("raw_text") or item.get("normalized_text") or "").strip()
            if not text:
                continue
            clipped_text = text[:1000]
            if selected and total_chars + len(clipped_text) > MAX_CHAT_FEEDBACK_CHARS:
                continue
            selected.append(
                {
                    "feedbackItemId": str(item.get("id")),
                    "sourceLabel": str(item.get("source_label")),
                    "sourceType": str(item.get("source_type")),
                    "rating": item.get("rating"),
                    "category": item.get("category"),
                    "sentiment": item.get("sentiment"),
                    "severity": item.get("severity"),
                    "churnRisk": item.get("churn_risk"),
                    "themeName": item.get("theme_name"),
                    "feedbackText": clipped_text,
                }
            )
            total_chars += len(clipped_text)

        return selected, len(selected), total_chars

    @staticmethod
    def _question_terms(question: str) -> set[str]:
        stop_words = {
            "about",
            "after",
            "are",
            "biggest",
            "build",
            "customer",
            "customers",
            "does",
            "feedback",
            "first",
            "give",
            "have",
            "most",
            "next",
            "pain",
            "points",
            "product",
            "recommendation",
            "should",
            "strongest",
            "that",
            "the",
            "there",
            "this",
            "users",
            "what",
            "which",
        }
        return {
            token
            for token in re.findall(r"[a-z0-9]+", question.lower())
            if len(token) >= 4 and token not in stop_words
        }

    @staticmethod
    def _match_score(item: dict[str, Any], terms: set[str]) -> int:
        if not terms:
            return 0
        haystack = " ".join(
            str(value or "")
            for value in [
                item.get("raw_text"),
                item.get("normalized_text"),
                item.get("category"),
                item.get("theme_name"),
                item.get("sentiment"),
                item.get("severity"),
            ]
        ).lower()
        metadata = item.get("metadata_json")
        if isinstance(metadata, dict):
            haystack = f"{haystack} {' '.join(str(value) for value in metadata.values())}".lower()
        return sum(1 for term in terms if term in haystack)

    @staticmethod
    def _severity_rank(severity: str) -> int:
        return {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(severity, 9)

    @staticmethod
    def _sentiment_rank(sentiment: str) -> int:
        return {"negative": 0, "mixed": 1, "neutral": 2, "positive": 3}.get(sentiment, 9)

    def _resolve_llm_evidence(
        self,
        *,
        llm_response: LLMChatResponseModel,
        selected_items: list[dict[str, object]],
        feedback_items: list[dict[str, Any]],
        dashboard_payload: DashboardPayloadResponse | None,
    ) -> list[ChatEvidenceItemResponse]:
        items_by_id = {str(item.get("id")): item for item in feedback_items}
        selected_ids = {str(item["feedbackItemId"]) for item in selected_items}
        evidence: list[ChatEvidenceItemResponse] = []
        for item in llm_response.evidence:
            feedback_item_id = item.feedbackItemId
            if feedback_item_id not in selected_ids:
                continue
            source_item = items_by_id.get(feedback_item_id)
            if source_item is None:
                continue
            evidence.append(self._to_evidence_item(source_item))
            if len(evidence) >= 3:
                break

        if evidence:
            return evidence

        fallback_theme = (
            dashboard_payload.top_themes[0].name
            if dashboard_payload is not None and dashboard_payload.top_themes
            else None
        )
        for selected in selected_items[:3]:
            source_item = items_by_id.get(str(selected["feedbackItemId"]))
            if source_item is None:
                continue
            evidence.append(self._to_evidence_item(source_item, fallback_theme=fallback_theme))
        return evidence

    @staticmethod
    def _to_evidence_item(
        item: dict[str, Any],
        *,
        fallback_theme: str | None = None,
    ) -> ChatEvidenceItemResponse:
        metadata = item.get("metadata_json", {})
        topic_name = metadata.get("topic") if isinstance(metadata, dict) else None
        return ChatEvidenceItemResponse(
            feedbackItemId=str(item["id"]),
            text=str(item.get("raw_text") or item.get("normalized_text") or ""),
            sourceLabel=str(item.get("source_label")),
            themeName=str(item.get("theme_name") or fallback_theme or topic_name)
            if (item.get("theme_name") or fallback_theme or topic_name)
            else None,
            category=str(item.get("category")) if item.get("category") else None,
        )

    @staticmethod
    def _normalize_follow_ups(follow_ups: list[str]) -> list[str]:
        normalized = [item.strip() for item in follow_ups if item.strip()]
        return normalized[:4] or [
            "What should the team prioritize first?",
            "Which feedback supports that recommendation?",
        ]

    @staticmethod
    def _llm_output_schema() -> dict[str, Any]:
        return {
            "type": "object",
            "additionalProperties": False,
            "required": ["answer", "evidence", "followUpSuggestions"],
            "properties": {
                "answer": {"type": "string"},
                "evidence": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["feedbackItemId"],
                        "properties": {
                            "feedbackItemId": {"type": "string"},
                        },
                    },
                },
                "followUpSuggestions": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
        }

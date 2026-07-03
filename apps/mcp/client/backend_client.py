from __future__ import annotations

import os
from typing import Any

import httpx

from apps.mcp.client.schemas import (
    AddPastedFeedbackInput,
    AddPastedFeedbackOutput,
    AgentModel,
    AnalysisBundleOutput,
    AskAnalysisQuestionInput,
    AskAnalysisQuestionOutput,
    CreateFeedbackSetInput,
    CreateFeedbackSetOutput,
    GetAnalysisBundleInput,
    RunSynthesisInput,
    RunSynthesisOutput,
)

DEFAULT_BACKEND_BASE_URL = "http://localhost:8000"
BACKEND_BASE_URL_ENV = "PRODUCT_FEEDBACK_BACKEND_BASE_URL"


class BackendClientError(RuntimeError):
    """Raised when the MCP layer cannot complete a backend request."""


class ProductFeedbackBackendClient:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        timeout_seconds: float = 30.0,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.base_url = (base_url or os.getenv(BACKEND_BASE_URL_ENV) or DEFAULT_BACKEND_BASE_URL).rstrip("/")
        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(timeout_seconds),
        )

    async def __aenter__(self) -> ProductFeedbackBackendClient:
        return self

    async def __aexit__(self, *_exc: object) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def create_feedback_set(
        self,
        payload: CreateFeedbackSetInput,
    ) -> CreateFeedbackSetOutput:
        response = await self._request(
            "POST",
            "/feedback-sets",
            json={
                "analysisTarget": {
                    "name": payload.product_name,
                    "description": payload.product_description,
                },
                "analysisGoal": payload.analysis_goal,
            },
        )
        feedback_set = _require_mapping(response, "feedbackSet")
        return CreateFeedbackSetOutput(
            feedback_set_id=str(feedback_set["id"]),
            status="created",
        )

    async def add_pasted_feedback(
        self,
        payload: AddPastedFeedbackInput,
    ) -> AddPastedFeedbackOutput:
        response = await self._request(
            "POST",
            f"/feedback-sets/{payload.feedback_set_id}/sources/pasted",
            json={"pastedText": payload.text},
        )
        source = _require_mapping(response, "source")
        return AddPastedFeedbackOutput(
            feedback_set_id=str(source["feedbackSetId"]),
            source_type="pasted_text",
            items_created=int(source["itemCount"]),
            status="ingested",
        )

    async def run_synthesis(
        self,
        payload: RunSynthesisInput,
    ) -> RunSynthesisOutput:
        response = await self._request(
            "POST",
            f"/feedback-sets/{payload.feedback_set_id}/synthesize",
            json={},
        )
        analysis_run = _require_mapping(response, "analysisRun")
        metadata = analysis_run.get("metadata", {})
        metadata = metadata if isinstance(metadata, dict) else {}
        return RunSynthesisOutput(
            analysis_run_id=str(analysis_run["id"]),
            feedback_set_id=str(analysis_run["feedbackSetId"]),
            status=str(analysis_run["status"]),
            synthesis_method=str(metadata.get("synthesis_method") or "deterministic_fallback"),
        )

    async def get_analysis_bundle(
        self,
        payload: GetAnalysisBundleInput,
    ) -> AnalysisBundleOutput:
        response = await self._request("GET", f"/analysis-runs/{payload.analysis_run_id}/bundle")
        analysis_run = _require_mapping(response, "analysisRun")
        analysis_target = _require_mapping(response, "analysisTarget")
        dashboard = response.get("dashboard")
        if not isinstance(dashboard, dict):
            raise BackendClientError(
                f"Analysis run '{payload.analysis_run_id}' does not have a dashboard payload yet.",
            )

        return AnalysisBundleOutput(
            analysis_run_id=str(analysis_run["id"]),
            product_name=str(analysis_target["name"]),
            executive_summary=str(dashboard.get("executiveSummary") or ""),
            top_themes=_list_of_mappings(dashboard.get("topThemes")),
            pain_points=_list_of_mappings(dashboard.get("painPoints")),
            feature_requests=_list_of_mappings(dashboard.get("featureRequests")),
            roadmap_recommendations=_list_of_mappings(dashboard.get("roadmapRecommendations")),
            source_mix=_list_of_mappings(dashboard.get("sourceMix")),
            representative_quotes=_list_of_mappings(dashboard.get("representativeQuotes")),
        )

    async def ask_analysis_question(
        self,
        payload: AskAnalysisQuestionInput,
    ) -> AskAnalysisQuestionOutput:
        response = await self._request(
            "POST",
            f"/analysis-runs/{payload.analysis_run_id}/chat",
            json={"question": payload.question, "scope": "all"},
        )
        return AskAnalysisQuestionOutput(
            analysis_run_id=payload.analysis_run_id,
            answer=str(response.get("answer") or ""),
            chat_method=str(response.get("chatMethod") or "deterministic_fallback"),
            evidence=_list_of_mappings(response.get("evidence")),
        )

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        try:
            response = await self._client.request(method, path, json=json)
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = _error_detail(exc.response)
            raise BackendClientError(
                f"Backend request failed: {method} {path} returned {exc.response.status_code}. {detail}",
            ) from exc
        except httpx.HTTPError as exc:
            raise BackendClientError(f"Backend request failed: {method} {path}. {exc}") from exc

        body = response.json()
        if not isinstance(body, dict):
            raise BackendClientError(f"Backend request returned non-object JSON: {method} {path}")
        return body


def model_dump(model: AgentModel) -> dict[str, Any]:
    return model.model_dump(mode="json")


def _require_mapping(payload: dict[str, Any], key: str) -> dict[str, Any]:
    value = payload.get(key)
    if not isinstance(value, dict):
        raise BackendClientError(f"Backend response is missing object field '{key}'.")
    return value


def _list_of_mappings(value: object) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def _error_detail(response: httpx.Response) -> str:
    try:
        body = response.json()
    except ValueError:
        return response.text[:500]
    if isinstance(body, dict) and "detail" in body:
        return str(body["detail"])
    return str(body)[:500]


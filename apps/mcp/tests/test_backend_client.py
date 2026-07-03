import asyncio

import httpx

from apps.mcp.client.backend_client import ProductFeedbackBackendClient
from apps.mcp.client.schemas import (
    AddPastedFeedbackInput,
    AskAnalysisQuestionInput,
    CreateFeedbackSetInput,
    GetAnalysisBundleInput,
    RunSynthesisInput,
)


def test_backend_client_maps_mvp_workflow_requests_and_responses() -> None:
    asyncio.run(_run_mvp_workflow_test())


async def _run_mvp_workflow_test() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.method == "POST" and request.url.path == "/feedback-sets":
            assert request.read()
            return httpx.Response(
                201,
                json={
                    "feedbackSet": {
                        "id": "set_123",
                        "status": "created",
                    }
                },
            )
        if request.method == "POST" and request.url.path == "/feedback-sets/set_123/sources/pasted":
            return httpx.Response(
                201,
                json={
                    "source": {
                        "feedbackSetId": "set_123",
                        "sourceType": "pasted",
                        "itemCount": 3,
                    }
                },
            )
        if request.method == "POST" and request.url.path == "/feedback-sets/set_123/synthesize":
            return httpx.Response(
                201,
                json={
                    "analysisRun": {
                        "id": "run_123",
                        "feedbackSetId": "set_123",
                        "status": "completed",
                        "metadata": {"synthesis_method": "llm_openai"},
                    }
                },
            )
        if request.method == "GET" and request.url.path == "/analysis-runs/run_123/bundle":
            return httpx.Response(
                200,
                json={
                    "analysisRun": {"id": "run_123"},
                    "analysisTarget": {"name": "Acme Analytics"},
                    "dashboard": {
                        "executiveSummary": "Users need faster exports.",
                        "topThemes": [{"name": "Performance"}],
                        "painPoints": [{"title": "Slow dashboard"}],
                        "featureRequests": [{"request": "CSV exports"}],
                        "roadmapRecommendations": [{"phase": "Now", "items": []}],
                        "sourceMix": [{"sourceType": "pasted_text", "count": 3}],
                        "representativeQuotes": [{"text": "The dashboard is slow."}],
                    },
                },
            )
        if request.method == "POST" and request.url.path == "/analysis-runs/run_123/chat":
            return httpx.Response(
                201,
                json={
                    "answer": "Prioritize dashboard performance.",
                    "chatMethod": "deterministic_fallback",
                    "evidence": [{"text": "The dashboard is slow."}],
                },
            )
        return httpx.Response(404, json={"detail": "not found"})

    async with httpx.AsyncClient(
        base_url="http://backend.test",
        transport=httpx.MockTransport(handler),
    ) as http_client:
        client = ProductFeedbackBackendClient(
            base_url="http://backend.test",
            client=http_client,
        )

        created = await client.create_feedback_set(
            CreateFeedbackSetInput(
                product_name="Acme Analytics",
                product_description="A B2B analytics dashboard.",
                analysis_goal="Identify top pain points",
            )
        )
        ingested = await client.add_pasted_feedback(
            AddPastedFeedbackInput(
                feedback_set_id=created.feedback_set_id,
                text="The dashboard is slow.\nI need better exports.",
            )
        )
        synthesis = await client.run_synthesis(
            RunSynthesisInput(feedback_set_id=created.feedback_set_id)
        )
        bundle = await client.get_analysis_bundle(
            GetAnalysisBundleInput(analysis_run_id=synthesis.analysis_run_id)
        )
        answer = await client.ask_analysis_question(
            AskAnalysisQuestionInput(
                analysis_run_id=synthesis.analysis_run_id,
                question="What should we prioritize next?",
            )
        )

    assert created.feedback_set_id == "set_123"
    assert ingested.items_created == 3
    assert synthesis.synthesis_method == "llm_openai"
    assert bundle.product_name == "Acme Analytics"
    assert bundle.executive_summary == "Users need faster exports."
    assert answer.chat_method == "deterministic_fallback"
    assert [request.url.path for request in requests] == [
        "/feedback-sets",
        "/feedback-sets/set_123/sources/pasted",
        "/feedback-sets/set_123/synthesize",
        "/analysis-runs/run_123/bundle",
        "/analysis-runs/run_123/chat",
    ]

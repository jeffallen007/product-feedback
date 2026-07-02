from app.services.feedback_synthesis import (
    FeedbackSynthesisService,
    SynthesisRequest,
)


class FakeLLMClient:
    def __init__(self, response_text: str | None = None, error: Exception | None = None) -> None:
        self.response_text = response_text
        self.error = error

    def create_structured_output(self, *, developer_prompt, user_prompt, schema):  # type: ignore[no-untyped-def]
        if self.error is not None:
            raise self.error
        assert developer_prompt
        assert user_prompt
        assert schema["type"] == "object"
        return self.response_text or ""


def make_request() -> SynthesisRequest:
    return SynthesisRequest(
        analysis_run_id="run_123",
        analysis_goal="Full Product Feedback Synthesis",
        product_name="Acme PM",
        product_description="A project planning tool for cross-functional teams.",
        completed_at="2026-07-02T00:00:00+00:00",
        dataset_id=None,
        sources=[
            {
                "id": "source_1",
                "source_type": "pasted_text",
                "source_label": "Pasted Feedback",
                "item_count": 2,
            }
        ],
        feedback_items=[
            {
                "id": "item_1",
                "source_type": "pasted_text",
                "source_label": "Pasted Feedback",
                "raw_text": "Notifications are noisy and hard to control.",
                "normalized_text": "Notifications are noisy and hard to control.",
                "rating": 2,
                "feedback_date": None,
                "author_handle": None,
                "category": "ux_issue",
                "sentiment": "negative",
                "severity": "high",
                "churn_risk": True,
                "metadata_json": {},
            },
            {
                "id": "item_2",
                "source_type": "pasted_text",
                "source_label": "Pasted Feedback",
                "raw_text": "Please add saved dashboard views for different teams.",
                "normalized_text": "Please add saved dashboard views for different teams.",
                "rating": 4,
                "feedback_date": None,
                "author_handle": None,
                "category": "feature_request",
                "sentiment": "mixed",
                "severity": "medium",
                "churn_risk": False,
                "metadata_json": {},
            },
        ],
    )


def test_feedback_synthesis_uses_llm_when_available() -> None:
    service = FeedbackSynthesisService(
        llm_client=FakeLLMClient(
            response_text="""
            {
              "executiveSummary": "Notification controls and dashboard flexibility are the main opportunities.",
              "topThemes": [
                {
                  "id": "notifications",
                  "rank": 1,
                  "name": "Notification controls",
                  "description": "Users want fewer low-signal alerts.",
                  "count": 1,
                  "percent": 50,
                  "sentiment": "Mostly negative",
                  "priority": "High",
                  "sourceCoverage": "Pasted Feedback"
                }
              ],
              "painPoints": [
                {
                  "title": "Noisy notifications",
                  "summary": "Users receive too many low-value alerts.",
                  "evidenceCount": 1,
                  "impact": "Alert fatigue can reduce engagement.",
                  "recommendedAction": "Ship granular notification controls.",
                  "representativeQuotes": [
                    {
                      "text": "Notifications are noisy and hard to control.",
                      "sourceLabel": "Pasted Feedback"
                    }
                  ]
                }
              ],
              "featureRequests": [
                {
                  "request": "Saved dashboard views",
                  "userNeed": "Teams want reporting views tailored to their workflow.",
                  "supportingEvidence": "Pasted Feedback",
                  "priority": "High"
                }
              ],
              "roadmapRecommendations": [
                {
                  "phase": "Now",
                  "items": [
                    {
                      "title": "Granular notification controls",
                      "rationale": "This is the clearest retention risk in the supplied feedback."
                    }
                  ]
                }
              ],
              "representativeQuotes": [
                {
                  "text": "Notifications are noisy and hard to control.",
                  "sourceLabel": "Pasted Feedback",
                  "themeName": "Notification controls",
                  "category": "ux_issue"
                }
              ],
              "modelSignals": [
                {
                  "label": "Confidence",
                  "value": "Medium: only two feedback items were supplied."
                }
              ]
            }
            """,
        ),
        llm_model="gpt-5.4-mini",
    )

    result = service.synthesize(make_request())

    assert result.metadata["synthesis_method"] == "llm_openai"
    assert result.metadata["llm_model"] == "gpt-5.4-mini"
    assert result.dashboard_payload.analysis_context.processing_method == "LLM OpenAI Feedback Synthesis"
    assert result.dashboard_payload.executive_summary.startswith("Notification controls")
    assert result.dashboard_payload.representative_quotes[0].text == "Notifications are noisy and hard to control."


def test_feedback_synthesis_falls_back_without_api_key() -> None:
    service = FeedbackSynthesisService(llm_client=None)

    result = service.synthesize(make_request())

    assert result.metadata["synthesis_method"] == "deterministic_fallback"
    assert result.metadata["fallback_reason"] == "missing_openai_api_key"
    assert result.dashboard_payload.analysis_context.processing_method == "Deterministic Feedback Synthesis Fallback"


def test_feedback_synthesis_falls_back_on_llm_error() -> None:
    service = FeedbackSynthesisService(
        llm_client=FakeLLMClient(error=RuntimeError("boom")),
        llm_model="gpt-5.4-mini",
    )

    result = service.synthesize(make_request())

    assert result.metadata["synthesis_method"] == "deterministic_fallback"
    assert str(result.metadata["fallback_reason"]).startswith("llm_error:")
    assert result.metadata["llm_model"] == "gpt-5.4-mini"


def test_feedback_synthesis_falls_back_on_invalid_json() -> None:
    service = FeedbackSynthesisService(
        llm_client=FakeLLMClient(response_text="{not valid json"),
        llm_model="gpt-5.4-mini",
    )

    result = service.synthesize(make_request())

    assert result.metadata["synthesis_method"] == "deterministic_fallback"
    assert str(result.metadata["fallback_reason"]).startswith("llm_error:")

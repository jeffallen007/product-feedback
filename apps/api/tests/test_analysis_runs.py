from datetime import datetime, UTC

from fastapi.testclient import TestClient

from app.api.dependencies import get_analysis_run_service
from app.errors import (
    AnalysisRunNotFoundError,
    EmptyFeedbackSetError,
    FeedbackSetNotFoundError,
    SupabaseInsertError,
)
from app.main import app
from app.schemas.analysis_runs import SynthesizeFeedbackSetRequest
from app.schemas.chat import AskAnalysisQuestionRequest
from app.services.analysis_runs import AnalysisRunService


class FakeAnalysisSupabaseClient:
    def __init__(
        self,
        *,
        has_sources: bool = True,
        total_feedback_count: int = 12,
        analysis_target_name: str = "Pulse Fitness",
        analysis_target_description: str = "A mobile fitness coaching app for guided routines.",
        analysis_goal: str = "Full Product Feedback Synthesis",
        source_label: str = "google_play",
        demo_product_id: str = "productivity_tool",
        dashboard_summary: dict[str, object] | None = None,
        fail_dashboard_insert: bool = False,
        fail_chat_insert: bool = False,
        chat_history: list[dict[str, object]] | None = None,
    ) -> None:
        self.calls: list[tuple[str, dict[str, object] | dict[str, str]]] = []
        self.has_sources = has_sources
        self.total_feedback_count = total_feedback_count
        self.analysis_target_name = analysis_target_name
        self.analysis_target_description = analysis_target_description
        self.analysis_goal = analysis_goal
        self.source_label = source_label
        self.demo_product_id = demo_product_id
        self.dashboard_summary = dashboard_summary
        self.fail_dashboard_insert = fail_dashboard_insert
        self.fail_chat_insert = fail_chat_insert
        self.chat_history = chat_history or []

    def fetch_single_row(
        self,
        table: str,
        *,
        filters: dict[str, str],
    ) -> dict[str, object]:
        self.calls.append((f"{table}:fetch_single", filters))
        if table == "analysis_targets":
            return {
                "id": filters["id"],
                "name": self.analysis_target_name,
                "description": self.analysis_target_description,
                "created_at": datetime(2026, 6, 18, 7, 45, tzinfo=UTC).isoformat(),
            }
        if table == "feedback_sets":
            return {
                "id": filters["id"],
                "analysis_target_id": "target_123",
                "name": "Demo Run",
                "analysis_goal": self.analysis_goal,
                "status": "ready",
                "total_feedback_count": self.total_feedback_count,
                "created_at": datetime(2026, 6, 18, 8, 0, tzinfo=UTC).isoformat(),
                "updated_at": datetime(2026, 6, 18, 8, 0, tzinfo=UTC).isoformat(),
            }
        if table == "analysis_runs":
            return {
                "id": filters["id"],
                "feedback_set_id": "set_456",
                "status": "completed",
                "current_step": "generate_dashboard",
                "started_at": datetime(2026, 6, 18, 9, 0, tzinfo=UTC).isoformat(),
                "completed_at": datetime(2026, 6, 18, 9, 0, tzinfo=UTC).isoformat(),
                "error_message": None,
                "metadata_json": {
                    "analysis_goal": self.analysis_goal,
                    "total_feedback_count": self.total_feedback_count,
                    "source_count": 1,
                },
            }
        raise AssertionError(f"Unexpected table {table}")

    def fetch_rows(
        self,
        table: str,
        *,
        filters: dict[str, str],
        limit: int | None = None,
    ) -> list[dict[str, object]]:
        self.calls.append((f"{table}:fetch_rows", {"filters": filters, "limit": limit}))
        if table == "data_sources":
            return (
                [
                    {
                        "id": "source_789",
                        "feedback_set_id": filters["feedback_set_id"],
                        "source_type": "review",
                        "source_label": self.source_label,
                        "item_count": self.total_feedback_count,
                        "status": "ready",
                        "metadata_json": {"demo_product_id": self.demo_product_id},
                        "created_at": datetime(2026, 6, 18, 8, 5, tzinfo=UTC).isoformat(),
                    }
                ]
                if self.has_sources
                else []
            )
        if table == "feedback_items":
            return [
                {
                    "id": f"item_{index}",
                    "feedback_set_id": filters["feedback_set_id"],
                    "source_id": "source_789",
                    "raw_text": self._feedback_item_text(index),
                    "normalized_text": self._feedback_item_normalized_text(index),
                    "rating": self._feedback_item_rating(index),
                    "source_type": "review",
                    "source_label": self.source_label,
                    "metadata_json": self._feedback_item_metadata(index),
                }
                for index in range(1, self.total_feedback_count + 1)
            ]
        if table == "dashboard_summaries":
            return [] if self.dashboard_summary is None else [self.dashboard_summary]
        if table == "chat_messages":
            return self.chat_history
        raise AssertionError(f"Unexpected table {table}")

    def insert_row(self, table: str, payload: dict[str, object]) -> dict[str, object]:
        self.calls.append((table, payload))
        if table == "analysis_runs":
            return {
                "id": "run_123",
                "feedback_set_id": payload["feedback_set_id"],
                "status": payload["status"],
                "current_step": payload["current_step"],
                "started_at": payload["started_at"],
                "completed_at": payload["completed_at"],
                "error_message": payload["error_message"],
                "metadata_json": payload["metadata_json"],
            }
        if table == "dashboard_summaries":
            if self.fail_dashboard_insert:
                raise SupabaseInsertError("Supabase insert failed for table 'dashboard_summaries'.")
            return {
                "id": "summary_123",
                "analysis_run_id": payload["analysis_run_id"],
                "summary_payload": payload["summary_payload"],
            }
        if table == "chat_messages":
            if self.fail_chat_insert:
                raise SupabaseInsertError("Supabase insert failed for table 'chat_messages'.")
            message_number = len([call for call in self.calls if call[0] == "chat_messages"])
            return {
                "id": f"message_{message_number}",
                "analysis_run_id": payload["analysis_run_id"],
                "role": payload["role"],
                "question": payload["question"],
                "answer": payload["answer"],
                "scope": payload["scope"],
                "evidence_json": payload["evidence_json"],
                "follow_up_suggestions": payload["follow_up_suggestions"],
                "created_at": datetime(2026, 6, 18, 9, message_number, tzinfo=UTC).isoformat(),
            }
        raise AssertionError(f"Unexpected insert table {table}")

    @staticmethod
    def _feedback_item_text(index: int) -> str:
        if index == 1:
            return "Notifications are too aggressive. I get pinged for minor status changes all day."
        if index == 2:
            return "Please give us quieter default notification settings for new team members."
        if index == 3:
            return "Comment mentions work well, but I'd like better control over who gets notified."
        return f"Sample review {index}"

    @staticmethod
    def _feedback_item_normalized_text(index: int) -> str:
        if index == 1:
            return "Notification volume is too high for minor task updates."
        if index == 2:
            return "New users need quieter default notification settings."
        if index == 3:
            return "Mentions work, but notification targeting needs refinement."
        return f"sample review {index}"

    @staticmethod
    def _feedback_item_rating(index: int) -> int:
        if index in {1, 2}:
            return 2
        if index == 3:
            return 3
        return 4 if index % 2 else 3

    @staticmethod
    def _feedback_item_metadata(index: int) -> dict[str, str]:
        if index in {1, 2, 3}:
            return {"topic": "notifications"}
        return {"topic": "general"}


def make_dashboard_summary() -> dict[str, object]:
    return {
        "id": "summary_123",
        "analysis_run_id": "run_123",
        "summary_payload": {
            "analysisContext": {
                "analysisRunId": "run_123",
                "productName": "Pulse Fitness",
                "productDescription": "A mobile fitness coaching app for guided routines.",
                "goal": "Full Product Feedback Synthesis",
                "processingMethod": "Placeholder Backend Summary",
                "sourceCount": 1,
                "feedbackItemCount": 12,
                "lastRunAt": "2026-06-18T09:00:00+00:00",
            },
            "sourceMix": [
                {
                    "sourceId": "source_789",
                    "label": "google_play",
                    "sourceType": "review",
                    "count": 12,
                    "unit": "reviews",
                    "percent": 100,
                }
            ],
            "kpis": [{"label": "Feedback items analyzed", "value": "12"}],
            "executiveSummary": "Placeholder summary.",
            "sentimentBreakdown": {
                "overall": [
                    {"label": "Positive", "value": 35},
                    {"label": "Neutral", "value": 25},
                    {"label": "Negative", "value": 40},
                ],
                "bySource": [
                    {"sourceLabel": "google_play", "negativePercent": 40}
                ],
            },
            "classificationSummary": [{"category": "ux_issue", "count": 4, "percent": 33}],
            "topThemes": [
                {
                    "id": "workflow_friction",
                    "rank": 1,
                    "name": "Notification overload",
                    "description": "Users hit friction when managing alerts and noisy updates.",
                    "count": 4,
                    "percent": 33,
                    "sentiment": "Mostly negative",
                    "priority": "High",
                    "sourceCoverage": "Demo Dataset",
                }
            ],
            "painPoints": [
                {
                    "title": "Notification overload",
                    "summary": "Users hit friction when managing alerts and noisy updates.",
                    "evidenceCount": 4,
                    "impact": "Too many low-signal alerts increase fatigue.",
                    "recommendedAction": "Reduce planning friction.",
                    "representativeQuotes": [
                        {
                            "text": "Planning repeats feel tedious.",
                            "sourceLabel": "google_play",
                        }
                    ],
                }
            ],
            "featureRequests": [
                {
                    "request": "Add reusable plan templates.",
                    "userNeed": "Reduce friction in the core workflow",
                    "supportingEvidence": "Demo Dataset",
                    "priority": "High",
                }
            ],
            "roadmapRecommendations": [
                {
                    "phase": "Now",
                    "items": [{"title": "Fix setup friction", "rationale": "Immediate improvement"}],
                }
            ],
            "representativeQuotes": [
                {
                    "text": "Planning repeats feel tedious.",
                    "sourceLabel": "google_play",
                    "themeName": "Notification overload",
                    "category": "ux_issue",
                }
            ],
            "modelSignals": [
                {
                    "label": "Placeholder confidence",
                    "value": "Deterministic fixture-derived summary",
                }
            ],
        },
    }


def make_chat_history() -> list[dict[str, object]]:
    return [
        {
            "id": "message_2",
            "analysis_run_id": "run_123",
            "role": "assistant",
            "question": None,
            "answer": "The top issue is notification overload.",
            "scope": "all",
            "evidence_json": [
                {
                    "feedbackItemId": "item_1",
                    "text": "Notifications are too aggressive. I get pinged for minor status changes all day.",
                    "sourceLabel": "google_play",
                    "themeName": "Notification overload",
                    "category": "ux_issue",
                }
            ],
            "follow_up_suggestions": ["Show evidence for notification overload."],
            "created_at": datetime(2026, 6, 18, 9, 2, tzinfo=UTC).isoformat(),
        },
        {
            "id": "message_1",
            "analysis_run_id": "run_123",
            "role": "user",
            "question": "What should we prioritize first?",
            "answer": None,
            "scope": "all",
            "evidence_json": [],
            "follow_up_suggestions": [],
            "created_at": datetime(2026, 6, 18, 9, 1, tzinfo=UTC).isoformat(),
        },
    ]


def test_create_placeholder_run_persists_analysis_run_and_dashboard_summary() -> None:
    client = FakeAnalysisSupabaseClient()
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    response = service.create_placeholder_run(
        "set_456",
        SynthesizeFeedbackSetRequest(),
    )

    assert response.analysis_run.id == "run_123"
    assert response.analysis_run.status == "completed"
    assert response.analysis_run.metadata["total_feedback_count"] == 12
    assert response.analysis_run.metadata["source_count"] == 1
    dashboard_insert = next(call[1] for call in client.calls if call[0] == "dashboard_summaries")
    assert dashboard_insert["analysis_run_id"] == "run_123"
    assert isinstance(dashboard_insert["summary_payload"], dict)
    assert dashboard_insert["summary_payload"]["analysisContext"]["feedbackItemCount"] == 12
    assert [call[0] for call in client.calls] == [
        "feedback_sets:fetch_single",
        "analysis_targets:fetch_single",
        "data_sources:fetch_rows",
        "feedback_items:fetch_rows",
        "analysis_runs",
        "dashboard_summaries",
    ]


def test_create_placeholder_run_uses_selected_fitness_product_context() -> None:
    client = FakeAnalysisSupabaseClient(
        analysis_target_name="Fitness App (Strava)",
        analysis_target_description="A consumer fitness app for tracking running, cycling, hiking, and other types of workouts.",
        source_label="google_play",
        demo_product_id="fitness_app",
    )
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    response = service.create_placeholder_run("set_456", SynthesizeFeedbackSetRequest())
    dashboard_insert = next(call[1] for call in client.calls if call[0] == "dashboard_summaries")

    assert response.analysis_run.metadata["analysis_goal"] == "Full Product Feedback Synthesis"
    assert dashboard_insert["summary_payload"]["analysisContext"]["productName"] == "Fitness App (Strava)"
    assert dashboard_insert["summary_payload"]["executiveSummary"].startswith("Fitness App (Strava) feedback suggests")
    assert dashboard_insert["summary_payload"]["topThemes"][0]["name"] != "Notification overload"


def test_create_placeholder_run_uses_selected_crm_product_context() -> None:
    client = FakeAnalysisSupabaseClient(
        analysis_target_name="CRM Tool (HubSpot)",
        analysis_target_description="A B2B CRM tool with AI capabilities for sales and marketing teams.",
        source_label="google_play",
        demo_product_id="crm_tool",
    )
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    service.create_placeholder_run("set_456", SynthesizeFeedbackSetRequest())
    dashboard_insert = next(call[1] for call in client.calls if call[0] == "dashboard_summaries")

    assert dashboard_insert["summary_payload"]["analysisContext"]["productName"] == "CRM Tool (HubSpot)"
    assert dashboard_insert["summary_payload"]["topThemes"][0]["name"] != "Notification overload"


def test_create_placeholder_run_only_includes_selected_demo_dataset_in_source_mix() -> None:
    client = FakeAnalysisSupabaseClient(
        source_label="google_play",
        demo_product_id="fitness_app",
    )
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    service.create_placeholder_run("set_456", SynthesizeFeedbackSetRequest())
    dashboard_insert = next(call[1] for call in client.calls if call[0] == "dashboard_summaries")
    source_mix = dashboard_insert["summary_payload"]["sourceMix"]

    assert source_mix == [
        {
            "sourceId": "source_789",
            "sourceType": "review",
            "label": "google_play",
            "count": 12,
            "unit": "reviews",
            "percent": 100,
        }
    ]


def test_create_placeholder_run_applies_non_full_goal_focus() -> None:
    client = FakeAnalysisSupabaseClient(
        analysis_goal="Prioritize Roadmap Opportunities",
        source_label="google_play",
        demo_product_id="crm_tool",
    )
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    service.create_placeholder_run(
        "set_456",
        SynthesizeFeedbackSetRequest(analysisGoal="Prioritize Roadmap Opportunities"),
    )
    dashboard_insert = next(call[1] for call in client.calls if call[0] == "dashboard_summaries")
    payload = dashboard_insert["summary_payload"]

    assert payload["analysisContext"]["goal"] == "Prioritize Roadmap Opportunities"
    assert payload["featureRequests"] != []
    assert payload["roadmapRecommendations"] != []
    assert payload["topThemes"] != []
    assert payload["painPoints"] == []
    assert payload["sentimentBreakdown"] == {"overall": [], "bySource": []}


def test_create_placeholder_run_keeps_full_goal_sections() -> None:
    client = FakeAnalysisSupabaseClient()
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    service.create_placeholder_run(
        "set_456",
        SynthesizeFeedbackSetRequest(analysisGoal="Full Product Feedback Synthesis"),
    )
    dashboard_insert = next(call[1] for call in client.calls if call[0] == "dashboard_summaries")
    payload = dashboard_insert["summary_payload"]

    assert payload["analysisContext"]["goal"] == "Full Product Feedback Synthesis"
    assert payload["sentimentBreakdown"]["overall"] != []
    assert payload["painPoints"] != []
    assert payload["featureRequests"] != []
    assert payload["roadmapRecommendations"] != []


def test_create_placeholder_run_rejects_missing_feedback_set() -> None:
    class MissingFeedbackSetClient(FakeAnalysisSupabaseClient):
        def fetch_single_row(self, table: str, *, filters: dict[str, str]) -> dict[str, object]:
            if table == "feedback_sets":
                raise SupabaseInsertError("Supabase query returned no rows for table 'feedback_sets'.")
            return super().fetch_single_row(table, filters=filters)

    service = AnalysisRunService(MissingFeedbackSetClient())  # type: ignore[arg-type]

    try:
        service.create_placeholder_run("set_missing", SynthesizeFeedbackSetRequest())
    except FeedbackSetNotFoundError:
        pass
    else:
        raise AssertionError("Expected FeedbackSetNotFoundError")


def test_create_placeholder_run_rejects_empty_feedback_set() -> None:
    client = FakeAnalysisSupabaseClient(has_sources=False, total_feedback_count=0)
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    try:
        service.create_placeholder_run("set_456", SynthesizeFeedbackSetRequest())
    except EmptyFeedbackSetError:
        pass
    else:
        raise AssertionError("Expected EmptyFeedbackSetError")


def test_get_analysis_run_returns_dashboard_when_summary_exists() -> None:
    client = FakeAnalysisSupabaseClient(dashboard_summary=make_dashboard_summary())
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    response = service.get_analysis_run("run_123")

    assert response.analysis_run.id == "run_123"
    assert response.dashboard is not None
    assert response.dashboard.analysis_context.feedback_item_count == 12
    assert response.dashboard.executive_summary == "Placeholder summary."
    assert response.placeholder_message is None


def test_ask_placeholder_question_persists_user_and_assistant_messages() -> None:
    client = FakeAnalysisSupabaseClient(dashboard_summary=make_dashboard_summary())
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    response = service.ask_placeholder_question(
        "run_123",
        AskAnalysisQuestionRequest(
            question="Show evidence for notification overload",
            scope="all",
        ),
    )

    chat_inserts = [call for call in client.calls if call[0] == "chat_messages"]
    assert len(chat_inserts) == 2
    assert chat_inserts[0][1]["role"] == "user"
    assert chat_inserts[1][1]["role"] == "assistant"
    assert response.answer.startswith("Notification overload is one of the strongest signals in this run")
    assert response.scope_used == "all"
    assert len(response.evidence) == 3
    assert response.evidence[0].source_label == "google_play"
    assert response.user_message.role == "user"
    assert response.assistant_message.role == "assistant"
    assert response.assistant_message.follow_up_suggestions == [
        "Summarize notification overload by severity.",
        "Draft a roadmap recommendation for notification overload.",
    ]


def test_ask_placeholder_question_rejects_missing_run() -> None:
    class MissingRunClient(FakeAnalysisSupabaseClient):
        def fetch_single_row(self, table: str, *, filters: dict[str, str]) -> dict[str, object]:
            if table == "analysis_runs":
                raise SupabaseInsertError("Supabase query returned no rows for table 'analysis_runs'.")
            return super().fetch_single_row(table, filters=filters)

    service = AnalysisRunService(MissingRunClient())  # type: ignore[arg-type]

    try:
        service.ask_placeholder_question(
            "run_missing",
            AskAnalysisQuestionRequest(question="What should we prioritize first?"),
        )
    except AnalysisRunNotFoundError:
        pass
    else:
        raise AssertionError("Expected AnalysisRunNotFoundError")


def test_ask_placeholder_question_returns_deterministic_compare_answer() -> None:
    client = FakeAnalysisSupabaseClient(dashboard_summary=make_dashboard_summary())
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    response = service.ask_placeholder_question(
        "run_123",
        AskAnalysisQuestionRequest(
            question="Compare X feedback to demo dataset",
            scope="all",
        ),
    )

    assert response.answer == "This analysis run only includes the demo dataset right now, so there is no persisted X feedback to compare against yet."
    assert response.evidence == []
    assert response.follow_up_suggestions == [
        "Summarize the demo dataset on its own.",
        "Show the highest-friction themes in the current run.",
    ]


def test_ask_placeholder_question_surfaces_chat_insert_failure() -> None:
    client = FakeAnalysisSupabaseClient(
        dashboard_summary=make_dashboard_summary(),
        fail_chat_insert=True,
    )
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    try:
        service.ask_placeholder_question(
            "run_123",
            AskAnalysisQuestionRequest(question="Roadmap memo"),
        )
    except SupabaseInsertError as exc:
        assert "chat_messages" in str(exc)
    else:
        raise AssertionError("Expected SupabaseInsertError")


def test_get_chat_history_returns_messages_in_chronological_order() -> None:
    client = FakeAnalysisSupabaseClient(chat_history=make_chat_history())
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    response = service.get_chat_history("run_123")

    assert [message.id for message in response.messages] == ["message_1", "message_2"]
    assert response.messages[0].role == "user"
    assert response.messages[1].role == "assistant"
    assert response.messages[1].evidence[0].feedback_item_id == "item_1"


def test_get_chat_history_returns_empty_list_for_existing_run_without_messages() -> None:
    client = FakeAnalysisSupabaseClient(chat_history=[])
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    response = service.get_chat_history("run_123")

    assert response.messages == []


def test_get_chat_history_rejects_missing_run() -> None:
    class MissingRunClient(FakeAnalysisSupabaseClient):
        def fetch_single_row(self, table: str, *, filters: dict[str, str]) -> dict[str, object]:
            if table == "analysis_runs":
                raise SupabaseInsertError("Supabase query returned no rows for table 'analysis_runs'.")
            return super().fetch_single_row(table, filters=filters)

    service = AnalysisRunService(MissingRunClient())  # type: ignore[arg-type]

    try:
        service.get_chat_history("run_missing")
    except AnalysisRunNotFoundError:
        pass
    else:
        raise AssertionError("Expected AnalysisRunNotFoundError")


def test_get_analysis_run_bundle_returns_complete_payload() -> None:
    client = FakeAnalysisSupabaseClient(
        dashboard_summary=make_dashboard_summary(),
        chat_history=make_chat_history(),
    )
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    response = service.get_analysis_run_bundle("run_123")

    assert response.analysis_run.id == "run_123"
    assert response.feedback_set.id == "set_456"
    assert response.analysis_target.id == "target_123"
    assert len(response.sources) == 1
    assert response.sources[0].source_label == "google_play"
    assert response.dashboard is not None
    assert response.dashboard.executive_summary == "Placeholder summary."
    assert [message.id for message in response.chat_history] == ["message_1", "message_2"]
    assert response.placeholder_message is None


def test_get_analysis_run_bundle_returns_empty_chat_history_when_no_messages_exist() -> None:
    client = FakeAnalysisSupabaseClient(
        dashboard_summary=make_dashboard_summary(),
        chat_history=[],
    )
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    response = service.get_analysis_run_bundle("run_123")

    assert response.chat_history == []


def test_get_analysis_run_bundle_returns_placeholder_message_when_dashboard_missing() -> None:
    client = FakeAnalysisSupabaseClient(chat_history=make_chat_history())
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    response = service.get_analysis_run_bundle("run_123")

    assert response.dashboard is None
    assert response.placeholder_message == "Dashboard summary has not been generated yet."


def test_get_analysis_run_bundle_rejects_missing_run() -> None:
    class MissingRunClient(FakeAnalysisSupabaseClient):
        def fetch_single_row(self, table: str, *, filters: dict[str, str]) -> dict[str, object]:
            if table == "analysis_runs":
                raise SupabaseInsertError("Supabase query returned no rows for table 'analysis_runs'.")
            return super().fetch_single_row(table, filters=filters)

    service = AnalysisRunService(MissingRunClient())  # type: ignore[arg-type]

    try:
        service.get_analysis_run_bundle("run_missing")
    except AnalysisRunNotFoundError:
        pass
    else:
        raise AssertionError("Expected AnalysisRunNotFoundError")


def test_get_analysis_run_returns_placeholder_when_summary_missing() -> None:
    client = FakeAnalysisSupabaseClient()
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    response = service.get_analysis_run("run_123")

    assert response.analysis_run.id == "run_123"
    assert response.dashboard is None
    assert response.placeholder_message == "Dashboard summary has not been generated yet."


def test_get_analysis_run_rejects_missing_run() -> None:
    class MissingRunClient(FakeAnalysisSupabaseClient):
        def fetch_single_row(self, table: str, *, filters: dict[str, str]) -> dict[str, object]:
            if table == "analysis_runs":
                raise SupabaseInsertError("Supabase query returned no rows for table 'analysis_runs'.")
            return super().fetch_single_row(table, filters=filters)

    service = AnalysisRunService(MissingRunClient())  # type: ignore[arg-type]

    try:
        service.get_analysis_run("run_missing")
    except AnalysisRunNotFoundError:
        pass
    else:
        raise AssertionError("Expected AnalysisRunNotFoundError")


def test_create_placeholder_run_surfaces_dashboard_insert_failure() -> None:
    client = FakeAnalysisSupabaseClient(fail_dashboard_insert=True)
    service = AnalysisRunService(client)  # type: ignore[arg-type]

    try:
        service.create_placeholder_run("set_456", SynthesizeFeedbackSetRequest())
    except SupabaseInsertError as exc:
        assert "dashboard_summaries" in str(exc)
    else:
        raise AssertionError("Expected SupabaseInsertError")


def test_analysis_run_routes_surface_errors() -> None:
    class FailingService:
        def create_placeholder_run(self, _feedback_set_id, _request):  # type: ignore[no-untyped-def]
            raise SupabaseInsertError("Supabase insert failed for table 'analysis_runs'.")

        def get_analysis_run(self, _analysis_run_id):  # type: ignore[no-untyped-def]
            raise AnalysisRunNotFoundError("Analysis run 'run_missing' was not found.")

        def ask_placeholder_question(self, _analysis_run_id, _request):  # type: ignore[no-untyped-def]
            raise SupabaseInsertError("Supabase insert failed for table 'chat_messages'.")

        def get_chat_history(self, _analysis_run_id):  # type: ignore[no-untyped-def]
            raise SupabaseInsertError("Supabase query failed for table 'chat_messages'.")

        def get_analysis_run_bundle(self, _analysis_run_id):  # type: ignore[no-untyped-def]
            raise SupabaseInsertError("Supabase query failed for table 'analysis_runs'.")

    app.dependency_overrides[get_analysis_run_service] = lambda: FailingService()
    client = TestClient(app)

    create_response = client.post("/feedback-sets/set_456/synthesize", json={})
    fetch_response = client.get("/analysis-runs/run_missing")
    chat_response = client.post(
        "/analysis-runs/run_123/chat",
        json={"question": "What should we prioritize first?", "scope": "all"},
    )
    history_response = client.get("/analysis-runs/run_123/chat")
    bundle_response = client.get("/analysis-runs/run_123/bundle")

    app.dependency_overrides.clear()

    assert create_response.status_code == 502
    assert "analysis_runs" in create_response.json()["detail"]
    assert fetch_response.status_code == 404
    assert "run_missing" in fetch_response.json()["detail"]
    assert chat_response.status_code == 502
    assert "chat_messages" in chat_response.json()["detail"]
    assert history_response.status_code == 502
    assert "chat_messages" in history_response.json()["detail"]
    assert bundle_response.status_code == 502
    assert "analysis_runs" in bundle_response.json()["detail"]

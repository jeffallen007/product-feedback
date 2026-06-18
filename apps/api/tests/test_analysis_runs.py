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
from app.services.analysis_runs import AnalysisRunService


class FakeAnalysisSupabaseClient:
    def __init__(
        self,
        *,
        has_sources: bool = True,
        total_feedback_count: int = 12,
        dashboard_summary: dict[str, object] | None = None,
    ) -> None:
        self.calls: list[tuple[str, dict[str, object] | dict[str, str]]] = []
        self.has_sources = has_sources
        self.total_feedback_count = total_feedback_count
        self.dashboard_summary = dashboard_summary

    def fetch_single_row(
        self,
        table: str,
        *,
        filters: dict[str, str],
    ) -> dict[str, object]:
        self.calls.append((f"{table}:fetch_single", filters))
        if table == "feedback_sets":
            return {
                "id": filters["id"],
                "analysis_target_id": "target_123",
                "name": "Demo Run",
                "analysis_goal": "Full Product Feedback Synthesis",
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
                    "analysis_goal": "Full Product Feedback Synthesis",
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
                        "source_type": "demo_dataset",
                        "source_label": "Productivity Tool Demo Dataset",
                        "item_count": self.total_feedback_count,
                        "status": "ready",
                        "metadata_json": {},
                        "created_at": datetime(2026, 6, 18, 8, 5, tzinfo=UTC).isoformat(),
                    }
                ]
                if self.has_sources
                else []
            )
        if table == "feedback_items":
            return []
        if table == "dashboard_summaries":
            return [] if self.dashboard_summary is None else [self.dashboard_summary]
        raise AssertionError(f"Unexpected table {table}")

    def insert_row(self, table: str, payload: dict[str, object]) -> dict[str, object]:
        self.calls.append((table, payload))
        if table != "analysis_runs":
            raise AssertionError(f"Unexpected insert table {table}")
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


def test_create_placeholder_run_persists_analysis_run() -> None:
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
    assert [call[0] for call in client.calls] == [
        "feedback_sets:fetch_single",
        "data_sources:fetch_rows",
        "analysis_runs",
    ]


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


def test_get_analysis_run_returns_placeholder_dashboard_response() -> None:
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


def test_analysis_run_routes_surface_errors() -> None:
    class FailingService:
        def create_placeholder_run(self, _feedback_set_id, _request):  # type: ignore[no-untyped-def]
            raise SupabaseInsertError("Supabase insert failed for table 'analysis_runs'.")

        def get_analysis_run(self, _analysis_run_id):  # type: ignore[no-untyped-def]
            raise AnalysisRunNotFoundError("Analysis run 'run_missing' was not found.")

    app.dependency_overrides[get_analysis_run_service] = lambda: FailingService()
    client = TestClient(app)

    create_response = client.post("/feedback-sets/set_456/synthesize", json={})
    fetch_response = client.get("/analysis-runs/run_missing")

    app.dependency_overrides.clear()

    assert create_response.status_code == 502
    assert "analysis_runs" in create_response.json()["detail"]
    assert fetch_response.status_code == 404
    assert "run_missing" in fetch_response.json()["detail"]

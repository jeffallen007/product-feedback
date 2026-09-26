from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_analysis_run_service
from app.errors import EmptyFeedbackSetError, SupabaseInsertError
from app.main import app
from app.schemas.analysis_runs import QueueAnalysisRunRequest
from app.services.analysis_runs import AnalysisRunService
from apps.api.tests.test_analysis_runs import FakeAnalysisSupabaseClient, FakeSynthesisService


class ProgressSupabaseClient(FakeAnalysisSupabaseClient):
    def __init__(self, **kwargs):  # type: ignore[no-untyped-def]
        super().__init__(**kwargs)
        self.run: dict[str, object] | None = None
        self.progress_history: list[tuple[str, str]] = []

    def fetch_rows(self, table, *, filters, limit=None):  # type: ignore[no-untyped-def]
        if table == "analysis_runs":
            return [self.run] if self.run and self.run.get("request_key") == filters.get("request_key") else []
        return super().fetch_rows(table, filters=filters, limit=limit)

    def fetch_single_row(self, table, *, filters):  # type: ignore[no-untyped-def]
        if table == "analysis_runs" and self.run is not None:
            return self.run
        return super().fetch_single_row(table, filters=filters)

    def insert_row(self, table, payload):  # type: ignore[no-untyped-def]
        if table == "analysis_runs":
            self.run = {**payload, "id": "run_123", "attempt_count": 0, "worker_id": None}
            return self.run
        return super().insert_row(table, payload)

    def update_row(self, table, *, payload, filters):  # type: ignore[no-untyped-def]
        if table == "analysis_runs":
            assert self.run is not None
            if filters.get("attempt_count") and filters["attempt_count"] != str(self.run["attempt_count"]):
                raise SupabaseInsertError("Worker claim was lost.")
            self.run.update(payload)
            if "steps_json" in payload:
                step_name = str(payload.get("current_step"))
                step = next(item for item in payload["steps_json"] if item["name"] == step_name)
                self.progress_history.append((step_name, str(step["status"])))
            return self.run
        return super().update_row(table, payload=payload, filters=filters)

    def rpc(self, function_name, payload):  # type: ignore[no-untyped-def]
        assert function_name == "finish_analysis_run"
        assert self.run is not None
        assert self.run["status"] == "running"
        assert self.dashboard_summary is None
        self.dashboard_summary = {
            "analysis_run_id": self.run["id"],
            "summary_payload": payload["p_dashboard"],
        }
        self.run.update({
            "status": "completed",
            "current_step": "save_dashboard",
            "completed_at": "2026-09-25T00:00:00Z",
            "steps_json": payload["p_steps"],
            "metadata_json": payload["p_metadata"],
        })
        self.progress_history.append(("save_dashboard", "completed"))
        return True


def _queued_run(client: ProgressSupabaseClient) -> dict[str, object]:
    service = AnalysisRunService(client, synthesis_service=FakeSynthesisService())  # type: ignore[arg-type]
    request = QueueAnalysisRunRequest(
        analysisGoal="Full Product Feedback Synthesis",
        requestKey=uuid4(),
    )
    result = service.queue_analysis_run("set_456", request)
    assert result.analysis_run.status == "queued"
    assert result.analysis_run.completed_at is None
    assert client.dashboard_summary is None
    assert client.run is not None
    return client.run


def test_queue_is_fast_idempotent_and_exposes_pending_progress() -> None:
    client = ProgressSupabaseClient()
    service = AnalysisRunService(client, synthesis_service=FakeSynthesisService())  # type: ignore[arg-type]
    request = QueueAnalysisRunRequest(analysisGoal="Full Product Feedback Synthesis", requestKey=uuid4())

    first = service.queue_analysis_run("set_456", request)
    second = service.queue_analysis_run("set_456", request)
    progress = service.get_analysis_run_progress(first.analysis_run.id)

    assert first.analysis_run.id == second.analysis_run.id
    assert first.analysis_run.status == "queued"
    assert [step["status"] for step in progress.analysis_run.steps] == ["pending"] * 3
    assert client.dashboard_summary is None


def test_queue_and_progress_routes_return_contract_shapes() -> None:
    client = ProgressSupabaseClient()
    service = AnalysisRunService(client, synthesis_service=FakeSynthesisService())  # type: ignore[arg-type]
    app.dependency_overrides[get_analysis_run_service] = lambda: service
    try:
        with TestClient(app) as http:
            queued = http.post(
                "/feedback-sets/set_456/analysis-runs",
                json={"analysisGoal": "Full Product Feedback Synthesis", "requestKey": str(uuid4())},
            )
            assert queued.status_code == 202
            assert queued.json()["analysisRun"]["status"] == "queued"
            progress = http.get("/analysis-runs/run_123/progress")
            assert progress.status_code == 200
            assert [step["name"] for step in progress.json()["analysisRun"]["steps"]] == [
                "prepare_feedback", "generate_insights", "save_dashboard",
            ]
    finally:
        app.dependency_overrides.clear()


def test_queue_rejects_feedback_set_without_sources() -> None:
    client = ProgressSupabaseClient(has_sources=False)
    service = AnalysisRunService(client)  # type: ignore[arg-type]
    with pytest.raises(EmptyFeedbackSetError):
        service.queue_analysis_run(
            "set_456",
            QueueAnalysisRunRequest(analysisGoal="Full Product Feedback Synthesis", requestKey=uuid4()),
        )


def test_worker_records_real_stages_and_completes_after_dashboard_save() -> None:
    client = ProgressSupabaseClient()
    run = _queued_run(client)
    run.update({"status": "running", "attempt_count": 1, "worker_id": "worker_1"})
    service = AnalysisRunService(client, synthesis_service=FakeSynthesisService())  # type: ignore[arg-type]

    service.process_queued_run(run, worker_id="worker_1")

    assert client.progress_history == [
        ("prepare_feedback", "running"),
        ("prepare_feedback", "completed"),
        ("generate_insights", "running"),
        ("generate_insights", "completed"),
        ("save_dashboard", "running"),
        ("save_dashboard", "completed"),
    ]
    assert client.run is not None and client.run["status"] == "completed"
    assert client.dashboard_summary is not None
    assert service.get_analysis_run_progress("run_123").analysis_run.status == "completed"


def test_worker_marks_failed_stage_without_dashboard() -> None:
    class FailedSynthesis:
        def synthesize(self, _request):  # type: ignore[no-untyped-def]
            raise RuntimeError("LLM and fallback both failed")

    client = ProgressSupabaseClient()
    run = _queued_run(client)
    run.update({"status": "running", "attempt_count": 1, "worker_id": "worker_1"})
    service = AnalysisRunService(client, synthesis_service=FailedSynthesis())  # type: ignore[arg-type]

    with pytest.raises(RuntimeError):
        service.process_queued_run(run, worker_id="worker_1")
    service.fail_queued_run(run, worker_id="worker_1")

    assert client.run is not None and client.run["status"] == "failed"
    assert client.run["error_message"] == "Analysis failed. Please start a new analysis."
    assert client.dashboard_summary is None

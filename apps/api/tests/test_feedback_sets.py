from datetime import datetime, UTC

from fastapi.testclient import TestClient

from app.api.dependencies import get_feedback_set_service
from app.errors import MissingSupabaseConfigError
from app.main import app
from app.schemas.feedback_sets import CreateFeedbackSetRequest
from app.services.feedback_sets import FeedbackSetService


class FakeSupabaseClient:
    def __init__(self) -> None:
        self.calls: list[tuple[str, dict[str, object]]] = []

    def insert_row(self, table: str, payload: dict[str, object]) -> dict[str, object]:
        self.calls.append((table, payload))
        if table == "analysis_targets":
            return {
                "id": "target_123",
                "name": payload["name"],
                "description": payload["description"],
                "created_at": datetime(2026, 6, 17, 12, 0, tzinfo=UTC).isoformat(),
            }

        return {
            "id": "set_456",
            "analysis_target_id": payload["analysis_target_id"],
            "name": payload["name"],
            "analysis_goal": payload["analysis_goal"],
            "status": payload["status"],
            "total_feedback_count": payload["total_feedback_count"],
            "created_at": datetime(2026, 6, 17, 12, 1, tzinfo=UTC).isoformat(),
            "updated_at": datetime(2026, 6, 17, 12, 1, tzinfo=UTC).isoformat(),
        }


def test_feedback_set_service_creates_target_and_feedback_set() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    response = service.create_feedback_set(
        CreateFeedbackSetRequest(
            analysisTarget={
                "name": "Productivity Tool",
                "description": "Tasks and collaboration feedback.",
            },
            analysisGoal="Full Product Feedback Synthesis",
            name="Demo Run",
        ),
    )

    assert [call[0] for call in client.calls] == [
        "analysis_targets",
        "feedback_sets",
    ]
    assert response.analysis_target.id == "target_123"
    assert response.feedback_set.analysis_target_id == "target_123"
    assert response.feedback_set.analysis_goal == "Full Product Feedback Synthesis"
    assert response.feedback_set.total_feedback_count == 0


def test_create_feedback_set_route_returns_frontend_compatible_shape() -> None:
    fake_response = {
        "analysisTarget": {
            "id": "target_123",
            "name": "Productivity Tool",
            "description": "Tasks and collaboration feedback.",
            "createdAt": "2026-06-17T12:00:00Z",
        },
        "feedbackSet": {
            "id": "set_456",
            "analysisTargetId": "target_123",
            "name": "Demo Run",
            "analysisGoal": "Full Product Feedback Synthesis",
            "status": "draft",
            "totalFeedbackCount": 0,
            "createdAt": "2026-06-17T12:01:00Z",
            "updatedAt": "2026-06-17T12:01:00Z",
        },
    }

    class FakeService:
        def create_feedback_set(self, _request):  # type: ignore[no-untyped-def]
            return fake_response

    app.dependency_overrides[get_feedback_set_service] = lambda: FakeService()
    client = TestClient(app)

    response = client.post(
        "/feedback-sets",
        json={
            "analysisTarget": {
                "name": "Productivity Tool",
                "description": "Tasks and collaboration feedback.",
            },
            "analysisGoal": "Full Product Feedback Synthesis",
            "name": "Demo Run",
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json() == fake_response


def test_create_feedback_set_route_returns_missing_config_error() -> None:
    app.dependency_overrides[get_feedback_set_service] = lambda: (_ for _ in ()).throw(
        MissingSupabaseConfigError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured."),
    )
    client = TestClient(app)

    response = client.post(
        "/feedback-sets",
        json={
            "analysisTarget": {
                "name": "Productivity Tool",
                "description": "Tasks and collaboration feedback.",
            },
            "analysisGoal": "Full Product Feedback Synthesis",
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 500
    assert "SUPABASE_URL" in response.json()["detail"]

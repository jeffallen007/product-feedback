from datetime import datetime, UTC

from fastapi.testclient import TestClient

from app.api.dependencies import get_feedback_set_service
from app.demo_feedback import DEMO_FEEDBACK_FIXTURES
from app.errors import MissingSupabaseConfigError, SupabaseInsertError
from app.main import app
from app.schemas.feedback_sets import AddDemoSourceRequest, CreateFeedbackSetRequest
from app.services.feedback_sets import FeedbackSetService


class FakeSupabaseClient:
    def __init__(self) -> None:
        self.calls: list[tuple[str, dict[str, object] | dict[str, str]]] = []
        self.inserted_feedback_items: list[dict[str, object]] = []

    def insert_row(self, table: str, payload: dict[str, object]) -> dict[str, object]:
        self.calls.append((table, payload))
        if table == "analysis_targets":
            return {
                "id": "target_123",
                "name": payload["name"],
                "description": payload["description"],
                "created_at": datetime(2026, 6, 17, 12, 0, tzinfo=UTC).isoformat(),
            }
        if table == "data_sources":
            return {
                "id": "source_789",
                "feedback_set_id": payload["feedback_set_id"],
                "source_type": payload["source_type"],
                "source_label": payload["source_label"],
                "item_count": payload["item_count"],
                "status": payload["status"],
                "metadata_json": payload["metadata_json"],
                "created_at": datetime(2026, 6, 17, 12, 2, tzinfo=UTC).isoformat(),
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

    def insert_rows(self, table: str, payloads: list[dict[str, object]]) -> list[dict[str, object]]:
        self.calls.append((table, {"count": len(payloads)}))
        self.inserted_feedback_items = payloads
        return [
            {
                "id": f"feedback_{index}",
                **payload,
                "created_at": datetime(2026, 6, 17, 12, 3, tzinfo=UTC).isoformat(),
            }
            for index, payload in enumerate(payloads, start=1)
        ]

    def fetch_single_row(
        self,
        table: str,
        *,
        filters: dict[str, str],
    ) -> dict[str, object]:
        self.calls.append((f"{table}:fetch", filters))
        return {
            "id": filters["id"],
            "analysis_target_id": "target_123",
            "name": "Demo Run",
            "analysis_goal": "Full Product Feedback Synthesis",
            "status": "draft",
            "total_feedback_count": 5,
            "created_at": datetime(2026, 6, 17, 12, 1, tzinfo=UTC).isoformat(),
            "updated_at": datetime(2026, 6, 17, 12, 1, tzinfo=UTC).isoformat(),
        }

    def update_row(
        self,
        table: str,
        *,
        payload: dict[str, object],
        filters: dict[str, str],
    ) -> dict[str, object]:
        self.calls.append((f"{table}:update", {"payload": payload, "filters": filters}))
        return {
            "id": filters["id"],
            "analysis_target_id": "target_123",
            "name": "Demo Run",
            "analysis_goal": "Full Product Feedback Synthesis",
            "status": "draft",
            "total_feedback_count": payload["total_feedback_count"],
            "created_at": datetime(2026, 6, 17, 12, 1, tzinfo=UTC).isoformat(),
            "updated_at": datetime(2026, 6, 17, 12, 2, tzinfo=UTC).isoformat(),
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


def test_feedback_set_service_adds_demo_source_and_updates_total_count() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]
    expected_count = len(DEMO_FEEDBACK_FIXTURES["productivity_tool"])

    response = service.add_demo_source(
        "set_456",
        AddDemoSourceRequest(demoProductId="productivity_tool"),
    )

    assert [call[0] for call in client.calls] == [
        "feedback_sets:fetch",
        "data_sources",
        "feedback_items",
        "feedback_sets:update",
    ]
    assert response.source.feedback_set_id == "set_456"
    assert response.source.source_type == "demo_dataset"
    assert response.source.item_count == expected_count
    assert response.source.source_label == "Productivity Tool Demo Dataset"
    assert len(client.inserted_feedback_items) == expected_count
    assert all(item["feedback_set_id"] == "set_456" for item in client.inserted_feedback_items)
    assert all(item["source_id"] == "source_789" for item in client.inserted_feedback_items)
    update_call = client.calls[-1][1]
    assert isinstance(update_call, dict)
    assert update_call["payload"]["total_feedback_count"] == 5 + expected_count


def test_add_demo_source_route_rejects_invalid_demo_product() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    app.dependency_overrides[get_feedback_set_service] = lambda: service
    test_client = TestClient(app)

    response = test_client.post(
        "/feedback-sets/set_456/sources/demo",
        json={"demoProductId": "unknown_product"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 404
    assert "Unknown demo product id" in response.json()["detail"]


def test_add_demo_source_route_returns_supabase_failure() -> None:
    class FailingService:
        def add_demo_source(self, _feedback_set_id, _request):  # type: ignore[no-untyped-def]
            raise SupabaseInsertError("Supabase insert failed for table 'data_sources'.")

    app.dependency_overrides[get_feedback_set_service] = lambda: FailingService()
    test_client = TestClient(app)

    response = test_client.post(
        "/feedback-sets/set_456/sources/demo",
        json={"demoProductId": "fitness_app"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 502
    assert "Supabase insert failed" in response.json()["detail"]


def test_add_demo_source_route_returns_supabase_failure_for_feedback_items() -> None:
    class FailingFeedbackItemsClient(FakeSupabaseClient):
        def insert_rows(self, table: str, payloads: list[dict[str, object]]) -> list[dict[str, object]]:
            raise SupabaseInsertError(f"Supabase insert failed for table '{table}'.")

    service = FeedbackSetService(FailingFeedbackItemsClient())  # type: ignore[arg-type]
    app.dependency_overrides[get_feedback_set_service] = lambda: service
    test_client = TestClient(app)

    response = test_client.post(
        "/feedback-sets/set_456/sources/demo",
        json={"demoProductId": "fitness_app"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 502
    assert "feedback_items" in response.json()["detail"]

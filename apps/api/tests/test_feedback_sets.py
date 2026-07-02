from datetime import datetime, UTC

from fastapi.testclient import TestClient

from app.api.dependencies import get_feedback_set_service
from app import demo_ingest
from app.errors import (
    InvalidCsvUploadError,
    InvalidPastedFeedbackError,
    MissingSupabaseConfigError,
    SupabaseInsertError,
)
from app.main import app
from app.schemas.feedback_sets import (
    AddDemoSourceRequest,
    AddPastedSourceRequest,
    CreateFeedbackSetRequest,
)
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


def test_create_feedback_set_route_handles_cors_preflight() -> None:
    client = TestClient(app)

    response = client.options(
        "/feedback-sets",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "content-type" in response.headers["access-control-allow-headers"].lower()


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
    assert response.source.source_type == "review"
    assert response.source.item_count == 750
    assert response.source.source_label == "google_play"
    assert len(client.inserted_feedback_items) == 750
    assert all(item["feedback_set_id"] == "set_456" for item in client.inserted_feedback_items)
    assert all(item["source_id"] == "source_789" for item in client.inserted_feedback_items)
    assert all(item["source_type"] == "review" for item in client.inserted_feedback_items)
    assert all(item["source_label"] == "google_play" for item in client.inserted_feedback_items)
    assert all(item["feedback_date"] for item in client.inserted_feedback_items)
    assert all(item["metadata_json"]["channel"] == "google_play" for item in client.inserted_feedback_items)
    assert client.inserted_feedback_items[0]["metadata_json"]["dataset_id"] == "productivity_tool"
    assert client.inserted_feedback_items[0]["metadata_json"]["real_app_name"] == "Notion"
    update_call = client.calls[-1][1]
    assert isinstance(update_call, dict)
    assert update_call["payload"]["total_feedback_count"] == 755


def test_demo_source_uses_strava_dataset_only_for_fitness_app() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    service.add_demo_source(
        "set_456",
        AddDemoSourceRequest(demoProductId="fitness_app"),
    )

    first_item = client.inserted_feedback_items[0]
    assert first_item["metadata_json"]["dataset_id"] == "fitness_app"
    assert first_item["metadata_json"]["real_app_name"] == "Strava"
    assert first_item["metadata_json"]["dataset_path"] == "data/demo/reviews_strava_google_play_reviews.csv"


def test_demo_source_uses_notion_dataset_only_for_productivity_tool() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    service.add_demo_source(
        "set_456",
        AddDemoSourceRequest(demoProductId="productivity_tool"),
    )

    first_item = client.inserted_feedback_items[0]
    assert first_item["metadata_json"]["dataset_id"] == "productivity_tool"
    assert first_item["metadata_json"]["real_app_name"] == "Notion"
    assert first_item["metadata_json"]["dataset_path"] == "data/demo/reviews_notion_google_play_reviews.csv"


def test_demo_source_uses_hubspot_dataset_only_for_crm_tool() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    service.add_demo_source(
        "set_456",
        AddDemoSourceRequest(demoProductId="crm_tool"),
    )

    first_item = client.inserted_feedback_items[0]
    assert first_item["metadata_json"]["dataset_id"] == "crm_tool"
    assert first_item["metadata_json"]["real_app_name"] == "HubSpot"
    assert first_item["metadata_json"]["dataset_path"] == "data/demo/reviews_hubspot_google_play_reviews.csv"


def test_demo_source_adds_normalized_ingest_fields() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    service.add_demo_source(
        "set_456",
        AddDemoSourceRequest(demoProductId="fitness_app"),
    )

    first_item = client.inserted_feedback_items[0]
    metadata = first_item["metadata_json"]
    assert metadata["ingest_id"] == 1
    assert metadata["source_type"] == "review"
    assert metadata["source_label"] == "google_play"
    assert metadata["feedback_text"] == first_item["raw_text"]
    assert metadata["source_record_created_at"] == first_item["feedback_date"]
    assert first_item["author_handle"]


def test_demo_source_tolerates_invalid_review_date_values() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]
    original_read_demo_csv = demo_ingest._read_demo_csv

    def fake_read_demo_csv(_csv_path):  # type: ignore[no-untyped-def]
        return [
            {
                "username": "invalid-date-user",
                "star_rating": "4",
                "date": "not a real date",
                "review_text": "Solid app overall but date parsing should not break ingest.",
            }
        ]

    demo_ingest._read_demo_csv = fake_read_demo_csv
    try:
        response = service.add_demo_source(
            "set_456",
            AddDemoSourceRequest(demoProductId="fitness_app"),
        )
    finally:
        demo_ingest._read_demo_csv = original_read_demo_csv

    assert response.source.item_count == 1
    assert len(client.inserted_feedback_items) == 1
    first_item = client.inserted_feedback_items[0]
    assert first_item["feedback_date"] is None
    assert first_item["metadata_json"]["source_record_created_at"] is None


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


def test_feedback_set_service_adds_pasted_source_and_updates_total_count() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    response = service.add_pasted_source(
        "set_456",
        AddPastedSourceRequest(
            pastedText="First issue\nSecond issue\nThird issue",
        ),
    )

    assert [call[0] for call in client.calls] == [
        "feedback_sets:fetch",
        "data_sources",
        "feedback_items",
        "feedback_sets:update",
    ]
    assert response.source.feedback_set_id == "set_456"
    assert response.source.source_type == "pasted_text"
    assert response.source.source_label == "Pasted Feedback"
    assert response.source.item_count == 3
    assert len(client.inserted_feedback_items) == 3
    assert [item["raw_text"] for item in client.inserted_feedback_items] == [
        "First issue",
        "Second issue",
        "Third issue",
    ]
    assert all(item["feedback_date"] is None for item in client.inserted_feedback_items)
    assert all(item["author_handle"] is None for item in client.inserted_feedback_items)
    assert client.inserted_feedback_items[0]["metadata_json"]["line_index"] == 1
    update_call = client.calls[-1][1]
    assert isinstance(update_call, dict)
    assert update_call["payload"]["total_feedback_count"] == 8


def test_feedback_set_service_ignores_blank_lines_in_pasted_feedback() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    response = service.add_pasted_source(
        "set_456",
        AddPastedSourceRequest(
            pastedText="First issue\n\n   \nSecond issue\n",
        ),
    )

    assert response.source.item_count == 2
    assert [item["raw_text"] for item in client.inserted_feedback_items] == [
        "First issue",
        "Second issue",
    ]


def test_feedback_set_service_treats_single_paragraph_as_one_feedback_item() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    response = service.add_pasted_source(
        "set_456",
        AddPastedSourceRequest(
            pastedText="The product is useful but setup is confusing and notifications are noisy.",
        ),
    )

    assert response.source.item_count == 1
    assert len(client.inserted_feedback_items) == 1
    assert client.inserted_feedback_items[0]["raw_text"].startswith("The product is useful")


def test_feedback_set_service_rejects_empty_pasted_feedback() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    try:
        service.add_pasted_source(
            "set_456",
            AddPastedSourceRequest(
                pastedText=" \n\t\n",
            ),
        )
    except InvalidPastedFeedbackError as exc:
        assert "non-empty line" in str(exc)
    else:
        raise AssertionError("Expected InvalidPastedFeedbackError")


def test_add_pasted_source_route_returns_frontend_compatible_shape() -> None:
    fake_response = {
        "source": {
            "id": "source_789",
            "feedbackSetId": "set_456",
            "sourceType": "pasted_text",
            "sourceLabel": "Pasted Feedback",
            "itemCount": 2,
            "status": "ready",
            "metadata": {
                "source_origin": "pasted_text",
                "parsing_strategy": "newline_split_v1",
                "character_count": 24,
                "item_count": 2,
            },
            "createdAt": "2026-06-17T12:02:00Z",
        },
    }

    class FakeService:
        def add_pasted_source(self, _feedback_set_id, _request):  # type: ignore[no-untyped-def]
            return fake_response

    app.dependency_overrides[get_feedback_set_service] = lambda: FakeService()
    client = TestClient(app)

    response = client.post(
        "/feedback-sets/set_456/sources/pasted",
        json={"pastedText": "First issue\nSecond issue"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json() == fake_response


def test_add_pasted_source_route_returns_bad_request_for_empty_feedback() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]
    app.dependency_overrides[get_feedback_set_service] = lambda: service
    test_client = TestClient(app)

    response = test_client.post(
        "/feedback-sets/set_456/sources/pasted",
        json={"pastedText": " \n\n "},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert "non-empty line" in response.json()["detail"]


def test_feedback_set_service_adds_csv_source_and_updates_total_count() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    response = service.add_csv_source(
        "set_456",
        file_name="feedback.csv",
        file_bytes=(
            b"feedback_text,rating,feedback_date,author_handle,product_area,category,extra_col\n"
            b"First issue,2,2026-06-01,jane,notifications,ux_issue,alpha\n"
            b"Second issue,4,2026-06-02,john,setup,feature_request,beta\n"
        ),
    )

    assert [call[0] for call in client.calls] == [
        "feedback_sets:fetch",
        "data_sources",
        "feedback_items",
        "feedback_sets:update",
    ]
    assert response.source.feedback_set_id == "set_456"
    assert response.source.source_type == "csv_upload"
    assert response.source.source_label == "CSV Upload"
    assert response.source.item_count == 2
    assert len(client.inserted_feedback_items) == 2
    assert client.inserted_feedback_items[0]["rating"] == 2.0
    assert client.inserted_feedback_items[0]["author_handle"] == "jane"
    assert client.inserted_feedback_items[0]["category"] == "ux_issue"
    assert client.inserted_feedback_items[0]["metadata_json"]["product_area"] == "notifications"
    assert client.inserted_feedback_items[0]["metadata_json"]["extra_columns"] == {
        "extra_col": "alpha",
    }
    update_call = client.calls[-1][1]
    assert isinstance(update_call, dict)
    assert update_call["payload"]["total_feedback_count"] == 7


def test_feedback_set_service_ignores_blank_csv_feedback_rows() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    response = service.add_csv_source(
        "set_456",
        file_name="feedback.csv",
        file_bytes=(
            b"feedback_text,rating\n"
            b"First issue,2\n"
            b" ,3\n"
            b"Second issue,4\n"
        ),
    )

    assert response.source.item_count == 2
    assert [item["raw_text"] for item in client.inserted_feedback_items] == [
        "First issue",
        "Second issue",
    ]


def test_feedback_set_service_rejects_csv_without_feedback_text_column() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    try:
        service.add_csv_source(
            "set_456",
            file_name="feedback.csv",
            file_bytes=b"comment,rating\nHello,5\n",
        )
    except InvalidCsvUploadError as exc:
        assert "feedback_text column" in str(exc)
    else:
        raise AssertionError("Expected InvalidCsvUploadError")


def test_feedback_set_service_rejects_csv_with_no_valid_feedback_rows() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]

    try:
        service.add_csv_source(
            "set_456",
            file_name="feedback.csv",
            file_bytes=b"feedback_text,rating\n ,5\n\t,4\n",
        )
    except InvalidCsvUploadError as exc:
        assert "non-empty feedback_text value" in str(exc)
    else:
        raise AssertionError("Expected InvalidCsvUploadError")


def test_add_csv_source_route_returns_frontend_compatible_shape() -> None:
    fake_response = {
        "source": {
            "id": "source_789",
            "feedbackSetId": "set_456",
            "sourceType": "csv_upload",
            "sourceLabel": "CSV Upload",
            "itemCount": 2,
            "status": "ready",
            "metadata": {
                "source_origin": "csv_upload",
                "file_name": "feedback.csv",
                "processed_row_count": 2,
            },
            "createdAt": "2026-06-17T12:02:00Z",
        },
    }

    class FakeService:
        def add_csv_source(self, _feedback_set_id, *, file_name, file_bytes, source_label):  # type: ignore[no-untyped-def]
            assert file_name == "feedback.csv"
            assert file_bytes.startswith(b"feedback_text")
            assert source_label is None
            return fake_response

    app.dependency_overrides[get_feedback_set_service] = lambda: FakeService()
    client = TestClient(app)

    response = client.post(
        "/feedback-sets/set_456/sources/csv",
        files={"file": ("feedback.csv", b"feedback_text\nFirst issue\n", "text/csv")},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json() == fake_response


def test_add_csv_source_route_returns_bad_request_for_missing_feedback_text_column() -> None:
    client = FakeSupabaseClient()
    service = FeedbackSetService(client)  # type: ignore[arg-type]
    app.dependency_overrides[get_feedback_set_service] = lambda: service
    test_client = TestClient(app)

    response = test_client.post(
        "/feedback-sets/set_456/sources/csv",
        files={"file": ("feedback.csv", b"comment\nHello\n", "text/csv")},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert "feedback_text column" in response.json()["detail"]

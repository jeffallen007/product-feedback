from app.clients.supabase import SupabaseRestClient
from app.demo_datasets import DEMO_DATASETS
from app.errors import FeedbackSetNotFoundError, InvalidDemoProductError, SupabaseInsertError
from app.schemas.feedback_sets import (
    AddDemoSourceRequest,
    AddDemoSourceResponse,
    AnalysisTargetResponse,
    CreateFeedbackSetRequest,
    CreateFeedbackSetResponse,
    DataSourceResponse,
    FeedbackSetResponse,
)


class FeedbackSetService:
    def __init__(self, supabase: SupabaseRestClient) -> None:
        self._supabase = supabase

    def create_feedback_set(
        self,
        request: CreateFeedbackSetRequest,
    ) -> CreateFeedbackSetResponse:
        analysis_target_row = self._supabase.insert_row(
            "analysis_targets",
            {
                "name": request.analysis_target.name,
                "description": request.analysis_target.description,
            },
        )
        feedback_set_row = self._supabase.insert_row(
            "feedback_sets",
            {
                "analysis_target_id": analysis_target_row["id"],
                "name": request.name,
                "analysis_goal": request.analysis_goal,
                "status": "draft",
                "total_feedback_count": 0,
            },
        )

        return CreateFeedbackSetResponse(
            analysisTarget=AnalysisTargetResponse(
                id=str(analysis_target_row["id"]),
                name=str(analysis_target_row["name"]),
                description=str(analysis_target_row["description"]),
                createdAt=analysis_target_row["created_at"],
            ),
            feedbackSet=FeedbackSetResponse(
                id=str(feedback_set_row["id"]),
                analysisTargetId=str(feedback_set_row["analysis_target_id"]),
                name=feedback_set_row.get("name"),
                analysisGoal=str(feedback_set_row["analysis_goal"]),
                status=str(feedback_set_row["status"]),
                totalFeedbackCount=int(feedback_set_row["total_feedback_count"]),
                createdAt=feedback_set_row["created_at"],
                updatedAt=feedback_set_row["updated_at"],
            ),
        )

    def add_demo_source(
        self,
        feedback_set_id: str,
        request: AddDemoSourceRequest,
    ) -> AddDemoSourceResponse:
        demo_dataset = DEMO_DATASETS.get(request.demo_product_id)
        if demo_dataset is None:
            raise InvalidDemoProductError(
                f"Unknown demo product id '{request.demo_product_id}'.",
            )

        try:
            feedback_set_row = self._supabase.fetch_single_row(
                "feedback_sets",
                filters={"id": feedback_set_id},
            )
        except SupabaseInsertError as exc:
            if "no rows" in str(exc).lower():
                raise FeedbackSetNotFoundError(
                    f"Feedback set '{feedback_set_id}' was not found.",
                ) from exc
            raise

        source_row = self._supabase.insert_row(
            "data_sources",
            {
                "feedback_set_id": feedback_set_id,
                "source_type": "demo_dataset",
                "source_label": f"{demo_dataset.label} Demo Dataset",
                "item_count": demo_dataset.item_count,
                "status": "ready",
                "metadata_json": {
                    "demo_product_id": demo_dataset.id,
                    "description": demo_dataset.description,
                },
            },
        )
        updated_total = int(feedback_set_row["total_feedback_count"]) + demo_dataset.item_count
        self._supabase.update_row(
            "feedback_sets",
            payload={"total_feedback_count": updated_total},
            filters={"id": feedback_set_id},
        )

        return AddDemoSourceResponse(
            source=DataSourceResponse(
                id=str(source_row["id"]),
                feedbackSetId=str(source_row["feedback_set_id"]),
                sourceType=str(source_row["source_type"]),
                sourceLabel=str(source_row["source_label"]),
                itemCount=int(source_row["item_count"]),
                status=str(source_row["status"]),
                metadata=source_row.get("metadata_json", {}),
                createdAt=source_row["created_at"],
            ),
        )

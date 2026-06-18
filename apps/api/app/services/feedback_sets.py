from app.clients.supabase import SupabaseRestClient
from app.schemas.feedback_sets import (
    AnalysisTargetResponse,
    CreateFeedbackSetRequest,
    CreateFeedbackSetResponse,
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

from app.clients.supabase import SupabaseRestClient
from app.errors import (
    AnalysisRunNotFoundError,
    EmptyFeedbackSetError,
    FeedbackSetNotFoundError,
    SupabaseInsertError,
)
from app.schemas.analysis_runs import (
    AnalysisRunResponse,
    GetAnalysisRunResponse,
    SynthesizeFeedbackSetRequest,
    SynthesizeFeedbackSetResponse,
)


class AnalysisRunService:
    def __init__(self, supabase: SupabaseRestClient) -> None:
        self._supabase = supabase

    def create_placeholder_run(
        self,
        feedback_set_id: str,
        request: SynthesizeFeedbackSetRequest,
    ) -> SynthesizeFeedbackSetResponse:
        feedback_set = self._get_feedback_set(feedback_set_id)
        sources = self._supabase.fetch_rows(
            "data_sources",
            filters={"feedback_set_id": feedback_set_id},
        )
        if not sources and int(feedback_set["total_feedback_count"]) <= 0:
            feedback_items = self._supabase.fetch_rows(
                "feedback_items",
                filters={"feedback_set_id": feedback_set_id},
                limit=1,
            )
            if not feedback_items:
                raise EmptyFeedbackSetError(
                    f"Feedback set '{feedback_set_id}' has no sources or feedback items.",
                )

        analysis_goal = request.analysis_goal or str(feedback_set["analysis_goal"])
        metadata = {
            "analysis_goal": analysis_goal,
            "total_feedback_count": int(feedback_set["total_feedback_count"]),
            "source_count": len(sources),
            "placeholder_message": "Dashboard generation has not been implemented yet.",
        }
        analysis_run = self._supabase.insert_row(
            "analysis_runs",
            {
                "feedback_set_id": feedback_set_id,
                "status": "completed",
                "current_step": "generate_dashboard",
                "started_at": "2026-06-18T00:00:00+00:00",
                "completed_at": "2026-06-18T00:00:00+00:00",
                "error_message": None,
                "metadata_json": metadata,
            },
        )

        return SynthesizeFeedbackSetResponse(
            analysisRun=self._to_analysis_run_response(analysis_run),
        )

    def get_analysis_run(self, analysis_run_id: str) -> GetAnalysisRunResponse:
        try:
            analysis_run = self._supabase.fetch_single_row(
                "analysis_runs",
                filters={"id": analysis_run_id},
            )
        except SupabaseInsertError as exc:
            if "no rows" in str(exc).lower():
                raise AnalysisRunNotFoundError(
                    f"Analysis run '{analysis_run_id}' was not found.",
                ) from exc
            raise

        dashboard_rows = self._supabase.fetch_rows(
            "dashboard_summaries",
            filters={"analysis_run_id": analysis_run_id},
            limit=1,
        )
        dashboard_payload = None
        placeholder_message = "Dashboard summary has not been generated yet."
        if dashboard_rows:
            dashboard_payload = dashboard_rows[0].get("summary_payload")
            placeholder_message = None

        return GetAnalysisRunResponse(
            analysisRun=self._to_analysis_run_response(analysis_run),
            dashboard=dashboard_payload,
            placeholderMessage=placeholder_message,
        )

    def _get_feedback_set(self, feedback_set_id: str) -> dict[str, object]:
        try:
            return self._supabase.fetch_single_row(
                "feedback_sets",
                filters={"id": feedback_set_id},
            )
        except SupabaseInsertError as exc:
            if "no rows" in str(exc).lower():
                raise FeedbackSetNotFoundError(
                    f"Feedback set '{feedback_set_id}' was not found.",
                ) from exc
            raise

    @staticmethod
    def _to_analysis_run_response(row: dict[str, object]) -> AnalysisRunResponse:
        return AnalysisRunResponse(
            id=str(row["id"]),
            feedbackSetId=str(row["feedback_set_id"]),
            status=str(row["status"]),
            currentStep=row.get("current_step"),
            steps=[],
            startedAt=row.get("started_at"),
            completedAt=row.get("completed_at"),
            errorMessage=row.get("error_message"),
            metadata=row.get("metadata_json", {}),
        )

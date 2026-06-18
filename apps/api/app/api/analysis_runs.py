from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_analysis_run_service
from app.schemas.analysis_runs import (
    GetAnalysisRunResponse,
    SynthesizeFeedbackSetRequest,
    SynthesizeFeedbackSetResponse,
)
from app.schemas.chat import AskAnalysisQuestionRequest, AskAnalysisQuestionResponse
from app.services.analysis_runs import AnalysisRunService

router = APIRouter(tags=["analysis-runs"])


@router.post(
    "/feedback-sets/{feedback_set_id}/synthesize",
    response_model=SynthesizeFeedbackSetResponse,
    status_code=status.HTTP_201_CREATED,
)
def synthesize_feedback_set(
    feedback_set_id: str,
    request: SynthesizeFeedbackSetRequest,
    service: AnalysisRunService = Depends(get_analysis_run_service),
) -> SynthesizeFeedbackSetResponse:
    return service.create_placeholder_run(feedback_set_id, request)


@router.get(
    "/analysis-runs/{analysis_run_id}",
    response_model=GetAnalysisRunResponse,
)
def get_analysis_run(
    analysis_run_id: str,
    service: AnalysisRunService = Depends(get_analysis_run_service),
) -> GetAnalysisRunResponse:
    return service.get_analysis_run(analysis_run_id)


@router.post(
    "/analysis-runs/{analysis_run_id}/chat",
    response_model=AskAnalysisQuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def ask_analysis_question(
    analysis_run_id: str,
    request: AskAnalysisQuestionRequest,
    service: AnalysisRunService = Depends(get_analysis_run_service),
) -> AskAnalysisQuestionResponse:
    return service.ask_placeholder_question(analysis_run_id, request)

from typing import Any

from fastapi import APIRouter, Body, Depends, status

from app.api.dependencies import get_analysis_run_service
from app.api.request_parsing import parse_request_model
from app.schemas.analysis_runs import (
    AnalysisRunBundleResponse,
    GetAnalysisRunResponse,
    SynthesizeFeedbackSetRequest,
    SynthesizeFeedbackSetResponse,
)
from app.schemas.chat import (
    AskAnalysisQuestionRequest,
    AskAnalysisQuestionResponse,
    GetAnalysisChatHistoryResponse,
)
from app.services.analysis_runs import AnalysisRunService

router = APIRouter(tags=["analysis-runs"])


@router.post(
    "/feedback-sets/{feedback_set_id}/synthesize",
    response_model=SynthesizeFeedbackSetResponse,
    status_code=status.HTTP_201_CREATED,
)
def synthesize_feedback_set(
    feedback_set_id: str,
    payload: dict[str, Any] = Body(...),
    service: AnalysisRunService = Depends(get_analysis_run_service),
) -> SynthesizeFeedbackSetResponse:
    request = parse_request_model(payload, SynthesizeFeedbackSetRequest)
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
    payload: dict[str, Any] = Body(...),
    service: AnalysisRunService = Depends(get_analysis_run_service),
) -> AskAnalysisQuestionResponse:
    request = parse_request_model(payload, AskAnalysisQuestionRequest)
    return service.ask_placeholder_question(analysis_run_id, request)


@router.get(
    "/analysis-runs/{analysis_run_id}/chat",
    response_model=GetAnalysisChatHistoryResponse,
)
def get_analysis_chat_history(
    analysis_run_id: str,
    service: AnalysisRunService = Depends(get_analysis_run_service),
) -> GetAnalysisChatHistoryResponse:
    return service.get_chat_history(analysis_run_id)


@router.get(
    "/analysis-runs/{analysis_run_id}/bundle",
    response_model=AnalysisRunBundleResponse,
)
def get_analysis_run_bundle(
    analysis_run_id: str,
    service: AnalysisRunService = Depends(get_analysis_run_service),
) -> AnalysisRunBundleResponse:
    return service.get_analysis_run_bundle(analysis_run_id)

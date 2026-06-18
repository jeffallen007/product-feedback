from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_feedback_set_service
from app.schemas.feedback_sets import (
    AddDemoSourceRequest,
    AddDemoSourceResponse,
    CreateFeedbackSetRequest,
    CreateFeedbackSetResponse,
)
from app.services.feedback_sets import FeedbackSetService

router = APIRouter(tags=["feedback-sets"])


@router.post(
    "/feedback-sets",
    response_model=CreateFeedbackSetResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_feedback_set(
    request: CreateFeedbackSetRequest,
    service: FeedbackSetService = Depends(get_feedback_set_service),
) -> CreateFeedbackSetResponse:
    return service.create_feedback_set(request)


@router.post(
    "/feedback-sets/{feedback_set_id}/sources/demo",
    response_model=AddDemoSourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_demo_source(
    feedback_set_id: str,
    request: AddDemoSourceRequest,
    service: FeedbackSetService = Depends(get_feedback_set_service),
) -> AddDemoSourceResponse:
    return service.add_demo_source(feedback_set_id, request)

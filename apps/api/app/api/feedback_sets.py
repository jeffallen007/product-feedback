from typing import Any

from fastapi import APIRouter, Body, Depends, status

from app.api.dependencies import get_feedback_set_service
from app.api.request_parsing import parse_request_model
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
    payload: dict[str, Any] = Body(...),
    service: FeedbackSetService = Depends(get_feedback_set_service),
) -> CreateFeedbackSetResponse:
    request = parse_request_model(payload, CreateFeedbackSetRequest)
    return service.create_feedback_set(request)


@router.post(
    "/feedback-sets/{feedback_set_id}/sources/demo",
    response_model=AddDemoSourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_demo_source(
    feedback_set_id: str,
    payload: dict[str, Any] = Body(...),
    service: FeedbackSetService = Depends(get_feedback_set_service),
) -> AddDemoSourceResponse:
    request = parse_request_model(payload, AddDemoSourceRequest)
    return service.add_demo_source(feedback_set_id, request)

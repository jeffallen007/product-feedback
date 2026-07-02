from typing import Any

from fastapi import APIRouter, Body, Depends, File, Form, UploadFile, status

from app.api.dependencies import get_feedback_set_service
from app.api.request_parsing import parse_request_model
from app.schemas.feedback_sets import (
    AddCsvSourceResponse,
    AddDemoSourceRequest,
    AddDemoSourceResponse,
    AddPastedSourceRequest,
    AddPastedSourceResponse,
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


@router.post(
    "/feedback-sets/{feedback_set_id}/sources/pasted",
    response_model=AddPastedSourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_pasted_source(
    feedback_set_id: str,
    payload: dict[str, Any] = Body(...),
    service: FeedbackSetService = Depends(get_feedback_set_service),
) -> AddPastedSourceResponse:
    request = parse_request_model(payload, AddPastedSourceRequest)
    return service.add_pasted_source(feedback_set_id, request)


@router.post(
    "/feedback-sets/{feedback_set_id}/sources/csv",
    response_model=AddCsvSourceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_csv_source(
    feedback_set_id: str,
    file: UploadFile = File(...),
    source_label: str | None = Form(default=None),
    service: FeedbackSetService = Depends(get_feedback_set_service),
) -> AddCsvSourceResponse:
    file_bytes = await file.read()
    return service.add_csv_source(
        feedback_set_id,
        file_name=file.filename or "uploaded-feedback.csv",
        file_bytes=file_bytes,
        source_label=source_label,
    )

from typing import Any, TypeVar

from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ValidationError


ModelT = TypeVar("ModelT", bound=BaseModel)


def parse_request_model(
    payload: dict[str, Any],
    model_type: type[ModelT],
) -> ModelT:
    try:
        return model_type.model_validate(payload)
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc

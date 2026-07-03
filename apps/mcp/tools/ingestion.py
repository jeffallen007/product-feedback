from apps.mcp.client.backend_client import ProductFeedbackBackendClient, model_dump
from apps.mcp.client.schemas import AddPastedFeedbackInput


async def add_pasted_feedback(
    feedback_set_id: str,
    text: str,
) -> dict[str, object]:
    payload = AddPastedFeedbackInput(feedback_set_id=feedback_set_id, text=text)
    async with ProductFeedbackBackendClient() as client:
        return model_dump(await client.add_pasted_feedback(payload))


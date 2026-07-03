from apps.mcp.client.backend_client import ProductFeedbackBackendClient, model_dump
from apps.mcp.client.schemas import CreateFeedbackSetInput


async def create_feedback_set(
    product_name: str,
    product_description: str,
    analysis_goal: str,
) -> dict[str, object]:
    payload = CreateFeedbackSetInput(
        product_name=product_name,
        product_description=product_description,
        analysis_goal=analysis_goal,
    )
    async with ProductFeedbackBackendClient() as client:
        return model_dump(await client.create_feedback_set(payload))


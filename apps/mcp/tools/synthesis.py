from apps.mcp.client.backend_client import ProductFeedbackBackendClient, model_dump
from apps.mcp.client.schemas import RunSynthesisInput


async def run_synthesis(feedback_set_id: str) -> dict[str, object]:
    payload = RunSynthesisInput(feedback_set_id=feedback_set_id)
    async with ProductFeedbackBackendClient() as client:
        return model_dump(await client.run_synthesis(payload))


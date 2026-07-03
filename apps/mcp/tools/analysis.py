from apps.mcp.client.backend_client import ProductFeedbackBackendClient, model_dump
from apps.mcp.client.schemas import GetAnalysisBundleInput


async def get_analysis_bundle(analysis_run_id: str) -> dict[str, object]:
    payload = GetAnalysisBundleInput(analysis_run_id=analysis_run_id)
    async with ProductFeedbackBackendClient() as client:
        return model_dump(await client.get_analysis_bundle(payload))


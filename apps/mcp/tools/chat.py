from apps.mcp.client.backend_client import ProductFeedbackBackendClient, model_dump
from apps.mcp.client.schemas import AskAnalysisQuestionInput


async def ask_analysis_question(
    analysis_run_id: str,
    question: str,
) -> dict[str, object]:
    payload = AskAnalysisQuestionInput(
        analysis_run_id=analysis_run_id,
        question=question,
    )
    async with ProductFeedbackBackendClient() as client:
        return model_dump(await client.ask_analysis_question(payload))


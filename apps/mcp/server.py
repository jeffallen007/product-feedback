import inspect
import os

from mcp.server.fastmcp import FastMCP

from apps.mcp.tools.analysis import get_analysis_bundle
from apps.mcp.tools.chat import ask_analysis_question
from apps.mcp.tools.feedback_sets import create_feedback_set
from apps.mcp.tools.ingestion import add_pasted_feedback
from apps.mcp.tools.synthesis import run_synthesis

HOST = "0.0.0.0"
DEFAULT_PORT = 8001
TRANSPORT = "streamable-http"


def get_port() -> int:
    return int(os.environ.get("PORT", str(DEFAULT_PORT)))


def create_mcp_server() -> FastMCP:
    kwargs = {
        "host": HOST,
        "port": get_port(),
    }
    if "stateless_http" in inspect.signature(FastMCP).parameters:
        kwargs["stateless_http"] = True
    return FastMCP("product-feedback-synthesizer", **kwargs)


mcp = create_mcp_server()

mcp.tool()(create_feedback_set)
mcp.tool()(add_pasted_feedback)
mcp.tool()(run_synthesis)
mcp.tool()(get_analysis_bundle)
mcp.tool()(ask_analysis_question)


if __name__ == "__main__":
    mcp.run(transport=TRANSPORT)

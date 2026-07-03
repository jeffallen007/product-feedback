import importlib
import sys
from pathlib import Path


def _import_server_module():
    apps_dir = str(Path(__file__).resolve().parents[2])
    sys.path = [path for path in sys.path if path != apps_dir]
    sys.modules.pop("mcp", None)
    sys.modules.pop("mcp.server", None)
    sys.modules.pop("apps.mcp.server", None)
    return importlib.import_module("apps.mcp.server")


def test_mcp_server_uses_railway_http_settings(monkeypatch) -> None:
    monkeypatch.setenv("PORT", "9123")

    server = _import_server_module()
    mcp = server.create_mcp_server()

    assert server.TRANSPORT == "streamable-http"
    assert mcp.settings.host == "0.0.0.0"
    assert mcp.settings.port == 9123
    assert mcp.settings.stateless_http is True


def test_mcp_server_defaults_to_local_port(monkeypatch) -> None:
    monkeypatch.delenv("PORT", raising=False)

    server = _import_server_module()

    assert server.get_port() == 8001

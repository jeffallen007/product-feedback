from typing import Any

import httpx

from app.config import Settings
from app.errors import MissingSupabaseConfigError, SupabaseInsertError


class SupabaseRestClient:
    def __init__(self, *, url: str, service_role_key: str) -> None:
        if not url or not service_role_key:
            raise MissingSupabaseConfigError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.",
            )

        self._base_url = url.rstrip("/")
        self._service_role_key = service_role_key

    @classmethod
    def from_settings(cls, settings: Settings) -> "SupabaseRestClient":
        return cls(
            url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
        )

    def insert_row(self, table: str, payload: dict[str, Any]) -> dict[str, Any]:
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    f"{self._base_url}/rest/v1/{table}",
                    headers=headers,
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise SupabaseInsertError(
                f"Supabase request failed for table '{table}'.",
            ) from exc

        if response.status_code >= 400:
            raise SupabaseInsertError(
                f"Supabase insert failed for table '{table}': {response.text}",
            )

        rows = response.json()
        if not isinstance(rows, list) or not rows:
            raise SupabaseInsertError(
                f"Supabase insert returned no rows for table '{table}'.",
            )

        row = rows[0]
        if not isinstance(row, dict):
            raise SupabaseInsertError(
                f"Supabase insert returned an invalid row for table '{table}'.",
            )

        return row

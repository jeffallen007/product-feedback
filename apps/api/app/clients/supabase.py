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
        return self._write_request("post", table, payload)

    def fetch_single_row(
        self,
        table: str,
        *,
        filters: dict[str, str],
    ) -> dict[str, Any]:
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
        }
        params = {"select": "*", "limit": "1", **self._serialize_filters(filters)}

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    f"{self._base_url}/rest/v1/{table}",
                    headers=headers,
                    params=params,
                )
        except httpx.HTTPError as exc:
            raise SupabaseInsertError(
                f"Supabase request failed for table '{table}'.",
            ) from exc

        if response.status_code >= 400:
            raise SupabaseInsertError(
                f"Supabase query failed for table '{table}': {response.text}",
            )

        rows = response.json()
        if not isinstance(rows, list) or not rows:
            raise SupabaseInsertError(
                f"Supabase query returned no rows for table '{table}'.",
            )

        row = rows[0]
        if not isinstance(row, dict):
            raise SupabaseInsertError(
                f"Supabase query returned an invalid row for table '{table}'.",
            )

        return row

    def update_row(
        self,
        table: str,
        *,
        payload: dict[str, Any],
        filters: dict[str, str],
    ) -> dict[str, Any]:
        return self._write_request("patch", table, payload, filters=filters)

    def _write_request(
        self,
        method: str,
        table: str,
        payload: dict[str, Any],
        *,
        filters: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        params = self._serialize_filters(filters or {})

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.request(
                    method=method.upper(),
                    url=f"{self._base_url}/rest/v1/{table}",
                    headers=headers,
                    params=params,
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

    @staticmethod
    def _serialize_filters(filters: dict[str, str]) -> dict[str, str]:
        return {key: f"eq.{value}" for key, value in filters.items()}

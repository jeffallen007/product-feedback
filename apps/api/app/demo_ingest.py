from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.demo_datasets import BACKEND_ROOT, DemoDatasetDefinition

REVIEW_SOURCE_TYPE = "review"
REVIEW_SOURCE_LABEL = "google_play"


@dataclass(frozen=True)
class NormalizedDemoReview:
    id: int
    source_type: str
    source_label: str
    feedback_text: str
    rating: int | None
    created_at: str | None
    username: str | None
    normalized_text: str


def load_demo_reviews(
    dataset: DemoDatasetDefinition,
) -> tuple[list[NormalizedDemoReview], int]:
    rows = _read_demo_csv(dataset.csv_path)
    normalized_reviews = [
        NormalizedDemoReview(
            id=index,
            source_type=REVIEW_SOURCE_TYPE,
            source_label=REVIEW_SOURCE_LABEL,
            feedback_text=row["review_text"],
            rating=_parse_rating(row.get("star_rating")),
            created_at=_parse_date(row.get("date")),
            username=_clean_text(row.get("username")),
            normalized_text=_normalize_review_text(row["review_text"]),
        )
        for index, row in enumerate(_sorted_rows(rows), start=1)
    ]
    return normalized_reviews, len(rows)


def normalized_review_metadata(
    *,
    dataset: DemoDatasetDefinition,
    review: NormalizedDemoReview,
    total_record_count: int,
) -> dict[str, Any]:
    return {
        "dataset_id": dataset.id,
        "demo_product_id": dataset.id,
        "demo_product_label": dataset.label,
        "real_app_name": dataset.real_app_name,
        "dataset_path": str(dataset.csv_path.relative_to(BACKEND_ROOT)),
        "channel": REVIEW_SOURCE_LABEL,
        "ingest_id": review.id,
        "source_type": review.source_type,
        "source_label": review.source_label,
        "feedback_text": review.feedback_text,
        "source_record_created_at": review.created_at,
        "username": review.username,
        "total_record_count": total_record_count,
    }


def _read_demo_csv(csv_path: Path) -> list[dict[str, str]]:
    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return [
            {
                "username": row.get("username", ""),
                "star_rating": row.get("star_rating", ""),
                "date": row.get("date", ""),
                "review_text": row.get("review_text", ""),
            }
            for row in reader
            if _clean_text(row.get("review_text"))
        ]


def _sorted_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    return sorted(
        rows,
        key=lambda row: (
            -_sort_date_key(row.get("date")).timestamp(),
            _parse_rating(row.get("star_rating")) or 0,
            _clean_text(row.get("username")) or "",
            _clean_text(row.get("review_text")) or "",
        ),
    )


def _sort_date_key(value: str | None) -> datetime:
    parsed = _parse_date(value)
    if parsed is None:
        return datetime(1970, 1, 1, tzinfo=UTC)
    return datetime.fromisoformat(parsed)


def _parse_rating(value: str | None) -> int | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    try:
        return int(cleaned)
    except ValueError:
        return None


def _parse_date(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    try:
        parsed = datetime.strptime(cleaned, "%B %d, %Y").replace(tzinfo=UTC)
    except ValueError:
        return None
    return parsed.isoformat()


def _normalize_review_text(value: str) -> str:
    cleaned = _clean_text(value) or ""
    return " ".join(cleaned.split())


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None

from __future__ import annotations

import csv
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.demo_datasets import BACKEND_ROOT, DemoDatasetDefinition

DEMO_SAMPLE_SIZE = 75
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
    *,
    sample_size: int = DEMO_SAMPLE_SIZE,
) -> tuple[list[NormalizedDemoReview], int]:
    rows = _read_demo_csv(dataset.csv_path)
    sampled_rows = _sample_rows(rows, sample_size=sample_size)
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
        for index, row in enumerate(sampled_rows, start=1)
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


def _sample_rows(
    rows: list[dict[str, str]],
    *,
    sample_size: int,
) -> list[dict[str, str]]:
    if len(rows) <= sample_size:
        return _sorted_rows(rows)

    grouped: dict[int, list[dict[str, str]]] = defaultdict(list)
    unrated: list[dict[str, str]] = []
    for row in _sorted_rows(rows):
        rating = _parse_rating(row.get("star_rating"))
        if rating is None:
            unrated.append(row)
            continue
        grouped[rating].append(row)

    targets = _allocate_balanced_counts(grouped, sample_size)
    selected: list[dict[str, str]] = []
    selected_keys: set[tuple[str, str, str]] = set()

    for rating in range(1, 6):
        for row in grouped.get(rating, [])[: targets.get(rating, 0)]:
            selected.append(row)
            selected_keys.add(_row_key(row))

    if len(selected) < sample_size:
        leftovers = [
            row for row in _sorted_rows(rows) if _row_key(row) not in selected_keys
        ]
        selected.extend(leftovers[: sample_size - len(selected)])

    return _sorted_rows(selected[:sample_size])


def _allocate_balanced_counts(
    grouped: dict[int, list[dict[str, str]]],
    sample_size: int,
) -> dict[int, int]:
    ratings = [1, 2, 3, 4, 5]
    base = sample_size // len(ratings)
    counts = {rating: min(base, len(grouped.get(rating, []))) for rating in ratings}
    remaining = sample_size - sum(counts.values())

    while remaining > 0:
        allocated = False
        for rating in ratings:
            available = len(grouped.get(rating, []))
            if counts[rating] < available:
                counts[rating] += 1
                remaining -= 1
                allocated = True
                if remaining == 0:
                    break
        if not allocated:
            break

    return counts


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


def _row_key(row: dict[str, str]) -> tuple[str, str, str]:
    return (
        row.get("date", ""),
        row.get("username", ""),
        row.get("review_text", ""),
    )

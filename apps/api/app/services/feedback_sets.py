import csv
from datetime import UTC, datetime
from io import StringIO

from app.clients.supabase import SupabaseRestClient
from app.demo_datasets import BACKEND_ROOT, DEMO_DATASETS
from app.demo_ingest import (
    load_demo_reviews,
    normalized_review_metadata,
)
from app.demo_synthesis import infer_demo_feedback_attributes
from app.errors import (
    FeedbackSetNotFoundError,
    InvalidCsvUploadError,
    InvalidDemoProductError,
    InvalidPastedFeedbackError,
    SupabaseInsertError,
)
from app.schemas.feedback_sets import (
    AddCsvSourceResponse,
    AddDemoSourceRequest,
    AddDemoSourceResponse,
    AddPastedSourceRequest,
    AddPastedSourceResponse,
    AnalysisTargetResponse,
    CreateFeedbackSetRequest,
    CreateFeedbackSetResponse,
    DataSourceResponse,
    FeedbackSetResponse,
)

ALLOWED_FEEDBACK_CATEGORIES = {
    "bug_report",
    "feature_request",
    "ux_issue",
    "pricing_concern",
    "performance_issue",
    "onboarding_friction",
    "positive_feedback",
    "support_complaint",
    "churn_risk",
    "unknown",
}


class FeedbackSetService:
    def __init__(self, supabase: SupabaseRestClient) -> None:
        self._supabase = supabase

    def create_feedback_set(
        self,
        request: CreateFeedbackSetRequest,
    ) -> CreateFeedbackSetResponse:
        analysis_target_row = self._supabase.insert_row(
            "analysis_targets",
            {
                "name": request.analysis_target.name,
                "description": request.analysis_target.description,
            },
        )
        feedback_set_row = self._supabase.insert_row(
            "feedback_sets",
            {
                "analysis_target_id": analysis_target_row["id"],
                "name": request.name,
                "analysis_goal": request.analysis_goal,
                "status": "draft",
                "total_feedback_count": 0,
            },
        )

        return CreateFeedbackSetResponse(
            analysisTarget=AnalysisTargetResponse(
                id=str(analysis_target_row["id"]),
                name=str(analysis_target_row["name"]),
                description=str(analysis_target_row["description"]),
                createdAt=analysis_target_row["created_at"],
            ),
            feedbackSet=FeedbackSetResponse(
                id=str(feedback_set_row["id"]),
                analysisTargetId=str(feedback_set_row["analysis_target_id"]),
                name=feedback_set_row.get("name"),
                analysisGoal=str(feedback_set_row["analysis_goal"]),
                status=str(feedback_set_row["status"]),
                totalFeedbackCount=int(feedback_set_row["total_feedback_count"]),
                createdAt=feedback_set_row["created_at"],
                updatedAt=feedback_set_row["updated_at"],
            ),
        )

    def add_demo_source(
        self,
        feedback_set_id: str,
        request: AddDemoSourceRequest,
    ) -> AddDemoSourceResponse:
        demo_dataset = DEMO_DATASETS.get(request.demo_product_id)
        if demo_dataset is None:
            raise InvalidDemoProductError(
                f"Unknown demo product id '{request.demo_product_id}'.",
            )
        demo_feedback_items, total_record_count = load_demo_reviews(demo_dataset)
        inserted_item_count = len(demo_feedback_items)
        source_label = "google_play"

        try:
            feedback_set_row = self._supabase.fetch_single_row(
                "feedback_sets",
                filters={"id": feedback_set_id},
            )
        except SupabaseInsertError as exc:
            if "no rows" in str(exc).lower():
                raise FeedbackSetNotFoundError(
                    f"Feedback set '{feedback_set_id}' was not found.",
                ) from exc
            raise

        source_row = self._supabase.insert_row(
            "data_sources",
            {
                "feedback_set_id": feedback_set_id,
                "source_type": "review",
                "source_label": source_label,
                "item_count": inserted_item_count,
                "status": "ready",
                "metadata_json": {
                    "demo_product_id": demo_dataset.id,
                    "demo_product_label": demo_dataset.label,
                    "description": demo_dataset.description,
                    "real_app_name": demo_dataset.real_app_name,
                    "dataset_path": str(demo_dataset.csv_path.relative_to(BACKEND_ROOT)),
                    "source_origin": "demo_dataset",
                    "total_record_count": total_record_count,
                    "processed_record_count": inserted_item_count,
                    "persisted_source_type": "review",
                    "persisted_source_label": source_label,
                },
            },
        )
        feedback_item_rows = []
        for item in demo_feedback_items:
            metadata_json = normalized_review_metadata(
                dataset=demo_dataset,
                review=item,
                total_record_count=total_record_count,
            )
            inferred = infer_demo_feedback_attributes(
                demo_dataset.id,
                {
                    "rating": item.rating,
                    "raw_text": item.feedback_text,
                    "normalized_text": item.normalized_text,
                    "metadata_json": metadata_json,
                },
            )
            feedback_item_rows.append(
                {
                    "feedback_set_id": feedback_set_id,
                    "source_id": source_row["id"],
                    "source_type": item.source_type,
                    "source_label": source_label,
                    "raw_text": item.feedback_text,
                    "normalized_text": item.normalized_text,
                    "rating": item.rating,
                    "feedback_date": item.created_at,
                    "author_handle": item.username,
                    "url": None,
                    "category": inferred["category"],
                    "sentiment": inferred["sentiment"],
                    "severity": inferred["severity"],
                    "churn_risk": inferred["churn_risk"],
                    "metadata_json": inferred["metadata_json"],
                }
            )
        self._supabase.insert_rows("feedback_items", feedback_item_rows)

        updated_total = int(feedback_set_row["total_feedback_count"]) + inserted_item_count
        self._supabase.update_row(
            "feedback_sets",
            payload={"total_feedback_count": updated_total},
            filters={"id": feedback_set_id},
        )

        return AddDemoSourceResponse(
            source=DataSourceResponse(
                id=str(source_row["id"]),
                feedbackSetId=str(source_row["feedback_set_id"]),
                sourceType=str(source_row["source_type"]),
                sourceLabel=str(source_row["source_label"]),
                itemCount=inserted_item_count,
                status=str(source_row["status"]),
                metadata=source_row.get("metadata_json", {}),
                createdAt=source_row["created_at"],
            ),
        )

    def add_pasted_source(
        self,
        feedback_set_id: str,
        request: AddPastedSourceRequest,
    ) -> AddPastedSourceResponse:
        feedback_items = self._split_pasted_feedback(request.pasted_text)
        if not feedback_items:
            raise InvalidPastedFeedbackError(
                "Pasted feedback must include at least one non-empty line.",
            )

        try:
            feedback_set_row = self._supabase.fetch_single_row(
                "feedback_sets",
                filters={"id": feedback_set_id},
            )
        except SupabaseInsertError as exc:
            if "no rows" in str(exc).lower():
                raise FeedbackSetNotFoundError(
                    f"Feedback set '{feedback_set_id}' was not found.",
                ) from exc
            raise

        source_label = request.source_label or "Pasted Feedback"
        source_row = self._supabase.insert_row(
            "data_sources",
            {
                "feedback_set_id": feedback_set_id,
                "source_type": "pasted_text",
                "source_label": source_label,
                "item_count": len(feedback_items),
                "status": "ready",
                "metadata_json": {
                    "source_origin": "pasted_text",
                    "parsing_strategy": "newline_split_v1",
                    "character_count": len(request.pasted_text),
                    "item_count": len(feedback_items),
                },
            },
        )

        feedback_item_rows = []
        for index, feedback_text in enumerate(feedback_items, start=1):
            feedback_item_rows.append(
                {
                    "feedback_set_id": feedback_set_id,
                    "source_id": source_row["id"],
                    "source_type": "pasted_text",
                    "source_label": source_label,
                    "raw_text": feedback_text,
                    "normalized_text": feedback_text,
                    "rating": None,
                    "feedback_date": None,
                    "author_handle": None,
                    "url": None,
                    "category": None,
                    "sentiment": None,
                    "severity": None,
                    "churn_risk": None,
                    "metadata_json": {
                        "source_type": "pasted_text",
                        "source_label": source_label,
                        "feedback_text": feedback_text,
                        "parsing_strategy": "newline_split_v1",
                        "line_index": index,
                    },
                }
            )
        self._supabase.insert_rows("feedback_items", feedback_item_rows)

        updated_total = int(feedback_set_row["total_feedback_count"]) + len(feedback_items)
        self._supabase.update_row(
            "feedback_sets",
            payload={"total_feedback_count": updated_total},
            filters={"id": feedback_set_id},
        )

        return AddPastedSourceResponse(
            source=DataSourceResponse(
                id=str(source_row["id"]),
                feedbackSetId=str(source_row["feedback_set_id"]),
                sourceType=str(source_row["source_type"]),
                sourceLabel=str(source_row["source_label"]),
                itemCount=int(source_row["item_count"]),
                status=str(source_row["status"]),
                metadata=source_row.get("metadata_json", {}),
                createdAt=source_row["created_at"],
            ),
        )

    def add_csv_source(
        self,
        feedback_set_id: str,
        *,
        file_name: str,
        file_bytes: bytes,
        source_label: str | None = None,
    ) -> AddCsvSourceResponse:
        parsed_rows, metadata = self._parse_csv_feedback(file_name, file_bytes)

        try:
            feedback_set_row = self._supabase.fetch_single_row(
                "feedback_sets",
                filters={"id": feedback_set_id},
            )
        except SupabaseInsertError as exc:
            if "no rows" in str(exc).lower():
                raise FeedbackSetNotFoundError(
                    f"Feedback set '{feedback_set_id}' was not found.",
                ) from exc
            raise

        normalized_source_label = source_label or "CSV Upload"
        source_row = self._supabase.insert_row(
            "data_sources",
            {
                "feedback_set_id": feedback_set_id,
                "source_type": "csv_upload",
                "source_label": normalized_source_label,
                "item_count": len(parsed_rows),
                "status": "ready",
                "metadata_json": {
                    "source_origin": "csv_upload",
                    "file_name": file_name,
                    "parsing_strategy": "csv_dict_reader_v1",
                    **metadata,
                },
            },
        )

        feedback_item_rows = []
        for row in parsed_rows:
            feedback_item_rows.append(
                {
                    "feedback_set_id": feedback_set_id,
                    "source_id": source_row["id"],
                    "source_type": "csv_upload",
                    "source_label": normalized_source_label,
                    "raw_text": row["feedback_text"],
                    "normalized_text": row["feedback_text"],
                    "rating": row["rating"],
                    "feedback_date": row["feedback_date"],
                    "author_handle": row["author_handle"],
                    "url": None,
                    "category": row["category"],
                    "sentiment": None,
                    "severity": None,
                    "churn_risk": None,
                    "metadata_json": row["metadata_json"],
                }
            )
        self._supabase.insert_rows("feedback_items", feedback_item_rows)

        updated_total = int(feedback_set_row["total_feedback_count"]) + len(parsed_rows)
        self._supabase.update_row(
            "feedback_sets",
            payload={"total_feedback_count": updated_total},
            filters={"id": feedback_set_id},
        )

        return AddCsvSourceResponse(
            source=DataSourceResponse(
                id=str(source_row["id"]),
                feedbackSetId=str(source_row["feedback_set_id"]),
                sourceType=str(source_row["source_type"]),
                sourceLabel=str(source_row["source_label"]),
                itemCount=int(source_row["item_count"]),
                status=str(source_row["status"]),
                metadata=source_row.get("metadata_json", {}),
                createdAt=source_row["created_at"],
            ),
        )

    @staticmethod
    def _split_pasted_feedback(pasted_text: str) -> list[str]:
        return [line.strip() for line in pasted_text.splitlines() if line.strip()]

    @classmethod
    def _parse_csv_feedback(
        cls,
        file_name: str,
        file_bytes: bytes,
    ) -> tuple[list[dict[str, object]], dict[str, object]]:
        if not file_bytes:
            raise InvalidCsvUploadError("Uploaded CSV file is empty.")

        try:
            decoded = file_bytes.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise InvalidCsvUploadError(
                "Uploaded CSV must be UTF-8 encoded.",
            ) from exc

        reader = csv.DictReader(StringIO(decoded))
        if not reader.fieldnames:
            raise InvalidCsvUploadError(
                "Uploaded CSV must include a header row with a feedback_text column.",
            )

        normalized_headers = {
            str(header).strip().lower(): str(header)
            for header in reader.fieldnames
            if header is not None and str(header).strip()
        }
        feedback_header = normalized_headers.get("feedback_text")
        if feedback_header is None:
            raise InvalidCsvUploadError(
                "Uploaded CSV must include a feedback_text column.",
            )

        total_row_count = 0
        blank_feedback_rows = 0
        parsed_rows: list[dict[str, object]] = []
        supported_headers = {
            "feedback_text",
            "rating",
            "date",
            "feedback_date",
            "username",
            "author_handle",
            "source_label",
            "product_area",
            "category",
        }

        for row_index, raw_row in enumerate(reader, start=1):
            total_row_count += 1
            row = {str(key).strip().lower(): value for key, value in raw_row.items() if key is not None}
            feedback_text = cls._clean_csv_value(row.get("feedback_text"))
            if not feedback_text:
                blank_feedback_rows += 1
                continue

            raw_category = cls._clean_csv_value(row.get("category"))
            category = raw_category if raw_category in ALLOWED_FEEDBACK_CATEGORIES else None
            feedback_date_raw = cls._clean_csv_value(row.get("feedback_date")) or cls._clean_csv_value(row.get("date"))
            feedback_date = cls._parse_csv_date(feedback_date_raw)
            author_handle = cls._clean_csv_value(row.get("author_handle")) or cls._clean_csv_value(row.get("username"))
            rating = cls._parse_csv_rating(cls._clean_csv_value(row.get("rating")))
            extra_columns = {
                key: value
                for key, value in row.items()
                if key not in supported_headers and cls._clean_csv_value(value) is not None
            }

            metadata_json: dict[str, object] = {
                "source_type": "csv_upload",
                "source_label": "CSV Upload",
                "feedback_text": feedback_text,
                "csv_row_index": row_index,
                "file_name": file_name,
            }
            row_source_label = cls._clean_csv_value(row.get("source_label"))
            product_area = cls._clean_csv_value(row.get("product_area"))
            if row_source_label:
                metadata_json["row_source_label"] = row_source_label
            if product_area:
                metadata_json["product_area"] = product_area
            if raw_category and category is None:
                metadata_json["raw_category"] = raw_category
            if feedback_date_raw:
                metadata_json["raw_feedback_date"] = feedback_date_raw
            if extra_columns:
                metadata_json["extra_columns"] = extra_columns

            parsed_rows.append(
                {
                    "feedback_text": feedback_text,
                    "rating": rating,
                    "feedback_date": feedback_date,
                    "author_handle": author_handle,
                    "category": category,
                    "metadata_json": metadata_json,
                }
            )

        if not parsed_rows:
            raise InvalidCsvUploadError(
                "Uploaded CSV must include at least one non-empty feedback_text value.",
            )

        return (
            parsed_rows,
            {
                "file_name": file_name,
                "total_row_count": total_row_count,
                "processed_row_count": len(parsed_rows),
                "ignored_blank_feedback_rows": blank_feedback_rows,
            },
        )

    @staticmethod
    def _clean_csv_value(value: object) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None

    @staticmethod
    def _parse_csv_rating(value: str | None) -> float | None:
        if value is None:
            return None
        try:
            return float(value)
        except ValueError:
            return None

    @staticmethod
    def _parse_csv_date(value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.replace("Z", "+00:00")
        formats = (
            None,
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%m/%d/%Y",
            "%m-%d-%Y",
        )
        for format_string in formats:
            try:
                parsed = (
                    datetime.fromisoformat(normalized)
                    if format_string is None
                    else datetime.strptime(normalized, format_string)
                )
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=UTC)
                return parsed.isoformat()
            except ValueError:
                continue
        return None

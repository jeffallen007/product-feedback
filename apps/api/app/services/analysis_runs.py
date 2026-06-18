from collections import Counter

from app.clients.supabase import SupabaseRestClient
from app.dashboard_placeholders import PLACEHOLDER_DASHBOARD_COPY
from app.errors import (
    AnalysisRunNotFoundError,
    EmptyFeedbackSetError,
    FeedbackSetNotFoundError,
    SupabaseInsertError,
)
from app.schemas.analysis_runs import (
    AnalysisRunResponse,
    DashboardPayloadResponse,
    GetAnalysisRunResponse,
    SynthesizeFeedbackSetRequest,
    SynthesizeFeedbackSetResponse,
)
from app.schemas.chat import (
    AskAnalysisQuestionRequest,
    AskAnalysisQuestionResponse,
    ChatEvidenceItemResponse,
    ChatMessageResponse,
)


class AnalysisRunService:
    def __init__(self, supabase: SupabaseRestClient) -> None:
        self._supabase = supabase

    def create_placeholder_run(
        self,
        feedback_set_id: str,
        request: SynthesizeFeedbackSetRequest,
    ) -> SynthesizeFeedbackSetResponse:
        feedback_set = self._get_feedback_set(feedback_set_id)
        analysis_target = self._supabase.fetch_single_row(
            "analysis_targets",
            filters={"id": str(feedback_set["analysis_target_id"])},
        )
        sources = self._supabase.fetch_rows(
            "data_sources",
            filters={"feedback_set_id": feedback_set_id},
        )
        feedback_items = self._supabase.fetch_rows(
            "feedback_items",
            filters={"feedback_set_id": feedback_set_id},
        )
        if not sources and not feedback_items:
            raise EmptyFeedbackSetError(
                f"Feedback set '{feedback_set_id}' has no sources or feedback items.",
            )

        analysis_goal = request.analysis_goal or str(feedback_set["analysis_goal"])
        total_feedback_count = len(feedback_items) if feedback_items else int(feedback_set["total_feedback_count"])
        metadata = {
            "analysis_goal": analysis_goal,
            "total_feedback_count": total_feedback_count,
            "source_count": len(sources),
            "placeholder_message": "Placeholder dashboard summary generated from demo fixtures.",
        }
        analysis_run = self._supabase.insert_row(
            "analysis_runs",
            {
                "feedback_set_id": feedback_set_id,
                "status": "completed",
                "current_step": "generate_dashboard",
                "started_at": "2026-06-18T00:00:00+00:00",
                "completed_at": "2026-06-18T00:00:00+00:00",
                "error_message": None,
                "metadata_json": metadata,
            },
        )
        dashboard_payload = self._build_placeholder_dashboard(
            analysis_run=analysis_run,
            analysis_target=analysis_target,
            feedback_set=feedback_set,
            sources=sources,
            feedback_items=feedback_items,
            analysis_goal=analysis_goal,
        )
        self._supabase.insert_row(
            "dashboard_summaries",
            {
                "analysis_run_id": analysis_run["id"],
                "summary_payload": dashboard_payload.model_dump(by_alias=True),
            },
        )

        return SynthesizeFeedbackSetResponse(
            analysisRun=self._to_analysis_run_response(analysis_run),
        )

    def get_analysis_run(self, analysis_run_id: str) -> GetAnalysisRunResponse:
        analysis_run = self._get_analysis_run_row(analysis_run_id)
        dashboard_payload = self._get_dashboard_payload(analysis_run_id)
        placeholder_message = None if dashboard_payload is not None else "Dashboard summary has not been generated yet."

        return GetAnalysisRunResponse(
            analysisRun=self._to_analysis_run_response(analysis_run),
            dashboard=dashboard_payload,
            placeholderMessage=placeholder_message,
        )

    def ask_placeholder_question(
        self,
        analysis_run_id: str,
        request: AskAnalysisQuestionRequest,
    ) -> AskAnalysisQuestionResponse:
        analysis_run = self._get_analysis_run_row(analysis_run_id)
        dashboard_payload = self._get_dashboard_payload(analysis_run_id)
        feedback_set_id = str(analysis_run["feedback_set_id"])
        sources = self._supabase.fetch_rows(
            "data_sources",
            filters={"feedback_set_id": feedback_set_id},
        )
        feedback_items = self._supabase.fetch_rows(
            "feedback_items",
            filters={"feedback_set_id": feedback_set_id},
        )
        scope = request.scope or "all"

        user_message = self._supabase.insert_row(
            "chat_messages",
            {
                "analysis_run_id": analysis_run_id,
                "role": "user",
                "question": request.question,
                "answer": None,
                "scope": scope,
                "evidence_json": [],
                "follow_up_suggestions": [],
            },
        )

        answer_payload = self._build_placeholder_chat_answer(
            question=request.question,
            scope=scope,
            sources=sources,
            feedback_items=feedback_items,
            dashboard_payload=dashboard_payload,
        )
        assistant_message = self._supabase.insert_row(
            "chat_messages",
            {
                "analysis_run_id": analysis_run_id,
                "role": "assistant",
                "question": None,
                "answer": answer_payload["answer"],
                "scope": scope,
                "evidence_json": [item.model_dump(by_alias=True) for item in answer_payload["evidence"]],
                "follow_up_suggestions": answer_payload["follow_up_suggestions"],
            },
        )

        return AskAnalysisQuestionResponse(
            answer=str(answer_payload["answer"]),
            scopeUsed=scope,
            evidence=answer_payload["evidence"],
            followUpSuggestions=answer_payload["follow_up_suggestions"],
            userMessage=self._to_chat_message_response(user_message),
            assistantMessage=self._to_chat_message_response(assistant_message),
        )

    def _get_analysis_run_row(self, analysis_run_id: str) -> dict[str, object]:
        try:
            return self._supabase.fetch_single_row(
                "analysis_runs",
                filters={"id": analysis_run_id},
            )
        except SupabaseInsertError as exc:
            if "no rows" in str(exc).lower():
                raise AnalysisRunNotFoundError(
                    f"Analysis run '{analysis_run_id}' was not found.",
                ) from exc
            raise

    def _get_dashboard_payload(
        self,
        analysis_run_id: str,
    ) -> DashboardPayloadResponse | None:
        dashboard_rows = self._supabase.fetch_rows(
            "dashboard_summaries",
            filters={"analysis_run_id": analysis_run_id},
            limit=1,
        )
        if dashboard_rows:
            summary_payload = dashboard_rows[0].get("summary_payload")
            if isinstance(summary_payload, dict):
                return DashboardPayloadResponse.model_validate(summary_payload)
        return None

    def _get_feedback_set(self, feedback_set_id: str) -> dict[str, object]:
        try:
            return self._supabase.fetch_single_row(
                "feedback_sets",
                filters={"id": feedback_set_id},
            )
        except SupabaseInsertError as exc:
            if "no rows" in str(exc).lower():
                raise FeedbackSetNotFoundError(
                    f"Feedback set '{feedback_set_id}' was not found.",
                ) from exc
            raise

    @staticmethod
    def _to_analysis_run_response(row: dict[str, object]) -> AnalysisRunResponse:
        return AnalysisRunResponse(
            id=str(row["id"]),
            feedbackSetId=str(row["feedback_set_id"]),
            status=str(row["status"]),
            currentStep=row.get("current_step"),
            steps=[],
            startedAt=row.get("started_at"),
            completedAt=row.get("completed_at"),
            errorMessage=row.get("error_message"),
            metadata=row.get("metadata_json", {}),
        )

    @staticmethod
    def _to_chat_message_response(row: dict[str, object]) -> ChatMessageResponse:
        evidence_json = row.get("evidence_json", [])
        follow_up_suggestions = row.get("follow_up_suggestions", [])
        normalized_evidence = evidence_json if isinstance(evidence_json, list) else []
        normalized_follow_ups = follow_up_suggestions if isinstance(follow_up_suggestions, list) else []

        return ChatMessageResponse(
            id=str(row["id"]),
            analysisRunId=str(row["analysis_run_id"]),
            role=str(row["role"]),
            question=row.get("question"),
            answer=row.get("answer"),
            scope=str(row["scope"]),
            evidence=[ChatEvidenceItemResponse.model_validate(item) for item in normalized_evidence if isinstance(item, dict)],
            followUpSuggestions=[str(item) for item in normalized_follow_ups],
            createdAt=row.get("created_at"),
        )

    def _build_placeholder_dashboard(
        self,
        *,
        analysis_run: dict[str, object],
        analysis_target: dict[str, object],
        feedback_set: dict[str, object],
        sources: list[dict[str, object]],
        feedback_items: list[dict[str, object]],
        analysis_goal: str,
    ) -> DashboardPayloadResponse:
        total_feedback_count = len(feedback_items)
        demo_product_id = None
        if sources:
            metadata = sources[0].get("metadata_json", {})
            if isinstance(metadata, dict):
                demo_product_id = metadata.get("demo_product_id")
        placeholder_copy = PLACEHOLDER_DASHBOARD_COPY.get(
            str(demo_product_id),
            PLACEHOLDER_DASHBOARD_COPY["productivity_tool"],
        )
        source_mix = self._build_source_mix(sources, total_feedback_count)
        representative_quotes = [
            {
                "text": str(item["raw_text"]),
                "sourceLabel": str(item["source_label"]),
            }
            for item in feedback_items[:3]
        ]
        ratings = [int(item["rating"]) for item in feedback_items if item.get("rating") is not None]
        average_rating = sum(ratings) / len(ratings) if ratings else 0
        overall_negative = min(100, 25 + max(0, 4 - round(average_rating)) * 15) if ratings else 38
        source_label = str(sources[0]["source_label"]) if sources else str(analysis_target["name"])
        top_themes = []
        for index, (theme_id, theme_name, description) in enumerate(placeholder_copy["themes"], start=1):
            count = max(1, round(total_feedback_count / (index + 1)))
            percent = round((count / total_feedback_count) * 100) if total_feedback_count else 0
            top_themes.append(
                {
                    "id": theme_id,
                    "rank": index,
                    "name": theme_name,
                    "description": description,
                    "count": count,
                    "percent": percent,
                    "sentiment": "Mixed" if index == 2 else "Mostly negative",
                    "priority": "High" if index == 1 else "Medium",
                    "sourceCoverage": "Demo Dataset",
                }
            )

        return DashboardPayloadResponse.model_validate(
            {
                "analysisContext": {
                    "analysisRunId": str(analysis_run["id"]),
                    "productName": str(analysis_target["name"]),
                    "productDescription": str(analysis_target["description"]),
                    "goal": analysis_goal,
                    "processingMethod": "Placeholder Backend Summary",
                    "sourceCount": len(sources),
                    "feedbackItemCount": total_feedback_count,
                    "lastRunAt": str(analysis_run["completed_at"]),
                },
                "sourceMix": source_mix,
                "kpis": [
                    {"label": "Feedback items analyzed", "value": str(total_feedback_count)},
                    {"label": "Sources included", "value": str(len(sources))},
                    {"label": "Average rating", "value": f"{average_rating:.1f}" if ratings else "N/A"},
                    {"label": "Major themes detected", "value": str(len(top_themes))},
                ],
                "executiveSummary": placeholder_copy["summary"],
                "sentimentBreakdown": {
                    "overall": [
                        {"label": "Positive", "value": max(15, 100 - overall_negative - 22)},
                        {"label": "Neutral", "value": 22},
                        {"label": "Negative", "value": overall_negative},
                    ],
                    "bySource": [
                        {"sourceLabel": source_label, "negativePercent": overall_negative},
                    ],
                },
                "classificationSummary": [
                    {
                        "category": "ux_issue",
                        "count": max(1, total_feedback_count // 3),
                        "percent": round((max(1, total_feedback_count // 3) / total_feedback_count) * 100)
                        if total_feedback_count
                        else 0,
                    },
                    {
                        "category": "feature_request",
                        "count": max(1, total_feedback_count // 4),
                        "percent": round((max(1, total_feedback_count // 4) / total_feedback_count) * 100)
                        if total_feedback_count
                        else 0,
                    },
                ],
                "topThemes": top_themes,
                "painPoints": [
                    {
                        "title": top_themes[0]["name"],
                        "summary": top_themes[0]["description"],
                        "evidenceCount": top_themes[0]["count"],
                        "impact": placeholder_copy["roadmap"],
                        "recommendedAction": placeholder_copy["roadmap"],
                        "representativeQuotes": representative_quotes[:1],
                    }
                ],
                "featureRequests": [
                    {
                        "request": placeholder_copy["feature_request"],
                        "userNeed": "Reduce friction in the core workflow",
                        "supportingEvidence": "Demo Dataset",
                        "priority": "High",
                    }
                ],
                "roadmapRecommendations": [
                    {
                        "phase": "Now",
                        "items": [
                            {
                                "title": placeholder_copy["roadmap"],
                                "rationale": placeholder_copy["signal"],
                            }
                        ],
                    }
                ],
                "representativeQuotes": [
                    {
                        "text": quote["text"],
                        "sourceLabel": quote["sourceLabel"],
                        "themeName": top_themes[0]["name"],
                        "category": "ux_issue",
                    }
                    for quote in representative_quotes
                ],
                "modelSignals": [
                    {"label": "Dataset source", "value": "Synthetic demo fixtures"},
                    {"label": "Primary signal", "value": placeholder_copy["signal"]},
                    {"label": "Most common keyword", "value": self._most_common_keyword(feedback_items)},
                ],
            }
        )

    @staticmethod
    def _build_source_mix(
        sources: list[dict[str, object]],
        total_feedback_count: int,
    ) -> list[dict[str, object]]:
        source_mix = []
        for source in sources:
            count = int(source.get("item_count", 0))
            source_mix.append(
                {
                    "sourceId": str(source["id"]),
                    "sourceType": str(source["source_type"]),
                    "label": str(source["source_label"]),
                    "count": count,
                    "unit": "items",
                    "percent": round((count / total_feedback_count) * 100) if total_feedback_count else 0,
                }
            )
        return source_mix

    @staticmethod
    def _most_common_keyword(feedback_items: list[dict[str, object]]) -> str:
        words = Counter()
        for item in feedback_items:
            for word in str(item["normalized_text"]).lower().split():
                cleaned = word.strip(".,!?\"'")
                if len(cleaned) >= 5:
                    words[cleaned] += 1
        if not words:
            return "n/a"
        return words.most_common(1)[0][0]

    def _build_placeholder_chat_answer(
        self,
        *,
        question: str,
        scope: str,
        sources: list[dict[str, object]],
        feedback_items: list[dict[str, object]],
        dashboard_payload: DashboardPayloadResponse | None,
    ) -> dict[str, object]:
        normalized_question = question.lower()
        scoped_items = self._filter_feedback_items_by_scope(feedback_items, scope)
        evidence = self._build_chat_evidence(
            scoped_items,
            topic=None,
            fallback_theme=dashboard_payload.top_themes[0].name if dashboard_payload and dashboard_payload.top_themes else None,
        )

        if "priorit" in normalized_question and "first" in normalized_question:
            top_theme = dashboard_payload.top_themes[0] if dashboard_payload and dashboard_payload.top_themes else None
            roadmap_item = (
                dashboard_payload.roadmap_recommendations[0].items[0]
                if dashboard_payload and dashboard_payload.roadmap_recommendations and dashboard_payload.roadmap_recommendations[0].items
                else None
            )
            answer = (
                f"Prioritize {roadmap_item.title if roadmap_item else 'the top workflow fix'} first. "
                f"It is the clearest placeholder priority because {top_theme.name if top_theme else 'the leading theme'} "
                f"shows up most often in the persisted demo slice."
            )
            return {
                "answer": answer,
                "evidence": evidence[:2],
                "follow_up_suggestions": [
                    "Which user segment sees this issue most often?",
                    "Turn this priority into a short roadmap memo.",
                ],
            }

        if "compare" in normalized_question and (" x " in f" {normalized_question} " or "x feedback" in normalized_question or "twitter" in normalized_question):
            has_x_source = any(str(source["source_type"]) == "x_search" for source in sources)
            if has_x_source:
                answer = "This placeholder run includes both demo and X feedback, but the compare view is still deterministic and high level until real source-level analysis is added."
            else:
                answer = "This analysis run only includes the demo dataset right now, so there is no persisted X feedback to compare against yet."
            return {
                "answer": answer,
                "evidence": [],
                "follow_up_suggestions": [
                    "Summarize the demo dataset on its own.",
                    "Show the highest-friction themes in the current run.",
                ],
            }

        if ("show evidence" in normalized_question and "notification" in normalized_question) or "notification overload" in normalized_question:
            notification_evidence = self._build_chat_evidence(
                scoped_items,
                topic="notifications",
                fallback_theme="Notification overload",
            )
            answer = "Notification overload is a valid placeholder theme in this run. The persisted demo feedback repeatedly points to noisy default alerts, low-signal updates, and limited targeting controls."
            return {
                "answer": answer,
                "evidence": notification_evidence[:3],
                "follow_up_suggestions": [
                    "Summarize notification issues by severity.",
                    "Draft a fix recommendation for notification defaults.",
                ],
            }

        if "churn risk" in normalized_question:
            low_rating_items = [item for item in scoped_items if item.get("rating") is not None and float(item["rating"]) <= 2]
            answer = (
                f"Placeholder churn risk looks concentrated in {len(low_rating_items)} low-rating items tied to recurring friction. "
                "The strongest signals are repeated workflow pain, reliability gaps, and settings complexity rather than a single blocking bug."
            )
            return {
                "answer": answer,
                "evidence": self._build_chat_evidence(low_rating_items or scoped_items, topic=None, fallback_theme="Churn risk")[:3],
                "follow_up_suggestions": [
                    "Which issues should be addressed first to reduce churn risk?",
                    "Summarize churn risk by theme.",
                ],
            }

        if "roadmap memo" in normalized_question or ("roadmap" in normalized_question and "memo" in normalized_question):
            executive_summary = dashboard_payload.executive_summary if dashboard_payload else "The persisted demo slice shows concentrated friction in a few repeat themes."
            roadmap_item = (
                dashboard_payload.roadmap_recommendations[0].items[0].title
                if dashboard_payload and dashboard_payload.roadmap_recommendations and dashboard_payload.roadmap_recommendations[0].items
                else "the highest-friction workflow fix"
            )
            answer = (
                f"Roadmap memo: {executive_summary} "
                f"Recommended near-term action is to focus on {roadmap_item}, then validate the next theme with another pass over representative evidence."
            )
            return {
                "answer": answer,
                "evidence": evidence[:2],
                "follow_up_suggestions": [
                    "Rewrite this as an executive update.",
                    "List the supporting evidence for the memo.",
                ],
            }

        answer = (
            "This placeholder analysis answer is based on the persisted dashboard summary and demo feedback items. "
            "The current run shows a concentrated set of recurring themes, with evidence available from the stored demo dataset."
        )
        return {
            "answer": answer,
            "evidence": evidence[:2],
            "follow_up_suggestions": [
                "What should the team prioritize first?",
                "Show evidence for the top theme.",
            ],
        }

    @staticmethod
    def _filter_feedback_items_by_scope(
        feedback_items: list[dict[str, object]],
        scope: str,
    ) -> list[dict[str, object]]:
        if scope == "all":
            return feedback_items
        return [item for item in feedback_items if str(item.get("source_type")) == scope]

    @staticmethod
    def _build_chat_evidence(
        feedback_items: list[dict[str, object]],
        *,
        topic: str | None,
        fallback_theme: str | None,
    ) -> list[ChatEvidenceItemResponse]:
        matched_items = []
        for item in feedback_items:
            metadata = item.get("metadata_json", {})
            item_topic = metadata.get("topic") if isinstance(metadata, dict) else None
            if topic is None or item_topic == topic:
                matched_items.append(item)

        selected_items = matched_items[:3] if matched_items else feedback_items[:3]
        evidence = []
        for item in selected_items:
            metadata = item.get("metadata_json", {})
            topic_name = metadata.get("topic") if isinstance(metadata, dict) else None
            evidence.append(
                ChatEvidenceItemResponse(
                    feedbackItemId=str(item["id"]),
                    text=str(item["raw_text"]),
                    sourceLabel=str(item["source_label"]),
                    themeName=str(fallback_theme or topic_name) if (fallback_theme or topic_name) else None,
                    category=str(item.get("category")) if item.get("category") else None,
                )
            )
        return evidence

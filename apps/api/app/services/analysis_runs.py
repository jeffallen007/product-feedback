from collections import Counter

from app.clients.supabase import SupabaseRestClient
from app.demo_synthesis import (
    build_demo_dashboard_payload,
    find_theme_matches,
    get_demo_profile,
    infer_demo_feedback_attributes,
)
from app.errors import (
    AnalysisRunNotFoundError,
    EmptyFeedbackSetError,
    FeedbackSetNotFoundError,
    SupabaseInsertError,
)
from app.services.feedback_synthesis import (
    FeedbackSynthesisService,
    SynthesisRequest,
    infer_generic_feedback_attributes,
    iso_now,
)
from app.schemas.analysis_runs import (
    AnalysisRunBundleResponse,
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
    GetAnalysisChatHistoryResponse,
)
from app.schemas.feedback_sets import (
    AnalysisTargetResponse,
    DataSourceResponse,
    FeedbackSetResponse,
)


class AnalysisRunService:
    def __init__(
        self,
        supabase: SupabaseRestClient,
        *,
        synthesis_service: FeedbackSynthesisService | None = None,
    ) -> None:
        self._supabase = supabase
        self._synthesis_service = synthesis_service or FeedbackSynthesisService(
            llm_client=None,
        )

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
        started_at = iso_now()
        metadata = {
            "analysis_goal": analysis_goal,
            "total_feedback_count": total_feedback_count,
            "source_count": len(sources),
            "placeholder_message": "Dashboard summary generated from persisted feedback.",
        }
        analysis_run = self._supabase.insert_row(
            "analysis_runs",
            {
                "feedback_set_id": feedback_set_id,
                "status": "completed",
                "current_step": "generate_dashboard",
                "started_at": started_at,
                "completed_at": started_at,
                "error_message": None,
                "metadata_json": metadata,
            },
        )
        synthesis_result = self._synthesis_service.synthesize(
            SynthesisRequest(
                analysis_run_id=str(analysis_run["id"]),
                analysis_goal=analysis_goal,
                product_name=str(analysis_target["name"]),
                product_description=str(analysis_target["description"]),
                completed_at=str(analysis_run["completed_at"]),
                dataset_id=self._resolve_demo_product_id(
                    analysis_target=analysis_target,
                    sources=sources,
                    feedback_items=feedback_items,
                ),
                sources=sources,
                feedback_items=[
                    self._normalize_feedback_item(
                        self._resolve_demo_product_id(
                            analysis_target=analysis_target,
                            sources=sources,
                            feedback_items=feedback_items,
                        ),
                        item,
                    )
                    for item in feedback_items
                ],
            )
        )
        metadata.update(synthesis_result.metadata)
        self._supabase.update_row(
            "analysis_runs",
            payload={"metadata_json": metadata},
            filters={"id": str(analysis_run["id"])},
        )
        self._supabase.insert_row(
            "dashboard_summaries",
            {
                "analysis_run_id": analysis_run["id"],
                "summary_payload": synthesis_result.dashboard_payload.model_dump(by_alias=True),
            },
        )
        analysis_run["metadata_json"] = metadata

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

    def get_chat_history(
        self,
        analysis_run_id: str,
    ) -> GetAnalysisChatHistoryResponse:
        self._get_analysis_run_row(analysis_run_id)
        return GetAnalysisChatHistoryResponse(
            messages=self._get_chat_history_messages(analysis_run_id),
        )

    def get_analysis_run_bundle(
        self,
        analysis_run_id: str,
    ) -> AnalysisRunBundleResponse:
        analysis_run = self._get_analysis_run_row(analysis_run_id)
        feedback_set = self._get_feedback_set(str(analysis_run["feedback_set_id"]))
        analysis_target = self._supabase.fetch_single_row(
            "analysis_targets",
            filters={"id": str(feedback_set["analysis_target_id"])},
        )
        sources = self._supabase.fetch_rows(
            "data_sources",
            filters={"feedback_set_id": str(feedback_set["id"])},
        )
        dashboard_payload = self._get_dashboard_payload(analysis_run_id)
        placeholder_message = None if dashboard_payload is not None else "Dashboard summary has not been generated yet."

        return AnalysisRunBundleResponse(
            analysisRun=self._to_analysis_run_response(analysis_run),
            feedbackSet=self._to_feedback_set_response(feedback_set),
            analysisTarget=self._to_analysis_target_response(analysis_target),
            sources=[self._to_data_source_response(source) for source in sources],
            dashboard=dashboard_payload,
            chatHistory=self._get_chat_history_messages(analysis_run_id),
            placeholderMessage=placeholder_message,
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
    def _to_feedback_set_response(row: dict[str, object]) -> FeedbackSetResponse:
        return FeedbackSetResponse(
            id=str(row["id"]),
            analysisTargetId=str(row["analysis_target_id"]),
            name=row.get("name"),
            analysisGoal=str(row["analysis_goal"]),
            status=str(row["status"]),
            totalFeedbackCount=int(row["total_feedback_count"]),
            createdAt=row.get("created_at"),
            updatedAt=row.get("updated_at"),
        )

    @staticmethod
    def _to_analysis_target_response(row: dict[str, object]) -> AnalysisTargetResponse:
        return AnalysisTargetResponse(
            id=str(row["id"]),
            name=str(row["name"]),
            description=str(row["description"]),
            createdAt=row.get("created_at"),
        )

    @staticmethod
    def _to_data_source_response(row: dict[str, object]) -> DataSourceResponse:
        metadata = row.get("metadata_json", {})
        return DataSourceResponse(
            id=str(row["id"]),
            feedbackSetId=str(row["feedback_set_id"]),
            sourceType=str(row["source_type"]),
            sourceLabel=str(row["source_label"]),
            itemCount=int(row["item_count"]),
            status=str(row["status"]),
            metadata=metadata if isinstance(metadata, dict) else {},
            createdAt=row.get("created_at"),
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

    def _get_chat_history_messages(
        self,
        analysis_run_id: str,
    ) -> list[ChatMessageResponse]:
        chat_rows = self._supabase.fetch_rows(
            "chat_messages",
            filters={"analysis_run_id": analysis_run_id},
        )
        ordered_rows = sorted(
            chat_rows,
            key=lambda row: str(row.get("created_at") or ""),
        )
        return [self._to_chat_message_response(row) for row in ordered_rows]

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
        demo_product_id = self._resolve_demo_product_id(
            analysis_target=analysis_target,
            sources=sources,
            feedback_items=feedback_items,
        )
        return DashboardPayloadResponse.model_validate(
            build_demo_dashboard_payload(
                dataset_id=demo_product_id,
                analysis_run_id=str(analysis_run["id"]),
                analysis_goal=analysis_goal,
                completed_at=str(analysis_run["completed_at"]),
                product_name=str(analysis_target["name"]),
                product_description=str(analysis_target["description"]),
                sources=sources,
                feedback_items=feedback_items,
            )
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
        demo_product_id = self._resolve_demo_product_id(
            analysis_target=None,
            sources=sources,
            feedback_items=feedback_items,
        )
        profile = get_demo_profile(demo_product_id)
        scoped_items = self._filter_feedback_items_by_scope(feedback_items, scope)
        normalized_items = [
            self._normalize_feedback_item(demo_product_id, item) for item in scoped_items
        ]
        evidence = self._build_chat_evidence(
            normalized_items,
            topic=None,
            fallback_theme=dashboard_payload.top_themes[0].name if dashboard_payload and dashboard_payload.top_themes else None,
        )
        matched_themes = find_theme_matches(demo_product_id, normalized_question)
        matched_theme = matched_themes[0] if matched_themes else None

        if "priorit" in normalized_question and "first" in normalized_question:
            top_theme = dashboard_payload.top_themes[0] if dashboard_payload and dashboard_payload.top_themes else None
            roadmap_item = (
                dashboard_payload.roadmap_recommendations[0].items[0]
                if dashboard_payload and dashboard_payload.roadmap_recommendations and dashboard_payload.roadmap_recommendations[0].items
                else None
            )
            answer = (
                f"Prioritize {roadmap_item.title if roadmap_item else 'the top workflow fix'} first. "
                f"It is the clearest near-term move because {top_theme.name if top_theme else 'the leading theme'} "
                f"is the strongest repeated signal in the persisted feedback and maps to the highest-friction user workflow."
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

        if matched_theme is not None or ("show evidence" in normalized_question and "notification" in normalized_question):
            theme_name = matched_theme.name if matched_theme is not None else "Notification overload"
            topic = matched_theme.topics[0] if matched_theme is not None and matched_theme.topics else "notifications"
            notification_evidence = self._build_chat_evidence(
                normalized_items,
                topic=topic,
                fallback_theme=theme_name,
            )
            evidence_count = len(notification_evidence)
            theme_context = (
                f"{theme_name} is one of the strongest signals in this run."
                if matched_theme is not None
                else "Notification overload is one of the strongest signals in this run."
            )
            answer = (
                f"{theme_context} The persisted feedback points to repeated friction around "
                f"{matched_theme.user_need.lower() if matched_theme is not None else 'noisy default alerts and limited targeting controls'}. "
                f"I found {evidence_count} representative items tied to that theme in the current scope."
            )
            return {
                "answer": answer,
                "evidence": notification_evidence[:3],
                "follow_up_suggestions": [
                    f"Summarize {theme_name.lower()} by severity.",
                    f"Draft a roadmap recommendation for {theme_name.lower()}.",
                ],
            }

        if "churn risk" in normalized_question:
            low_rating_items = [item for item in normalized_items if item.get("rating") is not None and float(item["rating"]) <= 2]
            risk_themes = Counter(
                str(item.get("theme_name") or "general reliability")
                for item in low_rating_items
            )
            leading_risk = risk_themes.most_common(1)[0][0] if risk_themes else "general reliability"
            answer = (
                f"Churn risk is concentrated in {len(low_rating_items)} low-rating items, with the sharpest pressure around {leading_risk.lower()}. "
                "The pattern here looks like repeated workflow frustration and trust erosion rather than a single isolated bug."
            )
            return {
                "answer": answer,
                "evidence": self._build_chat_evidence(low_rating_items or normalized_items, topic=None, fallback_theme=leading_risk)[:3],
                "follow_up_suggestions": [
                    "Which issues should be addressed first to reduce churn risk?",
                    "Summarize churn risk by theme.",
                ],
            }

        if "persona" in normalized_question or "customer" in normalized_question or "segment" in normalized_question:
            if dashboard_payload and dashboard_payload.top_themes:
                primary = dashboard_payload.top_themes[0].name
                answer = (
                    f"The clearest persona signal is operational users who feel the main workflow friction most often. "
                    f"For this run, {primary.lower()} stands out as the leading complaint, which usually indicates pain for the team members closest to daily execution."
                )
            elif profile is not None:
                answer = (
                    f"The dataset is tuned around product-specific personas rather than a generic audience. "
                    f"The strongest signals usually come from users described in themes like {profile.themes[0].name.lower()} and {profile.themes[1].name.lower()}."
                )
            else:
                answer = "This run has limited persona metadata, but the strongest signals still cluster around recurring workflow friction."
            return {
                "answer": answer,
                "evidence": evidence[:2],
                "follow_up_suggestions": [
                    "Which theme affects that persona most?",
                    "Turn this into a PM brief for the team.",
                ],
            }

        if "severity" in normalized_question or "confidence" in normalized_question:
            high_severity = sum(
                1 for item in normalized_items if str(item.get("severity")) in {"high", "critical"}
            )
            mapped = sum(1 for item in normalized_items if item.get("theme_key"))
            answer = (
                f"This demo synthesis has {high_severity} high-severity signals in the current scope. "
                f"Confidence is strongest where the feedback maps cleanly to known product themes; {mapped} of {len(normalized_items)} scoped items were classified that way."
            )
            return {
                "answer": answer,
                "evidence": evidence[:3],
                "follow_up_suggestions": [
                    "Which high-severity theme should move first?",
                    "Show the quotes behind the high-severity signals.",
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

        if "summary" in normalized_question or "executive" in normalized_question:
            answer = dashboard_payload.executive_summary if dashboard_payload else (
                "This run contains concentrated product-specific feedback with a few recurring themes, but the saved summary is not available."
            )
            return {
                "answer": answer,
                "evidence": evidence[:2],
                "follow_up_suggestions": [
                    "What should the team prioritize first?",
                    "Show the evidence behind the top theme.",
                ],
            }

        answer = (
            "This analysis answer is based on the persisted dashboard summary and deterministic demo synthesis. "
            "The current run shows a concentrated set of product-specific themes, and the stored feedback items provide supporting evidence for follow-up questions."
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

    @staticmethod
    def _resolve_demo_product_id(
        *,
        analysis_target: dict[str, object] | None,
        sources: list[dict[str, object]],
        feedback_items: list[dict[str, object]],
    ) -> str | None:
        for source in sources:
            metadata = source.get("metadata_json", {})
            if isinstance(metadata, dict) and isinstance(metadata.get("demo_product_id"), str):
                return str(metadata["demo_product_id"])

        for item in feedback_items:
            metadata = item.get("metadata_json", {})
            if isinstance(metadata, dict) and isinstance(metadata.get("dataset_id"), str):
                return str(metadata["dataset_id"])

        if analysis_target is not None:
            name = str(analysis_target.get("name", "")).lower()
            if "fitness" in name:
                return "fitness_app"
            if "crm" in name:
                return "crm_tool"
            if "productivity" in name:
                return "productivity_tool"
        return None

    @staticmethod
    def _normalize_feedback_item(
        dataset_id: str | None,
        item: dict[str, object],
    ) -> dict[str, object]:
        inferred = infer_demo_feedback_attributes(dataset_id, item) if dataset_id is not None else infer_generic_feedback_attributes(item)
        normalized = dict(item)
        normalized.update(
            {
                "category": item.get("category") or inferred["category"],
                "sentiment": item.get("sentiment") or inferred["sentiment"],
                "severity": item.get("severity") or inferred["severity"],
                "churn_risk": item.get("churn_risk") if item.get("churn_risk") is not None else inferred["churn_risk"],
                "metadata_json": inferred["metadata_json"],
                "theme_key": inferred["theme_key"],
                "theme_name": inferred["theme_name"],
            }
        )
        return normalized

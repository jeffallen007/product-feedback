from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ThemeDefinition:
    key: str
    name: str
    description: str
    topics: tuple[str, ...]
    aliases: tuple[str, ...]
    category: str
    default_sentiment: str
    default_severity: str
    priority: str
    persona_signal: str
    product_area: str
    impact: str
    recommended_action: str
    feature_request: str
    user_need: str
    source_coverage: str


@dataclass(frozen=True)
class DemoDatasetProfile:
    dataset_id: str
    summary_focus: str
    strength_signal: str
    roadmap_narrative: str
    themes: tuple[ThemeDefinition, ...]
    roadmap_order: tuple[str, ...]


GOAL_SECTION_MAP: dict[str, set[str]] = {
    "Full Product Feedback Synthesis": {
        "sentimentBreakdown",
        "classificationSummary",
        "topThemes",
        "painPoints",
        "featureRequests",
        "roadmapRecommendations",
        "representativeQuotes",
        "modelSignals",
    },
    "Identify Top Pain Points": {
        "topThemes",
        "painPoints",
        "representativeQuotes",
        "modelSignals",
    },
    "Find Feature Requests": {
        "topThemes",
        "featureRequests",
        "representativeQuotes",
        "modelSignals",
    },
    "Prioritize Roadmap Opportunities": {
        "topThemes",
        "featureRequests",
        "roadmapRecommendations",
        "representativeQuotes",
        "modelSignals",
    },
    "Summarize Sentiment": {
        "sentimentBreakdown",
        "topThemes",
        "representativeQuotes",
        "modelSignals",
    },
    "Identify Churn / Retention Risks": {
        "classificationSummary",
        "topThemes",
        "painPoints",
        "roadmapRecommendations",
        "representativeQuotes",
        "modelSignals",
    },
    "Generate Product Strategy Recommendations": {
        "topThemes",
        "featureRequests",
        "roadmapRecommendations",
        "representativeQuotes",
        "modelSignals",
    },
}


PRODUCTIVITY_THEMES = (
    ThemeDefinition(
        key="notification_overload",
        name="Notification overload",
        description="Teams are getting too many low-signal alerts and losing trust in what requires attention.",
        topics=("notifications",),
        aliases=("notifications", "alerts", "pinged", "muting"),
        category="ux_issue",
        default_sentiment="negative",
        default_severity="high",
        priority="High",
        persona_signal="Team leads and heavy collaborators are the loudest about alert fatigue.",
        product_area="Notifications",
        impact="Alert fatigue makes users mute the product, which increases the risk of missed deadlines and lower daily engagement.",
        recommended_action="Introduce quieter defaults, role-based notification presets, and clearer controls for mentions versus low-signal status changes.",
        feature_request="Granular notification controls",
        user_need="Surface only the updates that matter to each teammate.",
        source_coverage="App Store + Survey + Community",
    ),
    ThemeDefinition(
        key="dashboard_flexibility",
        name="Dashboard flexibility gaps",
        description="Teams want to resize, reorder, and personalize dashboard views for different reporting rituals.",
        topics=("dashboards",),
        aliases=("dashboard", "widgets", "layout", "reporting views"),
        category="feature_request",
        default_sentiment="mixed",
        default_severity="medium",
        priority="High",
        persona_signal="Project managers and ops leads want dashboards that match team-specific reporting needs.",
        product_area="Dashboards",
        impact="Rigid dashboards lower perceived product maturity for cross-functional teams with specialized workflows.",
        recommended_action="Add drag-and-drop widget layout controls, saved views, and admin-level dashboard templates.",
        feature_request="Custom dashboard widgets and saved layouts",
        user_need="Build dashboards that reflect how each team reviews work and health metrics.",
        source_coverage="Survey-led signal",
    ),
    ThemeDefinition(
        key="mobile_reliability",
        name="Mobile reliability and offline trust",
        description="Mobile usage loses credibility when large projects load slowly or offline drafts disappear.",
        topics=("offline_mode", "mobile_performance"),
        aliases=("mobile", "offline", "attachments", "train"),
        category="performance_issue",
        default_sentiment="negative",
        default_severity="high",
        priority="High",
        persona_signal="Field users and commuting contributors are most exposed to the reliability gap.",
        product_area="Mobile",
        impact="Reliability issues break trust for on-the-go contributors and can lead to lost work.",
        recommended_action="Stabilize offline drafts first, then optimize attachment-heavy project loading on mobile.",
        feature_request="Reliable offline drafts and faster mobile project loading",
        user_need="Trust the mobile app for quick updates without losing comments or waiting on large projects.",
        source_coverage="Support + App Store",
    ),
    ThemeDefinition(
        key="workflow_discoverability",
        name="Workflow discoverability and setup friction",
        description="High-value workflow features exist, but users struggle to find or configure them quickly.",
        topics=("discoverability", "automation"),
        aliases=("recurring", "automation", "setup", "discover"),
        category="onboarding_friction",
        default_sentiment="mixed",
        default_severity="medium",
        priority="Medium",
        persona_signal="New admins and workflow owners need more guidance when they move beyond basic task tracking.",
        product_area="Workflow setup",
        impact="Teams take longer to reach advanced-product value, which stretches onboarding and evaluation cycles.",
        recommended_action="Pair templates with guided setup flows and clearer error states for automation rules.",
        feature_request="Guided workflow setup and clearer automation diagnostics",
        user_need="Adopt advanced workflow features without trial-and-error configuration.",
        source_coverage="Community-driven signal",
    ),
    ThemeDefinition(
        key="collaboration_controls",
        name="Collaboration controls and guest permissions",
        description="Permission rules for guests and cross-team contributors remain hard to reason about.",
        topics=("permissions",),
        aliases=("permissions", "guest", "visibility", "collaborators"),
        category="support_complaint",
        default_sentiment="negative",
        default_severity="medium",
        priority="Medium",
        persona_signal="Operations leads and project owners want safer sharing without constant admin cleanup.",
        product_area="Permissions",
        impact="Permission confusion slows collaboration and creates hesitation around inviting external stakeholders.",
        recommended_action="Clarify guest-role defaults, make access outcomes more explicit, and add safer preset sharing modes.",
        feature_request="Simpler guest permission presets",
        user_need="Invite collaborators with confidence about what they can see and edit.",
        source_coverage="Support-led signal",
    ),
)

FITNESS_THEMES = (
    ThemeDefinition(
        key="device_sync_reliability",
        name="Device sync reliability",
        description="Users trust the coaching experience, but sync issues undermine confidence in wearables and external devices.",
        topics=("device_sync", "device_setup", "tracking_accuracy"),
        aliases=("watch", "sync", "strap", "tracking", "calories"),
        category="performance_issue",
        default_sentiment="negative",
        default_severity="high",
        priority="High",
        persona_signal="Committed runners and cyclists notice reliability gaps immediately because they compare against dedicated hardware.",
        product_area="Connected devices",
        impact="Hardware trust issues weaken retention among the most engaged fitness users.",
        recommended_action="Tighten wearable sync reliability, improve setup guidance, and validate key accuracy metrics for cycling and heart-rate tracking.",
        feature_request="More reliable wearable sync and setup diagnostics",
        user_need="Trust device-linked metrics during training without second-guessing the numbers.",
        source_coverage="App Store + Support",
    ),
    ThemeDefinition(
        key="content_depth_and_progress",
        name="Content depth and progress visibility",
        description="Users want more beginner-friendly programs and clearer progress tracking as they build routine.",
        topics=("content_library", "analytics", "coaching", "engagement"),
        aliases=("beginner", "progress", "charts", "coach", "streak"),
        category="feature_request",
        default_sentiment="mixed",
        default_severity="medium",
        priority="High",
        persona_signal="Newer subscribers want the product to feel more supportive and measurable in the first month.",
        product_area="Programs and analytics",
        impact="Shallow entry-level content and weak progress views make subscription value harder to defend.",
        recommended_action="Expand short beginner programs and add stronger pace, distance, and streak progress reporting.",
        feature_request="Beginner program expansion with richer progress charts",
        user_need="Build confidence and see measurable improvement early in the subscription journey.",
        source_coverage="Survey + NPS",
    ),
    ThemeDefinition(
        key="subscription_value",
        name="Subscription value pressure",
        description="Pricing feels harder to justify when premium experiences buffer or when household plans are missing.",
        topics=("pricing",),
        aliases=("price", "subscription", "family plan", "justify"),
        category="pricing_concern",
        default_sentiment="negative",
        default_severity="medium",
        priority="High",
        persona_signal="Budget-conscious households evaluate price against reliability and family usage flexibility.",
        product_area="Packaging and pricing",
        impact="Value skepticism increases cancellation risk if reliability and premium differentiation are inconsistent.",
        recommended_action="Link pricing wins to reliability improvements and test a family-plan packaging concept.",
        feature_request="Family subscription plan with clearer premium value",
        user_need="Feel that the subscription cost matches the consistency and flexibility of the experience.",
        source_coverage="App Store + Community",
    ),
    ThemeDefinition(
        key="offline_and_playback",
        name="Offline and playback reliability",
        description="Network transitions and playback bugs interrupt moments when users expect workouts and meditations to be dependable.",
        topics=("offline_mode", "playback_bug"),
        aliases=("offline", "download", "buffer", "audio"),
        category="bug_report",
        default_sentiment="negative",
        default_severity="high",
        priority="Medium",
        persona_signal="Traveling users are least tolerant of instability during downloads, playback, or hotel-Wi-Fi sessions.",
        product_area="Playback",
        impact="Interrupted sessions erode trust during high-intent workout moments.",
        recommended_action="Harden offline handoff behavior and resolve session-end audio playback bugs before expanding premium content.",
        feature_request="More reliable offline downloads and playback recovery",
        user_need="Start and complete workouts reliably even with unstable connectivity.",
        source_coverage="Support-led signal",
    ),
    ThemeDefinition(
        key="social_feed_focus",
        name="Social feed signal quality",
        description="Users like community motivation but want closer control over whose activity appears.",
        topics=("social_features",),
        aliases=("social", "friends", "feed"),
        category="ux_issue",
        default_sentiment="mixed",
        default_severity="low",
        priority="Low",
        persona_signal="Motivated users prefer a tighter circle of accountability over a noisy broad feed.",
        product_area="Social",
        impact="Noisy feed design lowers engagement with an otherwise sticky community loop.",
        recommended_action="Add a close-friends filter and cleaner social feed defaults.",
        feature_request="Close-friends social feed filter",
        user_need="Use social motivation without feeling distracted by irrelevant activity.",
        source_coverage="App Store signal",
    ),
)

CRM_THEMES = (
    ThemeDefinition(
        key="data_hygiene_at_scale",
        name="Data hygiene at scale",
        description="Bulk editing, imports, and duplicate cleanup still feel too slow for ops-heavy teams.",
        topics=("contact_management", "data_quality"),
        aliases=("bulk", "import", "cleanup", "duplicate", "records"),
        category="ux_issue",
        default_sentiment="negative",
        default_severity="high",
        priority="High",
        persona_signal="Sales ops teams are the most vocal because cleanup work compounds with every import or event list.",
        product_area="Data management",
        impact="Slow cleanup workflows increase administrative drag and undermine confidence in CRM quality.",
        recommended_action="Speed up bulk edits, improve import normalization, and expose stronger duplicate-resolution tooling.",
        feature_request="Faster bulk editing and smarter import cleanup",
        user_need="Maintain clean pipeline data without turning ops work into a weekly project.",
        source_coverage="Support + Import workflows",
    ),
    ThemeDefinition(
        key="reporting_and_forecast_visibility",
        name="Reporting and forecast visibility",
        description="Managers want faster insight into rep performance, stale deals, and forecast changes without manual work.",
        topics=("reporting", "notifications", "forecasting", "automation"),
        aliases=("reporting", "forecast", "stale deals", "alerts", "analytics"),
        category="feature_request",
        default_sentiment="mixed",
        default_severity="medium",
        priority="High",
        persona_signal="Frontline managers and revenue leaders want the CRM to surface risk earlier, not just store pipeline state.",
        product_area="Reporting",
        impact="Weak visibility delays interventions on rep performance and forecast health.",
        recommended_action="Deepen reporting comparisons and ship stronger stale-deal alerts into Slack and manager dashboards.",
        feature_request="Manager reporting views with stale-deal alerts",
        user_need="Spot pipeline risk and rep trends without stitching together manual reports.",
        source_coverage="Survey + NPS + Community",
    ),
    ThemeDefinition(
        key="pipeline_governance",
        name="Pipeline governance and permissions clarity",
        description="Admins need stronger controls for required fields and clearer visibility rules for managers.",
        topics=("pipeline_rules", "permissions", "pipeline_ux"),
        aliases=("stage", "required fields", "permissions", "filters", "visibility"),
        category="onboarding_friction",
        default_sentiment="negative",
        default_severity="medium",
        priority="High",
        persona_signal="RevOps and managers want safer defaults so process compliance does not depend on constant policing.",
        product_area="Pipeline administration",
        impact="Loose governance creates inconsistent opportunity hygiene and avoidable admin support work.",
        recommended_action="Add stage-based field enforcement, reduce filter-reset surprises, and clarify manager visibility presets.",
        feature_request="Stage-based required fields and clearer manager permission presets",
        user_need="Keep pipeline data consistent without making the tool harder for reps to use.",
        source_coverage="Forum + Support + App Store",
    ),
    ThemeDefinition(
        key="onboarding_and_mobile_speed",
        name="Onboarding and mobile speed",
        description="First-run setup and mobile note-taking still feel slower than the rest of the product.",
        topics=("onboarding", "mobile_performance"),
        aliases=("onboarding", "import", "mobile", "notes", "lag"),
        category="performance_issue",
        default_sentiment="negative",
        default_severity="medium",
        priority="Medium",
        persona_signal="Smaller teams evaluating the CRM feel setup drag most sharply because they need value on day one.",
        product_area="Onboarding and mobile",
        impact="Time-to-value slips when first import and field usage are slower than expected.",
        recommended_action="Reduce setup clicks before the first import and stabilize note sync on weak connections.",
        feature_request="Faster first-import onboarding and more reliable mobile notes",
        user_need="Reach an accurate working pipeline quickly, even for reps updating deals from the field.",
        source_coverage="Survey + App Store",
    ),
)


DEMO_DATASET_PROFILES: dict[str, DemoDatasetProfile] = {
    "fitness_app": DemoDatasetProfile(
        dataset_id="fitness_app",
        summary_focus="retention risk is concentrated where reliability problems undermine an otherwise motivating product experience",
        strength_signal="Workout plans, coaching cues, and streak mechanics are already creating genuine habit value.",
        roadmap_narrative="The most credible near-term roadmap is reliability first, then premium value expansion.",
        themes=FITNESS_THEMES,
        roadmap_order=("device_sync_reliability", "offline_and_playback", "content_depth_and_progress", "subscription_value", "social_feed_focus"),
    ),
    "crm_tool": DemoDatasetProfile(
        dataset_id="crm_tool",
        summary_focus="the product is useful in daily selling motion, but ops and manager workflows still leak too much manual work",
        strength_signal="Integration setup, sequence analytics, and forecast UI are already strong proof points.",
        roadmap_narrative="The clearest story is to reduce admin drag before layering on deeper manager intelligence.",
        themes=CRM_THEMES,
        roadmap_order=("data_hygiene_at_scale", "pipeline_governance", "reporting_and_forecast_visibility", "onboarding_and_mobile_speed"),
    ),
    "productivity_tool": DemoDatasetProfile(
        dataset_id="productivity_tool",
        summary_focus="the product already helps teams plan work, but trust falls when notifications, mobile usage, and permission logic become noisy or fragile",
        strength_signal="Search, templates, and timeline planning show clear baseline product value.",
        roadmap_narrative="The strongest PM story is to make the core workflow calmer and more reliable before expanding configurability.",
        themes=PRODUCTIVITY_THEMES,
        roadmap_order=("notification_overload", "mobile_reliability", "dashboard_flexibility", "workflow_discoverability", "collaboration_controls"),
    ),
}


def get_demo_profile(dataset_id: str | None) -> DemoDatasetProfile | None:
    if dataset_id is None:
        return None
    return DEMO_DATASET_PROFILES.get(dataset_id)


def infer_demo_feedback_attributes(
    dataset_id: str | None,
    item: dict[str, Any],
) -> dict[str, Any]:
    profile = get_demo_profile(dataset_id)
    metadata = item.get("metadata_json", {})
    normalized_metadata = dict(metadata) if isinstance(metadata, dict) else {}
    topic = normalized_metadata.get("topic")
    rating = _coerce_number(item.get("rating"))
    theme = _find_theme_by_topic(profile, topic)

    if theme is None:
        category = "positive_feedback" if rating is not None and rating >= 4 else "unknown"
        sentiment = "positive" if rating is not None and rating >= 4 else "mixed" if rating == 3 else "negative" if rating is not None and rating <= 2 else "neutral"
        severity = "low" if sentiment == "positive" else "medium" if sentiment == "mixed" else "medium"
        churn_risk = bool(rating is not None and rating <= 2)
        return {
            "category": category,
            "sentiment": sentiment,
            "severity": severity,
            "churn_risk": churn_risk,
            "theme_key": normalized_metadata.get("theme_key"),
            "theme_name": normalized_metadata.get("theme_name"),
            "metadata_json": normalized_metadata,
        }

    sentiment = theme.default_sentiment
    if rating is not None:
        if rating >= 4:
            sentiment = "positive" if theme.category == "positive_feedback" else "mixed"
        elif rating == 3:
            sentiment = "mixed"
        elif rating <= 2:
            sentiment = "negative"

    severity = theme.default_severity
    if theme.category == "positive_feedback":
        severity = "low"
    elif rating is not None and rating <= 2 and theme.default_severity == "medium":
        severity = "high"

    churn_risk = bool(
        rating is not None
        and rating <= 2
        and theme.category
        in {
            "ux_issue",
            "performance_issue",
            "pricing_concern",
            "support_complaint",
            "onboarding_friction",
            "bug_report",
        }
    )

    normalized_metadata.update(
        {
            "theme_key": theme.key,
            "theme_name": theme.name,
            "persona_signal": theme.persona_signal,
            "product_area": theme.product_area,
            "dataset_id": dataset_id,
        }
    )
    return {
        "category": theme.category,
        "sentiment": sentiment,
        "severity": severity,
        "churn_risk": churn_risk,
        "theme_key": theme.key,
        "theme_name": theme.name,
        "metadata_json": normalized_metadata,
    }


def build_demo_dashboard_payload(
    *,
    dataset_id: str | None,
    analysis_run_id: str,
    analysis_goal: str,
    completed_at: str,
    product_name: str,
    product_description: str,
    sources: list[dict[str, Any]],
    feedback_items: list[dict[str, Any]],
) -> dict[str, Any]:
    profile = get_demo_profile(dataset_id) or DEMO_DATASET_PROFILES["productivity_tool"]
    normalized_items = [_normalize_feedback_item(profile.dataset_id, item) for item in feedback_items]
    total_feedback_count = len(normalized_items)
    source_mix = _build_source_mix(sources, total_feedback_count)
    theme_stats = _build_theme_stats(profile, normalized_items)
    top_themes = _build_top_themes(theme_stats, total_feedback_count)
    top_pain_points = _build_pain_points(theme_stats)
    feature_requests = _build_feature_requests(theme_stats)
    roadmap = _build_roadmap(profile, theme_stats)
    representative_quotes = _build_representative_quotes(theme_stats)
    sentiment_overall = _build_sentiment_breakdown(normalized_items)
    classification_summary = _build_classification_summary(normalized_items, total_feedback_count)
    positive_themes = [stat for stat in theme_stats if stat["dominant_sentiment"] == "positive"]
    high_priority_themes = [stat for stat in theme_stats if stat["priority"] == "High"]
    low_rating_count = sum(1 for item in normalized_items if _coerce_number(item.get("rating")) is not None and _coerce_number(item.get("rating")) <= 2)
    mapped_count = sum(1 for item in normalized_items if item.get("theme_key"))
    primary_theme = theme_stats[0] if theme_stats else None
    secondary_theme = theme_stats[1] if len(theme_stats) > 1 else None
    executive_summary = _build_executive_summary(
        product_name=product_name,
        analysis_goal=analysis_goal,
        profile=profile,
        primary_theme=primary_theme,
        secondary_theme=secondary_theme,
        positive_themes=positive_themes,
        roadmap=roadmap,
        total_feedback_count=total_feedback_count,
    )

    return _apply_goal_focus(
        {
        "analysisContext": {
            "analysisRunId": analysis_run_id,
            "productName": product_name,
            "productDescription": product_description,
            "goal": analysis_goal,
            "processingMethod": "Deterministic Demo Synthesis",
            "sourceCount": len(sources),
            "feedbackItemCount": total_feedback_count,
            "lastRunAt": completed_at,
        },
        "sourceMix": source_mix,
        "kpis": [
            {"label": "Feedback items analyzed", "value": str(total_feedback_count)},
            {"label": "Negative sentiment", "value": f"{sentiment_overall['negative']}%"},
            {"label": "High-priority themes", "value": str(len(high_priority_themes))},
            {"label": "Low-rating risk signals", "value": str(low_rating_count)},
            {"label": "Mapped product themes", "value": str(mapped_count)},
        ],
        "executiveSummary": executive_summary,
        "sentimentBreakdown": {
            "overall": [
                {"label": "Positive", "value": sentiment_overall["positive"]},
                {"label": "Neutral", "value": sentiment_overall["neutral"]},
                {"label": "Negative", "value": sentiment_overall["negative"]},
                {"label": "Mixed", "value": sentiment_overall["mixed"]},
            ],
            "bySource": [
                {
                    "sourceLabel": source["label"],
                    "negativePercent": _negative_percent_for_source(normalized_items, source["label"]),
                }
                for source in source_mix
            ],
        },
        "classificationSummary": classification_summary,
        "topThemes": top_themes,
        "painPoints": top_pain_points,
        "featureRequests": feature_requests,
        "roadmapRecommendations": roadmap,
        "representativeQuotes": representative_quotes,
        "modelSignals": [
            {
                "label": "Signal confidence",
                "value": f"High: {mapped_count}/{total_feedback_count} feedback items matched known demo themes",
            },
            {
                "label": "Highest-risk persona",
                "value": primary_theme["persona_signal"] if primary_theme else "Not enough data",
            },
            {
                "label": "Current strength",
                "value": profile.strength_signal,
            },
            {
                "label": "Roadmap lens",
                "value": profile.roadmap_narrative,
            },
        ],
        },
        analysis_goal,
    )


def find_theme_matches(dataset_id: str | None, question: str) -> list[ThemeDefinition]:
    profile = get_demo_profile(dataset_id)
    if profile is None:
        return []
    normalized_question = question.lower()
    matches: list[ThemeDefinition] = []
    for theme in profile.themes:
        tokens = {theme.name.lower(), *theme.aliases, *theme.topics}
        if any(token.lower() in normalized_question for token in tokens):
            matches.append(theme)
    return matches


def _find_theme_by_topic(
    profile: DemoDatasetProfile | None,
    topic: Any,
) -> ThemeDefinition | None:
    if profile is None or not isinstance(topic, str):
        return None
    for theme in profile.themes:
        if topic in theme.topics:
            return theme
    return None


def _normalize_feedback_item(dataset_id: str, item: dict[str, Any]) -> dict[str, Any]:
    inferred = infer_demo_feedback_attributes(dataset_id, item)
    normalized = dict(item)
    normalized.update(
        {
            "category": item.get("category") or inferred["category"],
            "sentiment": item.get("sentiment") or inferred["sentiment"],
            "severity": item.get("severity") or inferred["severity"],
            "churn_risk": item.get("churn_risk") if item.get("churn_risk") is not None else inferred["churn_risk"],
            "theme_key": inferred["theme_key"],
            "theme_name": inferred["theme_name"],
            "metadata_json": inferred["metadata_json"],
        }
    )
    return normalized


def _build_source_mix(
    sources: list[dict[str, Any]],
    total_feedback_count: int,
) -> list[dict[str, Any]]:
    unit_by_type = {
        "demo_dataset": "items",
        "csv_upload": "items",
        "pasted_text": "items",
        "x_search": "posts",
    }
    mix: list[dict[str, Any]] = []
    for source in sources:
        count = int(source.get("item_count", 0))
        mix.append(
            {
                "sourceId": str(source["id"]),
                "sourceType": str(source["source_type"]),
                "label": str(source["source_label"]),
                "count": count,
                "unit": unit_by_type.get(str(source["source_type"]), "items"),
                "percent": round((count / total_feedback_count) * 100) if total_feedback_count else 0,
            }
        )
    if mix:
        total_percent = sum(item["percent"] for item in mix)
        if total_percent != 100:
            mix[-1]["percent"] += 100 - total_percent
    return mix


def _build_theme_stats(
    profile: DemoDatasetProfile,
    items: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    fallback_theme = ThemeDefinition(
        key="general_feedback",
        name="General product feedback",
        description="A mix of smaller signals that are not yet concentrated into a single theme.",
        topics=(),
        aliases=("general",),
        category="unknown",
        default_sentiment="mixed",
        default_severity="low",
        priority="Low",
        persona_signal="Signal is broad rather than persona-specific.",
        product_area="General",
        impact="These comments are useful context but not the main roadmap driver in this run.",
        recommended_action="Track these items for recurrence as the dataset expands.",
        feature_request="Review general feedback for recurring patterns",
        user_need="Capture smaller moments of friction before they become major problems.",
        source_coverage="Long tail",
    )

    for item in items:
        theme_key = str(item.get("theme_key") or "general_feedback")
        theme = next((candidate for candidate in profile.themes if candidate.key == theme_key), fallback_theme)
        if theme_key not in grouped:
            grouped[theme_key] = {
                "theme": theme,
                "items": [],
                "channels": Counter(),
                "sentiments": Counter(),
                "categories": Counter(),
                "severity": Counter(),
            }
        bucket = grouped[theme_key]
        bucket["items"].append(item)
        metadata = item.get("metadata_json", {})
        if isinstance(metadata, dict) and isinstance(metadata.get("channel"), str):
            bucket["channels"][metadata["channel"]] += 1
        if item.get("sentiment"):
            bucket["sentiments"][str(item["sentiment"])] += 1
        if item.get("category"):
            bucket["categories"][str(item["category"])] += 1
        if item.get("severity"):
            bucket["severity"][str(item["severity"])] += 1

    results: list[dict[str, Any]] = []
    for key, bucket in grouped.items():
        items_for_theme = bucket["items"]
        dominant_sentiment = bucket["sentiments"].most_common(1)[0][0] if bucket["sentiments"] else bucket["theme"].default_sentiment
        severity_label = _dominant_severity(bucket["severity"], bucket["theme"].default_severity)
        channels = " + ".join(_humanize_channel(name) for name, _count in bucket["channels"].most_common(3)) or bucket["theme"].source_coverage
        results.append(
            {
                "key": key,
                "name": bucket["theme"].name,
                "description": bucket["theme"].description,
                "count": len(items_for_theme),
                "priority": bucket["theme"].priority,
                "persona_signal": bucket["theme"].persona_signal,
                "product_area": bucket["theme"].product_area,
                "impact": bucket["theme"].impact,
                "recommended_action": bucket["theme"].recommended_action,
                "feature_request": bucket["theme"].feature_request,
                "user_need": bucket["theme"].user_need,
                "category": bucket["categories"].most_common(1)[0][0] if bucket["categories"] else bucket["theme"].category,
                "dominant_sentiment": dominant_sentiment,
                "severity_label": severity_label,
                "source_coverage": channels,
                "items": items_for_theme,
            }
        )

    priority_rank = {"High": 0, "Medium": 1, "Low": 2}
    severity_rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    results.sort(
        key=lambda entry: (
            priority_rank.get(entry["priority"], 9),
            severity_rank.get(entry["severity_label"], 9),
            -entry["count"],
        )
    )
    return results


def _build_top_themes(
    theme_stats: list[dict[str, Any]],
    total_feedback_count: int,
) -> list[dict[str, Any]]:
    themes: list[dict[str, Any]] = []
    for index, stat in enumerate(theme_stats[:5], start=1):
        themes.append(
            {
                "id": stat["key"],
                "rank": index,
                "name": stat["name"],
                "description": stat["description"],
                "count": stat["count"],
                "percent": round((stat["count"] / total_feedback_count) * 100) if total_feedback_count else 0,
                "sentiment": _format_sentiment_label(stat["dominant_sentiment"]),
                "priority": stat["priority"],
                "sourceCoverage": stat["source_coverage"],
            }
        )
    return themes


def _build_pain_points(theme_stats: list[dict[str, Any]]) -> list[dict[str, Any]]:
    pain_points: list[dict[str, Any]] = []
    for stat in [entry for entry in theme_stats if entry["category"] != "positive_feedback"][:3]:
        pain_points.append(
            {
                "title": stat["name"],
                "summary": stat["description"],
                "evidenceCount": stat["count"],
                "impact": stat["impact"],
                "recommendedAction": stat["recommended_action"],
                "representativeQuotes": [
                    {
                        "text": str(item["raw_text"]),
                        "sourceLabel": str(item["source_label"]),
                    }
                    for item in stat["items"][:2]
                ],
            }
        )
    return pain_points


def _build_feature_requests(theme_stats: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ranked = sorted(
        [stat for stat in theme_stats if stat["feature_request"]],
        key=lambda stat: (0 if stat["priority"] == "High" else 1, -stat["count"]),
    )
    return [
        {
            "request": stat["feature_request"],
            "userNeed": stat["user_need"],
            "supportingEvidence": stat["source_coverage"],
            "priority": stat["priority"],
        }
        for stat in ranked[:4]
    ]


def _build_roadmap(
    profile: DemoDatasetProfile,
    theme_stats: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    stat_by_key = {stat["key"]: stat for stat in theme_stats}
    ordered = [stat_by_key[key] for key in profile.roadmap_order if key in stat_by_key]
    if not ordered:
        ordered = theme_stats[:3]

    phases = {
        "Now": ordered[:2],
        "Next": ordered[2:4],
        "Later": ordered[4:5],
    }
    results: list[dict[str, Any]] = []
    for phase, stats in phases.items():
        if not stats:
            continue
        results.append(
            {
                "phase": phase,
                "items": [
                    {
                        "title": stat["feature_request"],
                        "rationale": f"{stat['name']} appears in {stat['count']} items and matters most for {stat['persona_signal'].lower()}",
                    }
                    for stat in stats
                ],
            }
        )
    return results


def _build_representative_quotes(theme_stats: list[dict[str, Any]]) -> list[dict[str, Any]]:
    quotes: list[dict[str, Any]] = []
    for stat in theme_stats[:4]:
        for item in stat["items"][:1]:
            quotes.append(
                {
                    "text": str(item["raw_text"]),
                    "sourceLabel": str(item["source_label"]),
                    "themeName": stat["name"],
                    "category": stat["category"],
                }
            )
    return quotes


def _build_sentiment_breakdown(items: list[dict[str, Any]]) -> dict[str, int]:
    total = len(items)
    if total == 0:
        return {"positive": 0, "neutral": 0, "negative": 0, "mixed": 0}
    counts = Counter(str(item.get("sentiment") or "neutral") for item in items)
    percents = {
        label: round((counts[label] / total) * 100)
        for label in ("positive", "neutral", "negative", "mixed")
    }
    delta = 100 - sum(percents.values())
    if delta != 0:
        largest = max(percents, key=lambda label: percents[label])
        percents[largest] += delta
    return percents


def _negative_percent_for_source(items: list[dict[str, Any]], source_label: str) -> int:
    scoped = [item for item in items if str(item.get("source_label")) == source_label]
    if not scoped:
        return 0
    negative_count = sum(1 for item in scoped if str(item.get("sentiment")) == "negative")
    return round((negative_count / len(scoped)) * 100)


def _build_classification_summary(
    items: list[dict[str, Any]],
    total_feedback_count: int,
) -> list[dict[str, Any]]:
    counts = Counter(str(item.get("category") or "unknown") for item in items)
    return [
        {
            "category": category,
            "count": count,
            "percent": round((count / total_feedback_count) * 100) if total_feedback_count else 0,
        }
        for category, count in counts.most_common(4)
    ]


def _build_executive_summary(
    *,
    product_name: str,
    analysis_goal: str,
    profile: DemoDatasetProfile,
    primary_theme: dict[str, Any] | None,
    secondary_theme: dict[str, Any] | None,
    positive_themes: list[dict[str, Any]],
    roadmap: list[dict[str, Any]],
    total_feedback_count: int,
) -> str:
    strength = positive_themes[0]["name"].lower() if positive_themes else profile.strength_signal
    top_phase = roadmap[0]["items"][0]["title"] if roadmap and roadmap[0]["items"] else "stabilize the highest-friction workflow"
    if primary_theme is None:
        return (
            f"{product_name} has {total_feedback_count} demo feedback items, but the signal is still diffuse. "
            f"The strongest portfolio-quality takeaway is that {profile.summary_focus}. "
            f"Given the current goal of {analysis_goal.lower()}, the next product step is to {top_phase.lower()}."
        )

    secondary_clause = (
        f" Secondary friction shows up in {secondary_theme['name'].lower()}."
        if secondary_theme is not None
        else ""
    )
    return (
        f"{product_name} feedback suggests that {profile.summary_focus}. "
        f"The most concentrated theme is {primary_theme['name'].lower()}, which appears in {primary_theme['count']} of {total_feedback_count} items and carries {primary_theme['priority'].lower()} priority.{secondary_clause} "
        f"Users still call out real strengths around {strength}. "
        f"For {analysis_goal.lower()}, the clearest recommendation is to {top_phase.lower()} while preserving the product value already visible in {profile.strength_signal.lower()}."
    )


def _apply_goal_focus(
    payload: dict[str, Any],
    analysis_goal: str,
) -> dict[str, Any]:
    if analysis_goal == "Full Product Feedback Synthesis":
        return payload

    visible = GOAL_SECTION_MAP.get(
        analysis_goal,
        GOAL_SECTION_MAP["Full Product Feedback Synthesis"],
    )
    focused = dict(payload)
    if "sentimentBreakdown" not in visible:
        focused["sentimentBreakdown"] = {"overall": [], "bySource": []}
    if "classificationSummary" not in visible:
        focused["classificationSummary"] = []
    if "topThemes" not in visible:
        focused["topThemes"] = []
    if "painPoints" not in visible:
        focused["painPoints"] = []
    if "featureRequests" not in visible:
        focused["featureRequests"] = []
    if "roadmapRecommendations" not in visible:
        focused["roadmapRecommendations"] = []
    if "representativeQuotes" not in visible:
        focused["representativeQuotes"] = []
    if "modelSignals" not in visible:
        focused["modelSignals"] = []
    return focused


def _dominant_severity(counts: Counter[str], default: str) -> str:
    if not counts:
        return default
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    return min(counts, key=lambda label: (order.get(label, 9), -counts[label]))


def _format_sentiment_label(value: str) -> str:
    mapping = {
        "positive": "Mostly positive",
        "negative": "Mostly negative",
        "mixed": "Mixed",
        "neutral": "Neutral",
    }
    return mapping.get(value, "Mixed")


def _coerce_number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _humanize_channel(value: str) -> str:
    return value.replace("_", " ").title()

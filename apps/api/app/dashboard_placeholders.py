from typing import Any


PLACEHOLDER_DASHBOARD_COPY: dict[str, dict[str, Any]] = {
    "fitness_app": {
        "summary": "Early demo feedback points to strong workout content but recurring friction around device sync, tracking accuracy, and subscription value.",
        "themes": [
            ("theme_device_sync", "Device sync reliability", "Users report inconsistent wearable sync and intermittent disconnects."),
            ("theme_content_depth", "Content depth requests", "Users want more variety for beginners and short-session workouts."),
            ("theme_subscription_value", "Subscription value concerns", "Price sensitivity rises when live or premium features are unreliable."),
        ],
        "feature_request": "More beginner-friendly short strength sessions",
        "roadmap": "Improve wearable sync reliability and add more short-form beginner content.",
        "signal": "Device sync and workout content are the strongest placeholder themes.",
    },
    "crm_tool": {
        "summary": "The CRM demo dataset highlights solid integration value, but reporting gaps, permissions confusion, and bulk-edit friction remain the main workflow blockers.",
        "themes": [
            ("theme_bulk_editing", "Bulk editing friction", "Sales ops teams struggle with slower cleanup and import workflows."),
            ("theme_reporting", "Reporting depth requests", "Managers want clearer rep and forecast comparisons."),
            ("theme_permissions", "Permissions confusion", "Visibility and edit-access settings are still hard to reason about."),
        ],
        "feature_request": "Stage-based required fields and stronger stale-deal alerts",
        "roadmap": "Improve reporting depth and simplify permissions for managers.",
        "signal": "Reporting and permissions issues dominate the placeholder CRM view.",
    },
    "productivity_tool": {
        "summary": "The productivity demo dataset shows clear product value, but notification overload, dashboard rigidity, and mobile performance issues remain the dominant sources of friction.",
        "themes": [
            ("theme_notifications", "Notification overload", "Users feel overwhelmed by low-signal updates and want better defaults."),
            ("theme_dashboards", "Dashboard customization", "Teams want more flexibility over layout and widgets."),
            ("theme_mobile", "Mobile reliability", "Slower loading and offline edge cases hurt trust on the go."),
        ],
        "feature_request": "Quieter notification defaults and customizable dashboards",
        "roadmap": "Reduce alert fatigue first, then improve dashboard flexibility.",
        "signal": "Notifications and dashboard customization are the strongest placeholder themes.",
    },
}

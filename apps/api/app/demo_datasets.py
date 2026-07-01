from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class DemoDatasetDefinition:
    id: str
    label: str
    description: str
    real_app_name: str
    csv_path: Path


REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_DATA_DIR = REPO_ROOT / "data" / "demo"


DEMO_DATASETS: dict[str, DemoDatasetDefinition] = {
    "fitness_app": DemoDatasetDefinition(
        id="fitness_app",
        label="Fitness App",
        description="Workout tracking, subscriptions, and device sync feedback.",
        real_app_name="Strava",
        csv_path=DEMO_DATA_DIR / "reviews_strava_google_play_reviews.csv",
    ),
    "crm_tool": DemoDatasetDefinition(
        id="crm_tool",
        label="CRM Tool",
        description="Pipeline, reporting, and integration feedback from sales teams.",
        real_app_name="HubSpot",
        csv_path=DEMO_DATA_DIR / "reviews_hubspot_google_play_reviews.csv",
    ),
    "productivity_tool": DemoDatasetDefinition(
        id="productivity_tool",
        label="Productivity Tool",
        description="Tasks, notifications, and collaboration feedback from teams.",
        real_app_name="Notion",
        csv_path=DEMO_DATA_DIR / "reviews_notion_google_play_reviews.csv",
    ),
}

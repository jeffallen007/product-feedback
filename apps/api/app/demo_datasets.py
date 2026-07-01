from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class DemoDatasetDefinition:
    id: str
    label: str
    description: str
    real_app_name: str
    csv_path: Path


APP_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = APP_DIR.parent
DEMO_DATA_DIR = BACKEND_ROOT / "data" / "demo"


DEMO_DATASETS: dict[str, DemoDatasetDefinition] = {
    "fitness_app": DemoDatasetDefinition(
        id="fitness_app",
        label="Fitness App (Strava)",
        description="A consumer fitness app for tracking running, cycling, hiking, and other types of workouts.",
        real_app_name="Strava",
        csv_path=DEMO_DATA_DIR / "reviews_strava_google_play_reviews.csv",
    ),
    "crm_tool": DemoDatasetDefinition(
        id="crm_tool",
        label="CRM Tool (HubSpot)",
        description="A B2B CRM tool with AI capabilities for sales and marketing teams.",
        real_app_name="HubSpot",
        csv_path=DEMO_DATA_DIR / "reviews_hubspot_google_play_reviews.csv",
    ),
    "productivity_tool": DemoDatasetDefinition(
        id="productivity_tool",
        label="Productivity Tool (Notion)",
        description="An all-in-one digital workspace that combines note-taking, project management, and more.",
        real_app_name="Notion",
        csv_path=DEMO_DATA_DIR / "reviews_notion_google_play_reviews.csv",
    ),
}

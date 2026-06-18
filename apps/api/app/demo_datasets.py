from dataclasses import dataclass

from app.demo_feedback import DEMO_FEEDBACK_FIXTURES


@dataclass(frozen=True)
class DemoDatasetDefinition:
    id: str
    label: str
    description: str


DEMO_DATASETS: dict[str, DemoDatasetDefinition] = {
    "fitness_app": DemoDatasetDefinition(
        id="fitness_app",
        label="Fitness App",
        description="Workout tracking, subscriptions, and device sync feedback.",
    ),
    "crm_tool": DemoDatasetDefinition(
        id="crm_tool",
        label="CRM Tool",
        description="Pipeline, reporting, and integration feedback from sales teams.",
    ),
    "productivity_tool": DemoDatasetDefinition(
        id="productivity_tool",
        label="Productivity Tool",
        description="Tasks, notifications, and collaboration feedback from teams.",
    ),
}


for dataset_id, dataset in DEMO_DATASETS.items():
    if dataset_id not in DEMO_FEEDBACK_FIXTURES:
        raise ValueError(f"Missing demo feedback fixtures for '{dataset_id}'.")

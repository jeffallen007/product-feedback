from dataclasses import dataclass


@dataclass(frozen=True)
class DemoDatasetDefinition:
    id: str
    label: str
    description: str
    item_count: int


DEMO_DATASETS: dict[str, DemoDatasetDefinition] = {
    "fitness_app": DemoDatasetDefinition(
        id="fitness_app",
        label="Fitness App",
        description="Workout tracking, subscriptions, and device sync feedback.",
        item_count=356,
    ),
    "crm_tool": DemoDatasetDefinition(
        id="crm_tool",
        label="CRM Tool",
        description="Pipeline, reporting, and integration feedback from sales teams.",
        item_count=514,
    ),
    "productivity_tool": DemoDatasetDefinition(
        id="productivity_tool",
        label="Productivity Tool",
        description="Tasks, notifications, and collaboration feedback from teams.",
        item_count=482,
    ),
}

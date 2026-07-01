import { Activity, CheckSquare, Users } from "lucide-react"
import type { DemoProductOption } from "@/lib/types/workflow"

export const DEMO_PRODUCTS: DemoProductOption[] = [
  {
    id: "fitness",
    label: "Fitness App (Strava)",
    description:
      "A consumer fitness app for tracking running, cycling, hiking, and other types of workouts.",
    count: 750,
    icon: Activity,
  },
  {
    id: "crm",
    label: "CRM Tool (HubSpot)",
    description:
      "A B2B CRM tool with AI capabilities for sales and marketing teams.",
    count: 750,
    icon: Users,
  },
  {
    id: "productivity",
    label: "Productivity Tool (Notion)",
    description:
      "An all-in-one digital workspace that combines note-taking, project management, and more.",
    count: 750,
    icon: CheckSquare,
  },
]

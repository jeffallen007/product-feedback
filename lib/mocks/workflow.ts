import { Activity, CheckSquare, Users } from "lucide-react"
import type { DemoProductOption } from "@/lib/types/workflow"

export const DEMO_PRODUCTS: DemoProductOption[] = [
  {
    id: "fitness",
    label: "Fitness App",
    description:
      "A consumer fitness app for workout tracking, subscriptions, and device sync.",
    count: 356,
    icon: Activity,
  },
  {
    id: "crm",
    label: "CRM Tool",
    description:
      "A B2B CRM for pipeline management, reporting, and integrations used by sales teams.",
    count: 514,
    icon: Users,
  },
  {
    id: "productivity",
    label: "Productivity Tool",
    description:
      "Tasks, notifications, and collaboration feedback from teams.",
    count: 482,
    icon: CheckSquare,
  },
]

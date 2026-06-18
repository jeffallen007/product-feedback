import {
  Activity,
  CheckSquare,
  ClipboardList,
  Search,
  Upload,
  Users,
} from "lucide-react"
import type {
  DemoProductOption,
  SourceDefinition,
} from "@/lib/types/workflow"

export const SOURCE_DEFINITIONS: SourceDefinition[] = [
  {
    id: "csv",
    title: "Upload CSV",
    description:
      "Upload customer reviews, support tickets, survey responses, or product feedback.",
    icon: Upload,
    sourceType: "csv_upload",
  },
  {
    id: "paste",
    title: "Paste Feedback",
    description:
      "Paste reviews, comments, interview notes, or survey responses.",
    icon: ClipboardList,
    sourceType: "pasted_text",
  },
  {
    id: "search",
    title: "Search X",
    description:
      "Pull recent public posts mentioning a product, company, handle, or keyword.",
    icon: Search,
    sourceType: "x_search",
  },
]

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

export const SEARCH_CHIPS = [
  "@asana",
  "Peloton app",
  "Zoho CRM support",
  "Monday.com dashboard",
  "Strava subscription",
] as const

export const CAPABILITIES = [
  "Top pain points",
  "Feature requests",
  "Sentiment overview",
  "Roadmap priorities",
  "Churn / retention risks",
  "Representative quotes",
  "Follow-up chatbot analysis",
] as const

export const ARCHITECTURE_STEPS = [
  "Input Sources",
  "MCP Tools",
  "ML Classification",
  "LLM Synthesis",
  "Dashboard",
  "Chat Follow-up",
] as const

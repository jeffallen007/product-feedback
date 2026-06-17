import {
  Upload,
  ClipboardList,
  Search,
  Activity,
  Users,
  CheckSquare,
  type LucideIcon,
} from "lucide-react"

export type SourceId = "csv" | "paste" | "search"

export type SourceDefinition = {
  id: SourceId
  title: string
  description: string
  icon: LucideIcon
}

export const SOURCE_DEFINITIONS: SourceDefinition[] = [
  {
    id: "csv",
    title: "Upload CSV",
    description:
      "Upload customer reviews, support tickets, survey responses, or product feedback.",
    icon: Upload,
  },
  {
    id: "paste",
    title: "Paste Feedback",
    description:
      "Paste reviews, comments, interview notes, or survey responses.",
    icon: ClipboardList,
  },
  {
    id: "search",
    title: "Search X",
    description:
      "Pull recent public posts mentioning a product, company, handle, or keyword.",
    icon: Search,
  },
]

export type ProductContext = {
  name: string
  description: string
}

export type DemoProduct = {
  id: string
  label: string
  description: string
  count: number
  icon: LucideIcon
}

export const DEMO_PRODUCTS: DemoProduct[] = [
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
]

export const ANALYSIS_GOALS = [
  "Full Product Feedback Synthesis",
  "Identify Top Pain Points",
  "Find Feature Requests",
  "Prioritize Roadmap Opportunities",
  "Summarize Sentiment",
  "Identify Churn / Retention Risks",
]

export type ConfiguredSource = {
  id: string
  type: "Demo Dataset" | "X Search" | "Pasted Feedback" | "CSV Upload"
  label: string
  count: number
  status: "Ready" | "Processing"
}

export const CAPABILITIES = [
  "Top pain points",
  "Feature requests",
  "Sentiment overview",
  "Roadmap priorities",
  "Churn / retention risks",
  "Representative quotes",
  "Follow-up chatbot analysis",
]

export const ARCHITECTURE_STEPS = [
  "Input Sources",
  "MCP Tools",
  "ML Classification",
  "LLM Synthesis",
  "Dashboard",
  "Chat Follow-up",
]

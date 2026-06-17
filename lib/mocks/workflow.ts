import {
  Activity,
  CheckSquare,
  ClipboardList,
  Search,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react"
import type {
  AnalysisGoal,
  AnalysisTarget,
  DataSource,
  SourceType,
} from "@/lib/types/contracts"

export type WorkflowSourceId = "csv" | "paste" | "search"
export type DemoProductId = "fitness" | "crm" | "productivity"
export type SourceTag =
  | "Demo Dataset"
  | "X Search"
  | "Pasted Feedback"
  | "CSV Upload"
export type ReviewSourceStatus = "Ready" | "Processing"

export type ProductContext = Pick<AnalysisTarget, "name" | "description">

export interface SourceDefinition {
  id: WorkflowSourceId
  title: string
  description: string
  icon: LucideIcon
  sourceType: SourceType
}

export interface DemoProductOption {
  id: DemoProductId
  label: string
  description: string
  count: number
  icon: LucideIcon
}

export interface ConfiguredSource
  extends Pick<DataSource, "id" | "sourceType" | "sourceLabel" | "itemCount"> {
  sourceTag: SourceTag
  status: ReviewSourceStatus
}

export const EMPTY_PRODUCT_CONTEXT: ProductContext = {
  name: "",
  description: "",
}

export const ANALYSIS_GOALS: AnalysisGoal[] = [
  "Full Product Feedback Synthesis",
  "Identify Top Pain Points",
  "Find Feature Requests",
  "Prioritize Roadmap Opportunities",
  "Summarize Sentiment",
  "Identify Churn / Retention Risks",
  "Generate Product Strategy Recommendations",
]

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

export const SOURCE_TAG_BY_TYPE: Record<SourceType, SourceTag> = {
  demo_dataset: "Demo Dataset",
  csv_upload: "CSV Upload",
  pasted_text: "Pasted Feedback",
  x_search: "X Search",
}

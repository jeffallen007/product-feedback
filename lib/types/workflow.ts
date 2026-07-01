import type { LucideIcon } from "lucide-react"
import type {
  AnalysisGoal,
  AnalysisTarget,
  DataSource,
  SourceType,
} from "@/lib/types/contracts"

export type WorkflowSourceId = "csv" | "paste" | "search"
export type DemoProductId = "fitness" | "crm" | "productivity"

export type SourceTag =
  | "Google Play"
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
  mockConfig?: {
    demoProductId?: DemoProductId
    xQuery?: string
  }
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

export const SOURCE_TAG_BY_TYPE: Record<SourceType, SourceTag> = {
  review: "Google Play",
  demo_dataset: "Demo Dataset",
  csv_upload: "CSV Upload",
  pasted_text: "Pasted Feedback",
  x_search: "X Search",
}

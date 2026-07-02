import type {
  AnalysisGoal,
  AnalysisRun,
  AnalysisTarget,
  ChatResponse,
  ChatScope,
  DashboardPayload,
  DataSource,
  FeedbackSet,
} from "@/lib/types/contracts"
import type {
  ConfiguredSource,
  DemoProductId,
  ProductContext,
  WorkflowSourceId,
} from "@/lib/types/workflow"

export type AnalysisDataMode = "mock" | "backend"

export interface AnalysisBundleMeta {
  dataMode: AnalysisDataMode
  analysisRunId?: string
  feedbackSetId?: string
}

export interface CreateFeedbackSetRequest {
  analysisTarget: Pick<AnalysisTarget, "name" | "description">
  analysisGoal: AnalysisGoal
  name?: string | null
}

export interface CreateFeedbackSetResponse {
  analysisTarget: AnalysisTarget
  feedbackSet: FeedbackSet
}

export interface AddDemoSourceRequest {
  feedbackSetId: string
  demoProductId: DemoProductId
}

export interface AddDemoSourceResponse {
  source: DataSource
}

export interface AddCsvSourceRequest {
  feedbackSetId: string
  file?: File
  sourceLabel?: string
  fileName?: string
  itemCount?: number
}

export interface AddCsvSourceResponse {
  source: DataSource
}

export interface AddPastedSourceRequest {
  feedbackSetId: string
  sourceLabel?: string
  pastedText?: string
  itemCount?: number
}

export interface AddPastedSourceResponse {
  source: DataSource
}

export interface AddXSourceRequest {
  feedbackSetId: string
  sourceLabel?: string
  query: string
  itemCount?: number
}

export interface AddXSourceResponse {
  source: DataSource
}

export interface SynthesizeFeedbackSetRequest {
  feedbackSetId: string
}

export interface SynthesizeFeedbackSetResponse {
  analysisRun: AnalysisRun
}

export interface GetAnalysisRunRequest {
  analysisRunId: string
}

export interface GetAnalysisRunResponse {
  analysisRun: AnalysisRun
  dashboard: DashboardPayload
  meta?: AnalysisBundleMeta
}

export interface PersistedChatMessage {
  id: string
  analysisRunId: string
  role: "user" | "assistant"
  question: string | null
  answer: string | null
  scope: ChatScope
  evidence: ChatResponse["evidence"]
  followUpSuggestions: string[]
  createdAt: string | null
}

export interface GetAnalysisRunBundleRequest {
  analysisRunId: string
}

export interface GetAnalysisRunBundleResponse {
  analysisRun: AnalysisRun
  feedbackSet: FeedbackSet
  analysisTarget: AnalysisTarget
  sources: DataSource[]
  dashboard: DashboardPayload | null
  chatHistory: PersistedChatMessage[]
  placeholderMessage?: string | null
  meta: AnalysisBundleMeta
}

export interface AskAnalysisQuestionRequest {
  analysisRunId: string
  question: string
  scope: ChatScope
}

export interface AskAnalysisQuestionResponse extends ChatResponse {}

export interface RunDemoAnalysisRequest {
  demoProductId: DemoProductId
  analysisTarget: Pick<AnalysisTarget, "name" | "description">
  analysisGoal: AnalysisGoal
}

export interface RunDemoAnalysisResponse {
  analysisRun: AnalysisRun
  bundle: GetAnalysisRunBundleResponse
  meta: AnalysisBundleMeta
}

export interface BuildDemoReviewStateRequest {
  demoProductId: DemoProductId
}

export interface BuildDemoReviewStateResponse {
  product: ProductContext
  sources: ConfiguredSource[]
}

export interface BuildCustomReviewStateRequest {
  product: ProductContext
  selectedSourceIds: WorkflowSourceId[]
  searchQuery: string
  pastedText?: string
  csvFileName?: string
  csvItemCount?: number
  existingSources?: ConfiguredSource[]
}

export interface BuildCustomReviewStateResponse {
  product: ProductContext
  sources: ConfiguredSource[]
}

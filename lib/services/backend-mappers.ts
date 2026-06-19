import type {
  AnalysisRun,
  AnalysisTarget,
  ChatScope,
  DashboardPayload,
  DataSource,
  FeedbackCategory,
  FeedbackSet,
  SourceType,
} from "@/lib/types/contracts"
import type {
  GetAnalysisRunBundleResponse,
  PersistedChatMessage,
} from "@/lib/types/api"

type BackendChatEvidenceItem = {
  feedbackItemId: string
  text: string
  sourceLabel: string
  themeName?: string | null
  category?: string | null
}

type BackendChatMessage = {
  id: string
  analysisRunId: string
  role: "user" | "assistant"
  question: string | null
  answer: string | null
  scope: ChatScope
  evidence: BackendChatEvidenceItem[]
  followUpSuggestions: string[]
  createdAt: string | null
}

type BackendBundleResponse = {
  analysisRun: {
    id: string
    feedbackSetId: string
    status: AnalysisRun["status"]
    currentStep: string | null
    steps: AnalysisRun["steps"]
    startedAt: string | null
    completedAt: string | null
    errorMessage: string | null
    metadata: Record<string, unknown>
  }
  feedbackSet: {
    id: string
    analysisTargetId: string
    name: string | null
    analysisGoal: FeedbackSet["analysisGoal"]
    status: FeedbackSet["status"]
    totalFeedbackCount: number
    createdAt: string
    updatedAt: string
  }
  analysisTarget: AnalysisTarget
  sources: Array<{
    id: string
    feedbackSetId: string
    sourceType: SourceType
    sourceLabel: string
    itemCount: number
    status: DataSource["status"]
    metadata: Record<string, unknown>
    createdAt: string
  }>
  dashboard: DashboardPayload | null
  chatHistory: BackendChatMessage[]
  placeholderMessage?: string | null
}

function mapChatMessage(message: BackendChatMessage): PersistedChatMessage {
  return {
    id: message.id,
    analysisRunId: message.analysisRunId,
    role: message.role,
    question: message.question,
    answer: message.answer,
    scope: message.scope,
    evidence: message.evidence.map((item) => ({
      feedbackItemId: item.feedbackItemId,
      text: item.text,
      sourceLabel: item.sourceLabel,
      themeName: item.themeName ?? null,
      category: (item.category as FeedbackCategory | null | undefined) ?? null,
    })),
    followUpSuggestions: message.followUpSuggestions,
    createdAt: message.createdAt,
  }
}

export function mapBackendBundleResponse(
  input: BackendBundleResponse,
): GetAnalysisRunBundleResponse {
  const metadata = input.analysisRun.metadata
  const totalFeedbackCount =
    typeof metadata.total_feedback_count === "number"
      ? metadata.total_feedback_count
      : input.feedbackSet.totalFeedbackCount
  const sourceCount =
    typeof metadata.source_count === "number"
      ? metadata.source_count
      : input.sources.length

  return {
    analysisRun: {
      ...input.analysisRun,
      metadata: {
        ...metadata,
        feedbackItemCount: totalFeedbackCount,
        sourceCount,
      },
    },
    feedbackSet: input.feedbackSet,
    analysisTarget: input.analysisTarget,
    sources: input.sources,
    dashboard: input.dashboard,
    chatHistory: input.chatHistory.map(mapChatMessage),
    placeholderMessage: input.placeholderMessage ?? null,
    meta: {
      dataMode: "backend",
      analysisRunId: input.analysisRun.id,
      feedbackSetId: input.feedbackSet.id,
    },
  }
}

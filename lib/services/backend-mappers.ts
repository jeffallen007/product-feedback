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

function toSourceTagLabel(sourceType: SourceType): string {
  switch (sourceType) {
    case "demo_dataset":
      return "Demo Dataset"
    case "csv_upload":
      return "CSV Upload"
    case "pasted_text":
      return "Pasted Feedback"
    case "x_search":
      return "X Search"
  }
}

function formatTimestamp(value: string | null): string | null {
  if (!value) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString()
}

function normalizeDashboardPayload(
  dashboard: DashboardPayload | null,
): DashboardPayload | null {
  if (!dashboard) {
    return null
  }

  return {
    ...dashboard,
    analysisContext: {
      ...dashboard.analysisContext,
      lastRunAt: formatTimestamp(dashboard.analysisContext.lastRunAt) ?? dashboard.analysisContext.lastRunAt,
    },
    sourceMix: dashboard.sourceMix.map((source) => ({
      ...source,
      label: toSourceTagLabel(source.sourceType),
    })),
    sentimentBreakdown: {
      ...dashboard.sentimentBreakdown,
      bySource: dashboard.sentimentBreakdown.bySource.map((item) => ({
        ...item,
        sourceLabel: item.sourceLabel.includes("Demo Dataset")
          ? "Demo Dataset"
          : item.sourceLabel,
      })),
    },
    painPoints: dashboard.painPoints.map((painPoint) => ({
      ...painPoint,
      representativeQuotes: painPoint.representativeQuotes.map((quote) => ({
        ...quote,
        sourceLabel: quote.sourceLabel.includes("Demo Dataset")
          ? "Demo Dataset"
          : quote.sourceLabel,
      })),
    })),
    representativeQuotes: dashboard.representativeQuotes.map((quote) => ({
      ...quote,
      sourceLabel: quote.sourceLabel.includes("Demo Dataset")
        ? "Demo Dataset"
        : quote.sourceLabel,
    })),
  }
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
  const dashboard = normalizeDashboardPayload(input.dashboard)
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
    dashboard,
    chatHistory: input.chatHistory.map(mapChatMessage),
    placeholderMessage: input.placeholderMessage ?? null,
  }
}

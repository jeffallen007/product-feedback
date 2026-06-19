import { MOCK_DASHBOARD_PAYLOAD, type ChatMessage } from "@/lib/mocks/dashboard"
import type { GetAnalysisRunBundleResponse } from "@/lib/types/api"
import type {
  AnalysisRunStatus,
  DashboardKpi,
  DashboardPayload,
  DashboardSourceMixItem,
  FeedbackSetStatus,
  SentimentBySourceItem,
  SourceType,
} from "@/lib/types/contracts"
import { SOURCE_TAG_BY_TYPE, type SourceTag } from "@/lib/types/workflow"

const FALLBACK_PROCESSING_METHOD =
  "Backend Demo Bundle + Placeholder Dashboard Synthesis"

const SOURCE_UNIT_BY_TYPE: Record<SourceType, string> = {
  demo_dataset: "items",
  csv_upload: "items",
  pasted_text: "items",
  x_search: "posts",
}

const SOURCE_NEGATIVE_PERCENT_BY_TYPE: Record<SourceType, number> = {
  demo_dataset: 31,
  csv_upload: 36,
  pasted_text: 42,
  x_search: 54,
}

export interface BackendDashboardViewModel {
  dataMode: "backend"
  analysisRunId: string
  feedbackSetId: string
  feedbackSetName: string | null
  feedbackSetStatus: FeedbackSetStatus
  analysisTargetName: string
  analysisTargetDescription: string
  analysisGoal: DashboardPayload["analysisContext"]["goal"]
  runStatus: AnalysisRunStatus
  runTimestamp: string
  sourceCount: number
  totalFeedbackCount: number
  sourceTags: SourceTag[]
  sourceLabels: string[]
  processingMethod: string
  dashboard: DashboardPayload
  chatHistory: ChatMessage[]
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not available"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString()
}

function toTitleCase(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function coerceString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function nonEmptyArray<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0
}

function mapChatHistory(
  bundle: GetAnalysisRunBundleResponse,
): BackendDashboardViewModel["chatHistory"] {
  return bundle.chatHistory.map((message) =>
    message.role === "user"
      ? {
          role: "user",
          content: message.question ?? "",
          scope:
            message.scope === "all"
              ? "All Sources"
              : SOURCE_TAG_BY_TYPE[message.scope],
        }
      : {
          role: "assistant",
          content: message.answer ?? "",
          followUps: message.followUpSuggestions,
        },
  )
}

function deriveTotalFeedbackCount(bundle: GetAnalysisRunBundleResponse): number {
  const countFromMetadata = bundle.analysisRun.metadata.feedbackItemCount
  if (typeof countFromMetadata === "number" && countFromMetadata > 0) {
    return countFromMetadata
  }

  if (bundle.feedbackSet.totalFeedbackCount > 0) {
    return bundle.feedbackSet.totalFeedbackCount
  }

  return bundle.sources.reduce((sum, source) => sum + source.itemCount, 0)
}

function deriveSourceMix(
  bundle: GetAnalysisRunBundleResponse,
  totalFeedbackCount: number,
): DashboardSourceMixItem[] {
  if (bundle.sources.length === 0) {
    return MOCK_DASHBOARD_PAYLOAD.sourceMix
  }

  return bundle.sources.map((source) => {
    const percent =
      totalFeedbackCount > 0
        ? Math.max(1, Math.round((source.itemCount / totalFeedbackCount) * 100))
        : 0

    return {
      sourceId: source.id,
      sourceType: source.sourceType,
      label: source.sourceLabel,
      count: source.itemCount,
      unit: SOURCE_UNIT_BY_TYPE[source.sourceType],
      percent,
    }
  })
}

function normalizeSourceMixPercents(
  sourceMix: DashboardSourceMixItem[],
): DashboardSourceMixItem[] {
  if (sourceMix.length === 0) {
    return sourceMix
  }

  const totalPercent = sourceMix.reduce((sum, source) => sum + source.percent, 0)
  if (totalPercent === 100) {
    return sourceMix
  }

  const adjusted = sourceMix.map((source) => ({ ...source }))
  const delta = 100 - totalPercent
  adjusted[adjusted.length - 1].percent += delta
  return adjusted
}

function fallbackExecutiveSummary(
  bundle: GetAnalysisRunBundleResponse,
  totalFeedbackCount: number,
  sourceCount: number,
): string {
  const productName = bundle.analysisTarget.name || "This product"
  const sourceNoun = sourceCount === 1 ? "source" : "sources"

  return `${productName} has ${totalFeedbackCount} feedback items across ${sourceCount} ${sourceNoun} in this backend demo run. The operational metadata is coming from the analysis bundle, while the synthesis sections below remain deterministic placeholders until real analysis is implemented.`
}

function fallbackSentimentBySource(
  sourceMix: DashboardSourceMixItem[],
): SentimentBySourceItem[] {
  return sourceMix.map((source) => ({
    sourceLabel: source.label,
    negativePercent: SOURCE_NEGATIVE_PERCENT_BY_TYPE[source.sourceType],
  }))
}

function relabelSourceText<T extends { sourceLabel: string }>(
  items: T[],
  labels: string[],
): T[] {
  if (labels.length === 0) {
    return items
  }

  return items.map((item, index) => ({
    ...item,
    sourceLabel: labels[index % labels.length],
  }))
}

function relabelPainPoints(
  painPoints: DashboardPayload["painPoints"],
  labels: string[],
): DashboardPayload["painPoints"] {
  return painPoints.map((painPoint, index) => ({
    ...painPoint,
    representativeQuotes: painPoint.representativeQuotes.map((quote, quoteIndex) => ({
      ...quote,
      sourceLabel: labels[(index + quoteIndex) % labels.length] ?? quote.sourceLabel,
    })),
  }))
}

function deriveKpis(
  bundle: GetAnalysisRunBundleResponse,
  payload: Partial<DashboardPayload>,
  totalFeedbackCount: number,
  sourceCount: number,
  sourceMix: DashboardSourceMixItem[],
): DashboardKpi[] {
  const derived = [
    { label: "Feedback items analyzed", value: String(totalFeedbackCount) },
    { label: "Sources included", value: String(sourceCount) },
    { label: "Feedback set status", value: toTitleCase(bundle.feedbackSet.status) },
    { label: "Run status", value: toTitleCase(bundle.analysisRun.status) },
    {
      label: "Primary source",
      value: sourceMix[0]?.label ?? SOURCE_TAG_BY_TYPE[sourceMix[0]?.sourceType ?? "demo_dataset"],
    },
  ]

  const payloadKpis = nonEmptyArray(payload.kpis) ? payload.kpis : []
  const tail = payloadKpis
    .filter(
      (kpi) =>
        kpi.label !== "Feedback items analyzed" && kpi.label !== "Sources included",
    )
    .slice(0, 3)

  return [derived[0], derived[1], ...tail, ...derived.slice(2)].slice(0, 5)
}

export function adaptBackendBundleToDashboard(
  bundle: GetAnalysisRunBundleResponse,
): BackendDashboardViewModel {
  const payload = (bundle.dashboard ?? {}) as Partial<DashboardPayload>
  const totalFeedbackCount = deriveTotalFeedbackCount(bundle)
  const sourceMix = normalizeSourceMixPercents(
    deriveSourceMix(bundle, totalFeedbackCount),
  )
  const sourceTags = [
    ...new Set(bundle.sources.map((source) => SOURCE_TAG_BY_TYPE[source.sourceType])),
  ] as SourceTag[]
  const sourceLabels = bundle.sources.map((source) => source.sourceLabel)
  const sourceCount = bundle.sources.length
  const runTimestamp = formatTimestamp(
    bundle.analysisRun.completedAt ?? bundle.analysisRun.startedAt,
  )
  const processingMethod =
    coerceString(payload.analysisContext?.processingMethod) ??
    FALLBACK_PROCESSING_METHOD

  const fallbackQuotes = relabelSourceText(
    MOCK_DASHBOARD_PAYLOAD.representativeQuotes,
    sourceLabels,
  )
  const fallbackPainPoints = relabelPainPoints(
    MOCK_DASHBOARD_PAYLOAD.painPoints,
    sourceLabels,
  )

  const dashboard: DashboardPayload = {
    analysisContext: {
      analysisRunId: bundle.analysisRun.id,
      productName:
        bundle.analysisTarget.name ||
        coerceString(payload.analysisContext?.productName) ||
        MOCK_DASHBOARD_PAYLOAD.analysisContext.productName,
      productDescription:
        bundle.analysisTarget.description ||
        coerceString(payload.analysisContext?.productDescription) ||
        MOCK_DASHBOARD_PAYLOAD.analysisContext.productDescription,
      goal:
        bundle.feedbackSet.analysisGoal ??
        payload.analysisContext?.goal ??
        MOCK_DASHBOARD_PAYLOAD.analysisContext.goal,
      processingMethod,
      sourceCount,
      feedbackItemCount: totalFeedbackCount,
      lastRunAt: runTimestamp,
    },
    sourceMix,
    kpis: deriveKpis(bundle, payload, totalFeedbackCount, sourceCount, sourceMix),
    executiveSummary:
      coerceString(payload.executiveSummary) ??
      fallbackExecutiveSummary(bundle, totalFeedbackCount, sourceCount),
    sentimentBreakdown: {
      overall:
        payload.sentimentBreakdown && nonEmptyArray(payload.sentimentBreakdown.overall)
          ? payload.sentimentBreakdown.overall
          : MOCK_DASHBOARD_PAYLOAD.sentimentBreakdown.overall,
      bySource:
        payload.sentimentBreakdown && nonEmptyArray(payload.sentimentBreakdown.bySource)
          ? payload.sentimentBreakdown.bySource
          : fallbackSentimentBySource(sourceMix),
    },
    classificationSummary: nonEmptyArray(payload.classificationSummary)
      ? payload.classificationSummary
      : MOCK_DASHBOARD_PAYLOAD.classificationSummary,
    topThemes: nonEmptyArray(payload.topThemes)
      ? payload.topThemes
      : MOCK_DASHBOARD_PAYLOAD.topThemes,
    painPoints: nonEmptyArray(payload.painPoints)
      ? payload.painPoints
      : fallbackPainPoints,
    featureRequests: nonEmptyArray(payload.featureRequests)
      ? payload.featureRequests
      : MOCK_DASHBOARD_PAYLOAD.featureRequests,
    roadmapRecommendations: nonEmptyArray(payload.roadmapRecommendations)
      ? payload.roadmapRecommendations
      : MOCK_DASHBOARD_PAYLOAD.roadmapRecommendations,
    representativeQuotes: nonEmptyArray(payload.representativeQuotes)
      ? payload.representativeQuotes
      : fallbackQuotes,
    modelSignals: nonEmptyArray(payload.modelSignals)
      ? payload.modelSignals
      : [
          { label: "Data mode", value: "Backend demo bundle" },
          { label: "Feedback set status", value: toTitleCase(bundle.feedbackSet.status) },
          { label: "Run status", value: toTitleCase(bundle.analysisRun.status) },
          {
            label: "Sources captured",
            value: sourceLabels.join(", ") || "No sources captured",
          },
        ],
  }

  return {
    dataMode: "backend",
    analysisRunId: bundle.analysisRun.id,
    feedbackSetId: bundle.feedbackSet.id,
    feedbackSetName: bundle.feedbackSet.name,
    feedbackSetStatus: bundle.feedbackSet.status,
    analysisTargetName: dashboard.analysisContext.productName,
    analysisTargetDescription: dashboard.analysisContext.productDescription,
    analysisGoal: dashboard.analysisContext.goal,
    runStatus: bundle.analysisRun.status,
    runTimestamp,
    sourceCount,
    totalFeedbackCount,
    sourceTags,
    sourceLabels,
    processingMethod,
    dashboard,
    chatHistory: mapChatHistory(bundle),
  }
}

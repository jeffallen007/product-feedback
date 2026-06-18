import {
  CANNED_CHAT_RESPONSES,
  DEFAULT_CHAT_RESPONSE,
  MOCK_DASHBOARD_PAYLOAD,
} from "@/lib/mocks/dashboard"
import {
  DEMO_PRODUCTS,
  SOURCE_TAG_BY_TYPE,
  type DemoProductId,
} from "@/lib/mocks/workflow"
import type {
  AnalysisGoal,
  AnalysisRun,
  AnalysisTarget,
  ChatRequest,
  ChatResponse,
  DashboardPayload,
  DataSource,
  FeedbackSet,
} from "@/lib/types/contracts"

export interface CreateFeedbackSetInput {
  analysisTarget: Pick<AnalysisTarget, "name" | "description">
  analysisGoal: AnalysisGoal
  name?: string | null
}

export interface CreateFeedbackSetResult {
  analysisTarget: AnalysisTarget
  feedbackSet: FeedbackSet
}

export interface AddDemoSourceInput {
  feedbackSetId: string
  demoProductId: DemoProductId
}

export interface AddCsvSourceInput {
  feedbackSetId: string
  sourceLabel?: string
  fileName?: string
  itemCount?: number
}

export interface AddPastedSourceInput {
  feedbackSetId: string
  sourceLabel?: string
  pastedText?: string
  itemCount?: number
}

export interface AddXSourceInput {
  feedbackSetId: string
  sourceLabel?: string
  query: string
  itemCount?: number
}

export interface SynthesizeFeedbackSetInput {
  feedbackSetId: string
}

export interface AnalysisRunResult {
  analysisRun: AnalysisRun
  dashboard: DashboardPayload
}

type MockFeedbackSetRecord = {
  analysisTarget: AnalysisTarget
  feedbackSet: FeedbackSet
  sources: DataSource[]
}

const feedbackSetStore = new Map<string, MockFeedbackSetRecord>()
const analysisRunStore = new Map<string, AnalysisRunResult>()

export async function createFeedbackSet(
  input: CreateFeedbackSetInput,
): Promise<CreateFeedbackSetResult> {
  await delay(120)

  const analysisTarget: AnalysisTarget = {
    id: createId("analysis_target"),
    name: input.analysisTarget.name,
    description: input.analysisTarget.description,
    createdAt: now(),
  }

  const feedbackSet: FeedbackSet = {
    id: createId("feedback_set"),
    analysisTargetId: analysisTarget.id,
    name: input.name ?? null,
    analysisGoal: input.analysisGoal,
    status: "draft",
    totalFeedbackCount: 0,
    createdAt: now(),
    updatedAt: now(),
  }

  feedbackSetStore.set(feedbackSet.id, {
    analysisTarget,
    feedbackSet,
    sources: [],
  })

  return { analysisTarget, feedbackSet }
}

export async function addDemoSource(
  input: AddDemoSourceInput,
): Promise<DataSource> {
  await delay(80)
  const product = DEMO_PRODUCTS.find((entry) => entry.id === input.demoProductId)
  const source = createSource({
    feedbackSetId: input.feedbackSetId,
    sourceType: "demo_dataset",
    sourceLabel: `${product?.label ?? "Productivity Tool"} Demo Dataset`,
    itemCount: product?.count ?? 482,
    metadata: {
      demoProductId: input.demoProductId,
    },
  })

  persistSource(source)
  return source
}

export async function addCsvSource(
  input: AddCsvSourceInput,
): Promise<DataSource> {
  await delay(80)
  const source = createSource({
    feedbackSetId: input.feedbackSetId,
    sourceType: "csv_upload",
    sourceLabel: input.sourceLabel ?? "Uploaded CSV",
    itemCount: input.itemCount ?? 318,
    metadata: {
      fileName: input.fileName ?? "uploaded-feedback.csv",
    },
  })

  persistSource(source)
  return source
}

export async function addPastedSource(
  input: AddPastedSourceInput,
): Promise<DataSource> {
  await delay(80)
  const source = createSource({
    feedbackSetId: input.feedbackSetId,
    sourceType: "pasted_text",
    sourceLabel: input.sourceLabel ?? "Pasted Reviews",
    itemCount: input.itemCount ?? 24,
    metadata: {
      pastedLength: input.pastedText?.length ?? 0,
    },
  })

  persistSource(source)
  return source
}

export async function addXSource(input: AddXSourceInput): Promise<DataSource> {
  await delay(80)
  const source = createSource({
    feedbackSetId: input.feedbackSetId,
    sourceType: "x_search",
    sourceLabel: input.sourceLabel ?? `X Search: "${input.query}"`,
    itemCount: input.itemCount ?? 86,
    metadata: {
      query: input.query,
    },
  })

  persistSource(source)
  return source
}

export async function synthesizeFeedbackSet(
  input: SynthesizeFeedbackSetInput,
): Promise<AnalysisRun> {
  await delay(150)

  const record = feedbackSetStore.get(input.feedbackSetId)
  if (!record) {
    throw new Error("Feedback set not found.")
  }

  const analysisRun: AnalysisRun = {
    id: createId("analysis_run"),
    feedbackSetId: input.feedbackSetId,
    status: "completed",
    currentStep: "generate_dashboard",
    steps: [
      step("create_feedback_set"),
      step("ingest_sources"),
      step("normalize_feedback"),
      step("merge_feedback"),
      step("dedupe_feedback"),
      step("classify_feedback"),
      step("analyze_sentiment"),
      step("cluster_themes"),
      step("retrieve_quotes"),
      step("generate_dashboard"),
    ],
    startedAt: now(),
    completedAt: now(),
    errorMessage: null,
    metadata: {
      feedbackItemCount: MOCK_DASHBOARD_PAYLOAD.analysisContext.feedbackItemCount,
      sourceCount: MOCK_DASHBOARD_PAYLOAD.analysisContext.sourceCount,
    },
  }

  const dashboard = buildDashboardPayload(analysisRun.id)
  analysisRunStore.set(analysisRun.id, { analysisRun, dashboard })

  record.feedbackSet.status = "completed"
  record.feedbackSet.updatedAt = now()

  return analysisRun
}

export async function getAnalysisRun(
  analysisRunId: string,
): Promise<AnalysisRunResult> {
  await delay(100)
  const result = analysisRunStore.get(analysisRunId)
  if (!result) {
    throw new Error("Analysis run not found.")
  }
  return result
}

export async function askAnalysisQuestion(
  request: ChatRequest,
): Promise<ChatResponse> {
  await delay(250)

  const normalized = request.question.toLowerCase()
  const match = CANNED_CHAT_RESPONSES.find((entry) =>
    normalized.includes(entry.match),
  )

  if (!match) {
    return {
      ...DEFAULT_CHAT_RESPONSE,
      scopeUsed: request.scope,
    }
  }

  return {
    ...match.response,
    scopeUsed:
      match.response.scopeUsed === "all" ? request.scope : match.response.scopeUsed,
  }
}

function buildDashboardPayload(analysisRunId: string): DashboardPayload {
  return {
    ...MOCK_DASHBOARD_PAYLOAD,
    analysisContext: {
      ...MOCK_DASHBOARD_PAYLOAD.analysisContext,
      analysisRunId,
    },
  }
}

function persistSource(source: DataSource) {
  const record = feedbackSetStore.get(source.feedbackSetId)
  if (!record) {
    throw new Error("Feedback set not found.")
  }

  record.sources.push(source)
  record.feedbackSet.totalFeedbackCount = record.sources.reduce(
    (total, entry) => total + entry.itemCount,
    0,
  )
  record.feedbackSet.updatedAt = now()
  record.feedbackSet.status = "ready"
}

function createSource({
  feedbackSetId,
  sourceType,
  sourceLabel,
  itemCount,
  metadata,
}: {
  feedbackSetId: string
  sourceType: DataSource["sourceType"]
  sourceLabel: string
  itemCount: number
  metadata: Record<string, unknown>
}): DataSource {
  return {
    id: createId("source"),
    feedbackSetId,
    sourceType,
    sourceLabel,
    itemCount,
    status: "ready",
    metadata: {
      ...metadata,
      sourceTag: SOURCE_TAG_BY_TYPE[sourceType],
    },
    createdAt: now(),
  }
}

function step(name: AnalysisRun["steps"][number]["name"]): AnalysisRun["steps"][number] {
  return {
    name,
    status: "completed",
    startedAt: now(),
    completedAt: now(),
    errorMessage: null,
  }
}

function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function now(): string {
  return new Date().toISOString()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

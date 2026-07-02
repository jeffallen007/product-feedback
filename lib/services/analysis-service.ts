import {
  CANNED_CHAT_RESPONSES,
  DEFAULT_CHAT_RESPONSE,
  MOCK_DASHBOARD_PAYLOAD,
} from "@/lib/mocks/dashboard"
import { DEMO_PRODUCTS } from "@/lib/mocks/workflow"
import { SOURCE_DEFINITIONS } from "@/lib/config/workflow"
import { composeDashboardForGoal } from "@/lib/services/dashboard-goal-composition"
import { isBackendDemoEnabled, backendRequest } from "@/lib/services/backend-client"
import { mapBackendBundleResponse } from "@/lib/services/backend-mappers"
import { countCsvFeedbackItems } from "@/lib/services/csv-upload"
import type {
  AnalysisBundleMeta,
  AddCsvSourceRequest,
  AddCsvSourceResponse,
  AddDemoSourceRequest,
  AddDemoSourceResponse,
  AddPastedSourceRequest,
  AddPastedSourceResponse,
  AddXSourceRequest,
  AddXSourceResponse,
  AskAnalysisQuestionRequest,
  AskAnalysisQuestionResponse,
  BuildCustomReviewStateRequest,
  BuildCustomReviewStateResponse,
  BuildDemoReviewStateRequest,
  BuildDemoReviewStateResponse,
  CreateFeedbackSetRequest,
  CreateFeedbackSetResponse,
  GetAnalysisRunBundleRequest,
  GetAnalysisRunBundleResponse,
  GetAnalysisRunRequest,
  GetAnalysisRunResponse,
  RunDemoAnalysisRequest,
  RunDemoAnalysisResponse,
  SynthesizeFeedbackSetRequest,
  SynthesizeFeedbackSetResponse,
} from "@/lib/types/api"
import type {
  AnalysisRun,
  AnalysisTarget,
  DashboardPayload,
  DataSource,
  FeedbackSet,
} from "@/lib/types/contracts"
import {
  SOURCE_TAG_BY_TYPE,
  type ConfiguredSource,
} from "@/lib/types/workflow"

type MockFeedbackSetRecord = {
  analysisTarget: AnalysisTarget
  feedbackSet: FeedbackSet
  sources: DataSource[]
}

const feedbackSetStore = new Map<string, MockFeedbackSetRecord>()
const analysisRunStore = new Map<string, GetAnalysisRunResponse>()
const analysisRunBundleStore = new Map<string, GetAnalysisRunBundleResponse>()
const analysisRunModeStore = new Map<string, "mock" | "backend">()

const BACKEND_DEMO_PRODUCT_IDS: Record<
  BuildDemoReviewStateRequest["demoProductId"],
  string
> = {
  fitness: "fitness_app",
  crm: "crm_tool",
  productivity: "productivity_tool",
}

export async function createFeedbackSet(
  input: CreateFeedbackSetRequest,
): Promise<CreateFeedbackSetResponse> {
  if (isBackendDemoEnabled()) {
    return backendRequest<CreateFeedbackSetResponse>("/feedback-sets", {
      method: "POST",
      body: JSON.stringify({
        analysisTarget: input.analysisTarget,
        analysisGoal: input.analysisGoal,
        name: input.name ?? undefined,
      }),
    })
  }

  return createMockFeedbackSet(input)
}

export async function runDemoAnalysis(
  input: RunDemoAnalysisRequest,
): Promise<RunDemoAnalysisResponse> {
  if (isBackendDemoEnabled()) {
    return runBackendDemoAnalysis(input)
  }

  return runMockDemoAnalysis(input)
}

function logBackendFallback(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return
  }

  console.error(`[backend-demo] ${context}`, error)
}

function createBundleMeta(
  dataMode: "mock" | "backend",
  analysisRunId?: string,
  feedbackSetId?: string,
): AnalysisBundleMeta {
  return {
    dataMode,
    analysisRunId,
    feedbackSetId,
  }
}

async function createMockFeedbackSet(
  input: CreateFeedbackSetRequest,
): Promise<CreateFeedbackSetResponse> {
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
  input: AddDemoSourceRequest,
): Promise<AddDemoSourceResponse> {
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
  return { source }
}

export async function addCsvSource(
  input: AddCsvSourceRequest,
): Promise<AddCsvSourceResponse> {
  if (isBackendDemoEnabled()) {
    if (!input.file) {
      throw new Error("Select a CSV file before reviewing the feedback set.")
    }

    const formData = new FormData()
    formData.append("file", input.file, input.file.name)
    if (input.sourceLabel) {
      formData.append("source_label", input.sourceLabel)
    }

    return backendRequest<AddCsvSourceResponse>(
      `/feedback-sets/${input.feedbackSetId}/sources/csv`,
      {
        method: "POST",
        body: formData,
      },
    )
  }

  await delay(80)
  const source = createSource({
    feedbackSetId: input.feedbackSetId,
    sourceType: "csv_upload",
    sourceLabel: input.sourceLabel ?? input.fileName ?? "CSV Upload",
    itemCount: input.itemCount ?? 318,
    metadata: {
      fileName: input.fileName ?? "uploaded-feedback.csv",
    },
  })

  persistSource(source)
  return { source }
}

export async function addPastedSource(
  input: AddPastedSourceRequest,
): Promise<AddPastedSourceResponse> {
  if (isBackendDemoEnabled()) {
    return backendRequest<AddPastedSourceResponse>(
      `/feedback-sets/${input.feedbackSetId}/sources/pasted`,
      {
        method: "POST",
        body: JSON.stringify({
          pastedText: input.pastedText,
          sourceLabel: input.sourceLabel,
        }),
      },
    )
  }

  await delay(80)
  const source = createSource({
    feedbackSetId: input.feedbackSetId,
    sourceType: "pasted_text",
    sourceLabel: input.sourceLabel ?? "Pasted Feedback",
    itemCount: input.itemCount ?? 24,
    metadata: {
      pastedLength: input.pastedText?.length ?? 0,
    },
  })

  persistSource(source)
  return { source }
}

export async function addXSource(
  input: AddXSourceRequest,
): Promise<AddXSourceResponse> {
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
  return { source }
}

export async function synthesizeFeedbackSet(
  input: SynthesizeFeedbackSetRequest,
): Promise<SynthesizeFeedbackSetResponse> {
  if (isBackendDemoEnabled()) {
    const response = await backendRequest<SynthesizeFeedbackSetResponse>(
      `/feedback-sets/${input.feedbackSetId}/synthesize`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    )

    analysisRunModeStore.set(response.analysisRun.id, "backend")
    return response
  }

  return synthesizeMockFeedbackSet(input)
}

export async function getAnalysisRunBundle(
  request: GetAnalysisRunBundleRequest,
): Promise<GetAnalysisRunBundleResponse> {
  const runMode = analysisRunModeStore.get(request.analysisRunId)
  const cachedBundle = analysisRunBundleStore.get(request.analysisRunId)

  if (runMode === "backend") {
    if (isBackendDemoEnabled()) {
      try {
        const bundle = await fetchBackendBundle(request.analysisRunId)
        analysisRunBundleStore.set(request.analysisRunId, bundle)
        return bundle
      } catch (error) {
        if (cachedBundle) {
          logBackendFallback(
            "Bundle refresh failed, using the cached backend bundle instead.",
            error,
          )
          return cachedBundle
        }

        logBackendFallback(
          "Bundle refresh failed with no cached backend bundle available.",
          error,
        )
      }
    }

    if (cachedBundle) {
      return cachedBundle
    }
  }

  const record = analysisRunStore.get(request.analysisRunId)
  if (!record) {
    throw new Error("Analysis run not found.")
  }

  const bundle = buildMockBundle(request.analysisRunId)
  analysisRunBundleStore.set(request.analysisRunId, bundle)
  analysisRunModeStore.set(request.analysisRunId, "mock")
  return bundle
}

async function synthesizeMockFeedbackSet(
  input: SynthesizeFeedbackSetRequest,
): Promise<SynthesizeFeedbackSetResponse> {
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
      feedbackItemCount:
        record.feedbackSet.totalFeedbackCount ||
        record.sources.reduce((sum, source) => sum + source.itemCount, 0),
      sourceCount: record.sources.length,
    },
  }

  const dashboard = buildDashboardPayload(analysisRun.id)
  analysisRunStore.set(analysisRun.id, { analysisRun, dashboard })
  analysisRunBundleStore.set(analysisRun.id, buildMockBundle(analysisRun.id))
  analysisRunModeStore.set(analysisRun.id, "mock")

  record.feedbackSet.status = "completed"
  record.feedbackSet.updatedAt = now()

  return { analysisRun }
}

export async function getAnalysisRun(
  request: GetAnalysisRunRequest,
): Promise<GetAnalysisRunResponse> {
  const bundle = await getAnalysisRunBundle({
    analysisRunId: request.analysisRunId,
  })

  if (!bundle.dashboard) {
    throw new Error(
      bundle.placeholderMessage ?? "Analysis dashboard is not available yet.",
    )
  }

  return {
    analysisRun: bundle.analysisRun,
    dashboard: bundle.dashboard,
    meta: bundle.meta,
  }
}

export async function askAnalysisQuestion(
  request: AskAnalysisQuestionRequest,
): Promise<AskAnalysisQuestionResponse> {
  const runMode = analysisRunModeStore.get(request.analysisRunId)

  if (runMode === "backend" && isBackendDemoEnabled()) {
    const response = await backendRequest<AskAnalysisQuestionResponse & {
      userMessage?: GetAnalysisRunBundleResponse["chatHistory"][number]
      assistantMessage?: GetAnalysisRunBundleResponse["chatHistory"][number]
    }>(`/analysis-runs/${request.analysisRunId}/chat`, {
      method: "POST",
      body: JSON.stringify({
        question: request.question,
        scope: request.scope,
      }),
    })

    const cachedBundle = analysisRunBundleStore.get(request.analysisRunId)
    if (cachedBundle) {
      const nextChatHistory = [...cachedBundle.chatHistory]
      if (response.userMessage) {
        nextChatHistory.push(response.userMessage)
      }
      if (response.assistantMessage) {
        nextChatHistory.push(response.assistantMessage)
      }
      analysisRunBundleStore.set(request.analysisRunId, {
        ...cachedBundle,
        chatHistory: nextChatHistory,
      })
    }

    return {
      answer: response.answer,
      scopeUsed: response.scopeUsed,
      evidence: response.evidence,
      followUpSuggestions: response.followUpSuggestions,
    }
  }

  return askMockAnalysisQuestion(request)
}

async function runBackendDemoAnalysis(
  input: RunDemoAnalysisRequest,
): Promise<RunDemoAnalysisResponse> {
  const createResponse = await backendRequest<{
    analysisTarget: AnalysisTarget
    feedbackSet: FeedbackSet
  }>("/feedback-sets", {
    method: "POST",
    body: JSON.stringify({
      analysisTarget: input.analysisTarget,
      analysisGoal: input.analysisGoal,
    }),
  })

  await backendRequest<AddDemoSourceResponse>(
    `/feedback-sets/${createResponse.feedbackSet.id}/sources/demo`,
    {
      method: "POST",
      body: JSON.stringify({
        demoProductId: BACKEND_DEMO_PRODUCT_IDS[input.demoProductId],
      }),
    },
  )

  const synthesizeResponse = await backendRequest<{
    analysisRun: { id: string }
  }>(`/feedback-sets/${createResponse.feedbackSet.id}/synthesize`, {
    method: "POST",
    body: JSON.stringify({
      analysisGoal: input.analysisGoal,
    }),
  })

  const bundle = await fetchBackendBundle(synthesizeResponse.analysisRun.id)
  analysisRunModeStore.set(bundle.analysisRun.id, "backend")
  analysisRunBundleStore.set(bundle.analysisRun.id, bundle)

  return {
    analysisRun: bundle.analysisRun,
    bundle,
    meta: bundle.meta,
  }
}

async function runMockDemoAnalysis(
  input: RunDemoAnalysisRequest,
): Promise<RunDemoAnalysisResponse> {
  const { feedbackSet } = await createMockFeedbackSet({
    analysisTarget: input.analysisTarget,
    analysisGoal: input.analysisGoal,
  })

  await addDemoSource({
    feedbackSetId: feedbackSet.id,
    demoProductId: input.demoProductId,
  })

  const synthesizeResponse = await synthesizeMockFeedbackSet({
    feedbackSetId: feedbackSet.id,
  })
  const demoReviewState = buildDemoReviewState({
    demoProductId: input.demoProductId,
  })
  const bundle = buildMockBundle(synthesizeResponse.analysisRun.id, {
    productName: demoReviewState.product.name,
    productDescription: demoReviewState.product.description,
    analysisGoal: input.analysisGoal,
    sourceLabel: demoReviewState.sources[0]?.sourceLabel ?? "Demo Dataset",
    sourceCount: 1,
    feedbackItemCount: demoReviewState.sources[0]?.itemCount ?? 0,
  })
  const storedRun = analysisRunStore.get(synthesizeResponse.analysisRun.id)
  if (storedRun && bundle.dashboard) {
    analysisRunStore.set(synthesizeResponse.analysisRun.id, {
      ...storedRun,
      dashboard: bundle.dashboard,
    })
  }
  analysisRunBundleStore.set(synthesizeResponse.analysisRun.id, bundle)

  return {
    analysisRun: synthesizeResponse.analysisRun,
    bundle,
    meta: bundle.meta,
  }
}

async function fetchBackendBundle(
  analysisRunId: string,
): Promise<GetAnalysisRunBundleResponse> {
  const bundle = await backendRequest<Parameters<typeof mapBackendBundleResponse>[0]>(
    `/analysis-runs/${analysisRunId}/bundle`,
  )
  return mapBackendBundleResponse(bundle)
}

function buildMockBundle(
  analysisRunId: string,
  dashboardOverrides?: {
    productName: string
    productDescription: string
    analysisGoal: DashboardPayload["analysisContext"]["goal"]
    sourceLabel: string
    sourceCount: number
    feedbackItemCount: number
  },
): GetAnalysisRunBundleResponse {
  const runRecord = analysisRunStore.get(analysisRunId)
  if (!runRecord) {
    throw new Error("Analysis run not found.")
  }

  const feedbackRecord = feedbackSetStore.get(runRecord.analysisRun.feedbackSetId)
  if (!feedbackRecord) {
    throw new Error("Feedback set not found.")
  }

  return {
    analysisRun: runRecord.analysisRun,
    feedbackSet: feedbackRecord.feedbackSet,
    analysisTarget: feedbackRecord.analysisTarget,
    sources: feedbackRecord.sources,
    dashboard:
      dashboardOverrides === undefined
        ? runRecord.dashboard
        : buildDashboardPayload(analysisRunId, dashboardOverrides),
    chatHistory: [],
    placeholderMessage: null,
    meta: createBundleMeta(
      "mock",
      runRecord.analysisRun.id,
      feedbackRecord.feedbackSet.id,
    ),
  }
}

async function askMockAnalysisQuestion(
  request: AskAnalysisQuestionRequest,
): Promise<AskAnalysisQuestionResponse> {
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

export function buildDemoReviewState(
  request: BuildDemoReviewStateRequest,
): BuildDemoReviewStateResponse {
  const demoProduct = DEMO_PRODUCTS.find((entry) => entry.id === request.demoProductId)

  return {
    product: {
      name: demoProduct?.label ?? "Productivity Tool (Notion)",
      description:
        demoProduct?.description ??
        "An all-in-one digital workspace that combines note-taking, project management, and more.",
    },
    sources: [
      {
        id: `demo-${request.demoProductId}`,
        sourceType: "demo_dataset",
        sourceTag: SOURCE_TAG_BY_TYPE.demo_dataset,
        sourceLabel: `${demoProduct?.label ?? "Productivity Tool (Notion)"} Demo Dataset`,
        itemCount: demoProduct?.count ?? 750,
        status: "Ready",
        mockConfig: { demoProductId: request.demoProductId },
      },
    ],
  }
}

export function buildCustomReviewState(
  request: BuildCustomReviewStateRequest,
): BuildCustomReviewStateResponse {
  const sourceDefinitions = new Map(
    SOURCE_DEFINITIONS.map((source) => [source.id, source]),
  )
  const sources = (request.existingSources ?? []).filter(
    (source) => source.sourceType === "demo_dataset",
  )

  if (
    request.selectedSourceIds.includes("csv") &&
    sourceDefinitions.get("csv")?.isAvailable !== false
  ) {
    sources.push(
      createReviewSource({
        id: "csv-upload",
        sourceType: "csv_upload",
        sourceLabel: request.csvFileName ?? "CSV Upload",
        itemCount: request.csvItemCount ?? 0,
      }),
    )
  }

  if (request.selectedSourceIds.includes("paste")) {
    sources.push(
      createReviewSource({
        id: "pasted",
        sourceType: "pasted_text",
        sourceLabel: "Pasted Feedback",
        itemCount: countPastedFeedbackItems(request.pastedText),
      }),
    )
  }

  if (
    request.selectedSourceIds.includes("search") &&
    sourceDefinitions.get("search")?.isAvailable !== false
  ) {
    const query = request.searchQuery || "Monday.com notifications"
    sources.push(
      createReviewSource({
        id: "x-search",
        sourceType: "x_search",
        sourceLabel: `X Search: "${query}"`,
        itemCount: 86,
        mockConfig: {
          xQuery: query,
        },
      }),
    )
  }

  return {
    product: request.product,
    sources,
  }
}

export function countPastedFeedbackItems(pastedText?: string): number {
  if (!pastedText) {
    return 0
  }

  return pastedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length
}

export { countCsvFeedbackItems }

function buildDashboardPayload(
  analysisRunId: string,
  overrides?: {
    productName: string
    productDescription: string
    analysisGoal: DashboardPayload["analysisContext"]["goal"]
    sourceLabel: string
    sourceCount: number
    feedbackItemCount: number
  },
): DashboardPayload {
  return composeDashboardForGoal({
    ...MOCK_DASHBOARD_PAYLOAD,
    analysisContext: {
      ...MOCK_DASHBOARD_PAYLOAD.analysisContext,
      analysisRunId,
      productName:
        overrides?.productName ?? MOCK_DASHBOARD_PAYLOAD.analysisContext.productName,
      productDescription:
        overrides?.productDescription ??
        MOCK_DASHBOARD_PAYLOAD.analysisContext.productDescription,
      goal: overrides?.analysisGoal ?? MOCK_DASHBOARD_PAYLOAD.analysisContext.goal,
      sourceCount:
        overrides?.sourceCount ?? MOCK_DASHBOARD_PAYLOAD.analysisContext.sourceCount,
      feedbackItemCount:
        overrides?.feedbackItemCount ??
        MOCK_DASHBOARD_PAYLOAD.analysisContext.feedbackItemCount,
    },
    sourceMix:
      overrides === undefined
        ? MOCK_DASHBOARD_PAYLOAD.sourceMix
        : [
            {
              sourceId: "source_demo",
              sourceType: "demo_dataset",
              label: overrides.sourceLabel,
              count: overrides.feedbackItemCount,
              unit: "items",
              percent: 100,
            },
          ],
    kpis:
      overrides === undefined
        ? MOCK_DASHBOARD_PAYLOAD.kpis
        : [
            {
              label: "Feedback items analyzed",
              value: String(overrides.feedbackItemCount),
            },
            { label: "Sources included", value: String(overrides.sourceCount) },
            ...MOCK_DASHBOARD_PAYLOAD.kpis.slice(2),
          ],
  })
}

function createReviewSource({
  id,
  sourceType,
  sourceLabel,
  itemCount,
  mockConfig,
}: {
  id: string
  sourceType: ConfiguredSource["sourceType"]
  sourceLabel: string
  itemCount: number
  mockConfig?: ConfiguredSource["mockConfig"]
}): ConfiguredSource {
  return {
    id,
    sourceType,
    sourceTag: SOURCE_TAG_BY_TYPE[sourceType],
    sourceLabel,
    itemCount,
    status: "Ready",
    mockConfig,
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

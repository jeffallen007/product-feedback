import type { AnalysisGoal } from "@/lib/types/contracts"
import type {
  ConfiguredSource,
  DemoProductId,
  ProductContext,
} from "@/lib/types/workflow"
import {
  addCsvSource,
  addDemoSource,
  addPastedSource,
  createFeedbackSet,
  getAnalysisRunBundle,
  getAnalysisRunProgress,
  queueAnalysisRun,
} from "@/lib/services/analysis-service"

export const PROGRESS_STAGES = [
  { name: "create_feedback_set", label: "Creating feedback set" },
  { name: "ingest_sources", label: "Ingesting feedback" },
  { name: "start_analysis", label: "Starting analysis" },
  { name: "prepare_feedback", label: "Loading and preparing feedback" },
  { name: "generate_insights", label: "Generating insights" },
  { name: "save_dashboard", label: "Saving dashboard" },
  { name: "load_dashboard", label: "Opening dashboard" },
] as const

export type ProgressStageName = (typeof PROGRESS_STAGES)[number]["name"]
export type ProgressStageStatus = "pending" | "running" | "completed" | "failed"

export interface ProgressSnapshot {
  stages: Record<ProgressStageName, ProgressStageStatus>
  feedbackItemCount: number | null
  sourceCount: number | null
  ingestedSourceCount: number
  queued: boolean
  notice: string | null
}

export function initialProgressSnapshot(): ProgressSnapshot {
  return {
    stages: {
      create_feedback_set: "running",
      ingest_sources: "pending",
      start_analysis: "pending",
      prepare_feedback: "pending",
      generate_insights: "pending",
      save_dashboard: "pending",
      load_dashboard: "pending",
    },
    feedbackItemCount: null,
    sourceCount: null,
    ingestedSourceCount: 0,
    queued: false,
    notice: null,
  }
}

export interface ProgressWorkflowInput {
  path: "demo" | "custom"
  demoProductId: DemoProductId
  product: ProductContext
  analysisGoal: AnalysisGoal
  sources: ConfiguredSource[]
  csvFile: File | null
  pastedText: string
}

export interface ProgressWorkflowCallbacks {
  onProgress: (snapshot: ProgressSnapshot) => void
  onRunId: (runId: string) => void
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class AnalysisJobFailedError extends Error {}

export async function pollAnalysisRun(
  runId: string,
  snapshot: ProgressSnapshot,
  callbacks: ProgressWorkflowCallbacks,
): Promise<void> {
  let consecutiveErrors = 0
  const queuedAt = Date.now()
  while (true) {
    try {
      const { analysisRun } = await getAnalysisRunProgress(runId)
      consecutiveErrors = 0
      snapshot.queued = analysisRun.status === "queued"
      snapshot.notice = snapshot.queued && Date.now() - queuedAt > 30_000
        ? "Analysis is taking longer than usual to start. This page will keep checking."
        : null
      for (const step of analysisRun.steps) {
        if (step.name in snapshot.stages) {
          snapshot.stages[step.name as ProgressStageName] = step.status
        }
      }
      if (analysisRun.status === "completed" && analysisRun.steps.length === 0) {
        // Synchronous runs created before progress tracking have no stored stages.
        for (const name of ["prepare_feedback", "generate_insights", "save_dashboard"] as const) {
          snapshot.stages[name] = "completed"
        }
      }
      if (analysisRun.status === "failed" && typeof analysisRun.currentStep === "string" && analysisRun.currentStep in snapshot.stages) {
        snapshot.stages[analysisRun.currentStep as ProgressStageName] = "failed"
      }
      callbacks.onProgress({ ...snapshot, stages: { ...snapshot.stages } })
      if (analysisRun.status === "failed") {
        throw new AnalysisJobFailedError(
          analysisRun.errorMessage || "Analysis failed. Please start a new analysis.",
        )
      }
      if (analysisRun.status === "completed") {
        return
      }
    } catch (error) {
      if (error instanceof AnalysisJobFailedError) {
        throw error
      }
      consecutiveErrors += 1
      if (consecutiveErrors >= 3) {
        throw error
      }
      snapshot.notice = "Connection interrupted. Retrying analysis status…"
      callbacks.onProgress({ ...snapshot, stages: { ...snapshot.stages } })
    }
    await wait(1500)
  }
}

export async function runProgressWorkflow(
  input: ProgressWorkflowInput,
  callbacks: ProgressWorkflowCallbacks,
): Promise<string> {
  const snapshot = initialProgressSnapshot()
  callbacks.onProgress({ ...snapshot, stages: { ...snapshot.stages } })

  function complete(stage: ProgressStageName, next: ProgressStageName) {
    snapshot.stages[stage] = "completed"
    snapshot.stages[next] = "running"
    callbacks.onProgress({ ...snapshot, stages: { ...snapshot.stages } })
  }

  try {
    const { feedbackSet } = await createFeedbackSet({
      analysisTarget: { name: input.product.name, description: input.product.description },
      analysisGoal: input.analysisGoal,
    })
    complete("create_feedback_set", "ingest_sources")

    const sources = input.path === "demo"
      ? input.sources.filter((source) => source.sourceType === "demo_dataset")
      : input.sources
    let feedbackItemCount = 0
    for (const source of sources) {
      let itemCount: number
      if (source.sourceType === "demo_dataset") {
        const result = await addDemoSource({
          feedbackSetId: feedbackSet.id,
          demoProductId: source.mockConfig?.demoProductId ?? input.demoProductId,
        })
        itemCount = result.source.itemCount
      } else if (source.sourceType === "csv_upload") {
        if (!input.csvFile) throw new Error("Select a CSV file before synthesizing.")
        const result = await addCsvSource({
          feedbackSetId: feedbackSet.id,
          sourceLabel: source.sourceLabel,
          file: input.csvFile,
          fileName: input.csvFile.name,
          itemCount: source.itemCount,
        })
        itemCount = result.source.itemCount
      } else if (source.sourceType === "pasted_text") {
        const result = await addPastedSource({
          feedbackSetId: feedbackSet.id,
          sourceLabel: source.sourceLabel,
          pastedText: input.pastedText,
          itemCount: source.itemCount,
        })
        itemCount = result.source.itemCount
      } else {
        throw new Error("X Search is a future feature and is not available in this MVP.")
      }
      feedbackItemCount += itemCount
      snapshot.ingestedSourceCount += 1
      snapshot.feedbackItemCount = feedbackItemCount
      snapshot.sourceCount = sources.length
      callbacks.onProgress({ ...snapshot, stages: { ...snapshot.stages } })
    }
    complete("ingest_sources", "start_analysis")

    const { analysisRun } = await queueAnalysisRun({
      feedbackSetId: feedbackSet.id,
      analysisGoal: input.analysisGoal,
      requestKey: crypto.randomUUID(),
    })
    callbacks.onRunId(analysisRun.id)
    snapshot.stages.start_analysis = "completed"
    snapshot.queued = true
    callbacks.onProgress({ ...snapshot, stages: { ...snapshot.stages } })
    await pollAnalysisRun(analysisRun.id, snapshot, callbacks)

    snapshot.stages.load_dashboard = "running"
    callbacks.onProgress({ ...snapshot, stages: { ...snapshot.stages } })
    const bundle = await getAnalysisRunBundle({ analysisRunId: analysisRun.id })
    if (!bundle.dashboard) {
      throw new Error("The analysis finished, but its dashboard is not available yet.")
    }
    snapshot.stages.load_dashboard = "completed"
    callbacks.onProgress({ ...snapshot, stages: { ...snapshot.stages } })
    return analysisRun.id
  } catch (error) {
    const active = PROGRESS_STAGES.find(
      (stage) => snapshot.stages[stage.name] === "running",
    )
    if (active) snapshot.stages[active.name] = "failed"
    callbacks.onProgress({ ...snapshot, stages: { ...snapshot.stages } })
    throw error
  }
}

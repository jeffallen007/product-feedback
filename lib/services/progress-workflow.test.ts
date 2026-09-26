import { beforeEach, describe, expect, it, vi } from "vitest"

const service = vi.hoisted(() => ({
  createFeedbackSet: vi.fn(),
  addDemoSource: vi.fn(),
  addCsvSource: vi.fn(),
  addPastedSource: vi.fn(),
  queueAnalysisRun: vi.fn(),
  getAnalysisRunProgress: vi.fn(),
  getAnalysisRunBundle: vi.fn(),
}))

vi.mock("@/lib/services/analysis-service", () => service)

import {
  initialProgressSnapshot,
  pollAnalysisRun,
  runProgressWorkflow,
  type ProgressSnapshot,
} from "@/lib/services/progress-workflow"

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

function response(status: "queued" | "running" | "completed" | "failed", active?: string) {
  const names = ["prepare_feedback", "generate_insights", "save_dashboard"]
  const activeIndex = active ? names.indexOf(active) : status === "completed" ? names.length : -1
  return {
    analysisRun: {
      status,
      errorMessage: status === "failed" ? "Analysis failed. Please start a new analysis." : null,
      steps: names.map((name, index) => ({
        name,
        status: status === "failed" && index === activeIndex
          ? "failed"
          : index < activeIndex ? "completed" : index === activeIndex ? "running" : "pending",
      })),
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("crypto", { randomUUID: () => "d9d5ea61-64f4-4f38-94f2-22436cc60e2a" })
})

describe("real analysis progress", () => {
  it("shows creation while its request is pending, then completes stages in order", async () => {
    const creation = deferred<{ feedbackSet: { id: string } }>()
    service.createFeedbackSet.mockReturnValue(creation.promise)
    service.addDemoSource.mockResolvedValue({ source: { itemCount: 749 } })
    service.queueAnalysisRun.mockResolvedValue({ analysisRun: { id: "run_123" } })
    service.getAnalysisRunProgress.mockResolvedValue(response("completed"))
    service.getAnalysisRunBundle.mockResolvedValue({ dashboard: { executiveSummary: "Done" } })

    const snapshots: ProgressSnapshot[] = []
    const runIds: string[] = []
    const running = runProgressWorkflow(
      {
        path: "demo",
        demoProductId: "productivity",
        product: { name: "Notion", description: "Notes" },
        analysisGoal: "Full Product Feedback Synthesis",
        sources: [{ id: "demo", sourceType: "demo_dataset", sourceLabel: "Demo", itemCount: 750, status: "Ready", sourceTag: "Demo Dataset" }],
        csvFile: null,
        pastedText: "",
      },
      { onProgress: (snapshot) => snapshots.push(snapshot), onRunId: (id) => runIds.push(id) },
    )

    expect(snapshots[0].stages.create_feedback_set).toBe("running")
    expect(snapshots[0].stages.ingest_sources).toBe("pending")
    expect(service.addDemoSource).not.toHaveBeenCalled()
    creation.resolve({ feedbackSet: { id: "set_456" } })

    expect(await running).toBe("run_123")
    expect(runIds).toEqual(["run_123"])
    expect(snapshots.at(-1)?.feedbackItemCount).toBe(749)
    expect(snapshots.at(-1)?.stages).toEqual({
      create_feedback_set: "completed",
      ingest_sources: "completed",
      start_analysis: "completed",
      prepare_feedback: "completed",
      generate_insights: "completed",
      save_dashboard: "completed",
      load_dashboard: "completed",
    })
    expect(service.getAnalysisRunBundle).toHaveBeenCalledAfter(service.getAnalysisRunProgress)
  })

  it("fails immediately on a terminal backend error without treating it as a transient poll failure", async () => {
    service.getAnalysisRunProgress.mockResolvedValue(response("failed", "generate_insights"))
    const snapshots: ProgressSnapshot[] = []
    const snapshot = initialProgressSnapshot()
    snapshot.stages.create_feedback_set = "completed"
    snapshot.stages.ingest_sources = "completed"
    snapshot.stages.start_analysis = "completed"

    await expect(pollAnalysisRun("run_123", snapshot, {
      onProgress: (value) => snapshots.push(value),
      onRunId: () => {},
    })).rejects.toThrow("Analysis failed.")

    expect(service.getAnalysisRunProgress).toHaveBeenCalledTimes(1)
    expect(snapshots.at(-1)?.stages.generate_insights).toBe("failed")
    expect(snapshots.at(-1)?.stages.save_dashboard).toBe("pending")
  })
})

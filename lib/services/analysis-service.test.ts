import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("analysis-service custom sources", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("builds pasted review state counts from newline-delimited input", async () => {
    const { buildCustomReviewState } = await import("@/lib/services/analysis-service")

    const result = buildCustomReviewState({
      product: {
        name: "Acme PM",
        description: "Project planning tool",
      },
      selectedSourceIds: ["paste"],
      searchQuery: "",
      pastedText: "First issue\n\n Second issue \nThird issue",
    })

    expect(result.sources).toHaveLength(1)
    expect(result.sources[0]).toMatchObject({
      sourceType: "pasted_text",
      sourceLabel: "Pasted Feedback",
      itemCount: 3,
    })
  })

  it("builds CSV review state from the uploaded file metadata and ignores disabled X Search", async () => {
    const { buildCustomReviewState } = await import("@/lib/services/analysis-service")

    const result = buildCustomReviewState({
      product: {
        name: "Acme PM",
        description: "Project planning tool",
      },
      selectedSourceIds: ["csv", "search"],
      searchQuery: "Acme PM",
      csvFileName: "feedback.csv",
      csvItemCount: 4,
    })

    expect(result.sources).toHaveLength(1)
    expect(result.sources[0]).toMatchObject({
      sourceType: "csv_upload",
      sourceLabel: "feedback.csv",
      itemCount: 4,
    })
  })

  it("ingests a demo source through the backend for a backend-created feedback set", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_BACKEND_DEMO", "true")
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test")

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        analysisTarget: { id: "target_123" },
        feedbackSet: { id: "set_456" },
      }), { status: 201, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        source: { id: "source_789", feedbackSetId: "set_456", itemCount: 750 },
      }), { status: 201, headers: { "Content-Type": "application/json" } }))
    vi.stubGlobal("fetch", fetchMock)

    const { createFeedbackSet, addDemoSource } = await import("@/lib/services/analysis-service")
    const { feedbackSet } = await createFeedbackSet({
      analysisTarget: { name: "Productivity Tool", description: "Demo product" },
      analysisGoal: "Full Product Feedback Synthesis",
    })
    const { source } = await addDemoSource({
      feedbackSetId: feedbackSet.id,
      demoProductId: "productivity",
    })

    expect(source.itemCount).toBe(750)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/feedback-sets/set_456/sources/demo",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ demoProductId: "productivity_tool" }),
      }),
    )
  })

  it("uses the backend for create feedback set, pasted source ingest, and synthesis when enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_BACKEND_DEMO", "true")
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test")

    const fetchMock = vi.fn()
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            analysisTarget: {
              id: "target_123",
              name: "Acme PM",
              description: "Project planning tool",
              createdAt: "2026-07-01T00:00:00Z",
            },
            feedbackSet: {
              id: "set_456",
              analysisTargetId: "target_123",
              name: null,
              analysisGoal: "Full Product Feedback Synthesis",
              status: "draft",
              totalFeedbackCount: 0,
              createdAt: "2026-07-01T00:00:00Z",
              updatedAt: "2026-07-01T00:00:00Z",
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            source: {
              id: "source_789",
              feedbackSetId: "set_456",
              sourceType: "pasted_text",
              sourceLabel: "Pasted Feedback",
              itemCount: 2,
              status: "ready",
              metadata: {
                source_origin: "pasted_text",
                parsing_strategy: "newline_split_v1",
              },
              createdAt: "2026-07-01T00:00:00Z",
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            analysisRun: {
              id: "run_123",
              feedbackSetId: "set_456",
              status: "completed",
              currentStep: "generate_dashboard",
              steps: [],
              startedAt: "2026-07-01T00:00:00Z",
              completedAt: "2026-07-01T00:00:00Z",
              errorMessage: null,
              metadata: {
                total_feedback_count: 2,
                source_count: 1,
              },
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      )

    vi.stubGlobal("fetch", fetchMock)

    const { createFeedbackSet, addPastedSource, synthesizeFeedbackSet } =
      await import("@/lib/services/analysis-service")

    const created = await createFeedbackSet({
      analysisTarget: {
        name: "Acme PM",
        description: "Project planning tool",
      },
      analysisGoal: "Full Product Feedback Synthesis",
    })
    expect(created.feedbackSet.id).toBe("set_456")

    const source = await addPastedSource({
      feedbackSetId: "set_456",
      pastedText: "First issue\nSecond issue",
    })
    expect(source.source.itemCount).toBe(2)

    const run = await synthesizeFeedbackSet({
      feedbackSetId: "set_456",
    })
    expect(run.analysisRun.id).toBe("run_123")

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/feedback-sets",
      expect.objectContaining({
        method: "POST",
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/feedback-sets/set_456/sources/pasted",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          pastedText: "First issue\nSecond issue",
          sourceLabel: undefined,
        }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.example.test/feedback-sets/set_456/synthesize",
      expect.objectContaining({
        method: "POST",
      }),
    )
  })

  it("uses the backend CSV endpoint and the returned backend analysis run id", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_BACKEND_DEMO", "true")
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test")

    const fetchMock = vi.fn()
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            source: {
              id: "source_csv_123",
              feedbackSetId: "set_456",
              sourceType: "csv_upload",
              sourceLabel: "CSV Upload",
              itemCount: 2,
              status: "ready",
              metadata: {
                source_origin: "csv_upload",
                file_name: "feedback.csv",
              },
              createdAt: "2026-07-01T00:00:00Z",
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            analysisRun: {
              id: "run_csv_123",
              feedbackSetId: "set_456",
              status: "completed",
              currentStep: "generate_dashboard",
              steps: [],
              startedAt: "2026-07-01T00:00:00Z",
              completedAt: "2026-07-01T00:00:00Z",
              errorMessage: null,
              metadata: {
                total_feedback_count: 2,
                source_count: 1,
              },
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            analysisRun: {
              id: "run_csv_123",
              feedbackSetId: "set_456",
              status: "completed",
              currentStep: "generate_dashboard",
              steps: [],
              startedAt: "2026-07-01T00:00:00Z",
              completedAt: "2026-07-01T00:00:00Z",
              errorMessage: null,
              metadata: {
                total_feedback_count: 2,
                source_count: 1,
              },
            },
            feedbackSet: {
              id: "set_456",
              analysisTargetId: "target_123",
              name: null,
              analysisGoal: "Full Product Feedback Synthesis",
              status: "completed",
              totalFeedbackCount: 2,
              createdAt: "2026-07-01T00:00:00Z",
              updatedAt: "2026-07-01T00:00:00Z",
            },
            analysisTarget: {
              id: "target_123",
              name: "Acme PM",
              description: "Project planning tool",
              createdAt: "2026-07-01T00:00:00Z",
            },
            sources: [
              {
                id: "source_csv_123",
                feedbackSetId: "set_456",
                sourceType: "csv_upload",
                sourceLabel: "CSV Upload",
                itemCount: 2,
                status: "ready",
                metadata: {
                  source_origin: "csv_upload",
                },
                createdAt: "2026-07-01T00:00:00Z",
              },
            ],
            dashboard: null,
            chatHistory: [],
            placeholderMessage: "Dashboard summary has not been generated yet.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )

    vi.stubGlobal("fetch", fetchMock)

    const { addCsvSource, synthesizeFeedbackSet, getAnalysisRunBundle } =
      await import("@/lib/services/analysis-service")

    const file = new File(
      ['feedback_text,rating\n"First issue",2\n"Second issue",4\n'],
      "feedback.csv",
      { type: "text/csv" },
    )

    const source = await addCsvSource({
      feedbackSetId: "set_456",
      file,
    })
    expect(source.source.itemCount).toBe(2)

    const synthesis = await synthesizeFeedbackSet({
      feedbackSetId: "set_456",
    })
    expect(synthesis.analysisRun.id).toBe("run_csv_123")

    const bundle = await getAnalysisRunBundle({
      analysisRunId: synthesis.analysisRun.id,
    })
    expect(bundle.analysisRun.id).toBe("run_csv_123")
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/feedback-sets/set_456/sources/csv",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.example.test/analysis-runs/run_csv_123/bundle",
      expect.objectContaining({
        cache: "no-store",
      }),
    )
  })

  it("fetches the dashboard bundle using the exact backend analysis run id returned by custom synthesize", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_BACKEND_DEMO", "true")
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test")

    const fetchMock = vi.fn()
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            analysisRun: {
              id: "run_backend_123",
              feedbackSetId: "set_456",
              status: "completed",
              currentStep: "generate_dashboard",
              steps: [],
              startedAt: "2026-07-01T00:00:00Z",
              completedAt: "2026-07-01T00:00:00Z",
              errorMessage: null,
              metadata: {
                total_feedback_count: 2,
                source_count: 1,
              },
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            analysisRun: {
              id: "run_backend_123",
              feedbackSetId: "set_456",
              status: "completed",
              currentStep: "generate_dashboard",
              steps: [],
              startedAt: "2026-07-01T00:00:00Z",
              completedAt: "2026-07-01T00:00:00Z",
              errorMessage: null,
              metadata: {
                total_feedback_count: 2,
                source_count: 1,
              },
            },
            feedbackSet: {
              id: "set_456",
              analysisTargetId: "target_123",
              name: null,
              analysisGoal: "Full Product Feedback Synthesis",
              status: "completed",
              totalFeedbackCount: 2,
              createdAt: "2026-07-01T00:00:00Z",
              updatedAt: "2026-07-01T00:00:00Z",
            },
            analysisTarget: {
              id: "target_123",
              name: "Acme PM",
              description: "Project planning tool",
              createdAt: "2026-07-01T00:00:00Z",
            },
            sources: [
              {
                id: "source_789",
                feedbackSetId: "set_456",
                sourceType: "pasted_text",
                sourceLabel: "Pasted Feedback",
                itemCount: 2,
                status: "ready",
                metadata: {
                  source_origin: "pasted_text",
                },
                createdAt: "2026-07-01T00:00:00Z",
              },
            ],
            dashboard: null,
            chatHistory: [],
            placeholderMessage: "Dashboard summary has not been generated yet.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )

    vi.stubGlobal("fetch", fetchMock)

    const { synthesizeFeedbackSet, getAnalysisRunBundle } = await import(
      "@/lib/services/analysis-service"
    )

    const synthesis = await synthesizeFeedbackSet({
      feedbackSetId: "set_456",
    })

    expect(synthesis.analysisRun.id).toBe("run_backend_123")

    const bundle = await getAnalysisRunBundle({
      analysisRunId: synthesis.analysisRun.id,
    })

    expect(bundle.analysisRun.id).toBe("run_backend_123")
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/analysis-runs/run_backend_123/bundle",
      expect.objectContaining({
        cache: "no-store",
      }),
    )
  })
})

import { describe, expect, it } from "vitest"

import { adaptBackendBundleToDashboard } from "@/lib/services/bundle-dashboard-adapter"
import { MOCK_DASHBOARD_PAYLOAD } from "@/lib/mocks/dashboard"
import type { GetAnalysisRunBundleResponse } from "@/lib/types/api"

function makeBundle(
  overrides: Partial<GetAnalysisRunBundleResponse> = {},
): GetAnalysisRunBundleResponse {
  const base: GetAnalysisRunBundleResponse = {
    analysisRun: {
      id: "run_123",
      feedbackSetId: "set_123",
      status: "completed",
      currentStep: "generate_dashboard",
      steps: [],
      startedAt: "2026-06-18T09:00:00Z",
      completedAt: "2026-06-18T09:05:00Z",
      errorMessage: null,
      metadata: {
        feedbackItemCount: 12,
        sourceCount: 2,
      },
    },
    feedbackSet: {
      id: "set_123",
      analysisTargetId: "target_123",
      name: "June Demo Run",
      analysisGoal: "Full Product Feedback Synthesis",
      status: "completed",
      totalFeedbackCount: 12,
      createdAt: "2026-06-18T08:55:00Z",
      updatedAt: "2026-06-18T09:05:00Z",
    },
    analysisTarget: {
      id: "target_123",
      name: "Pulse Fitness",
      description: "A fitness coaching app for guided routines.",
      createdAt: "2026-06-18T08:50:00Z",
    },
    sources: [
      {
        id: "source_demo",
        feedbackSetId: "set_123",
        sourceType: "demo_dataset",
        sourceLabel: "Pulse Fitness Demo Dataset",
        itemCount: 8,
        status: "ready",
        metadata: {},
        createdAt: "2026-06-18T08:56:00Z",
      },
      {
        id: "source_x",
        feedbackSetId: "set_123",
        sourceType: "x_search",
        sourceLabel: 'X Search: "pulse fitness"',
        itemCount: 4,
        status: "ready",
        metadata: {},
        createdAt: "2026-06-18T08:57:00Z",
      },
    ],
    dashboard: {
      ...MOCK_DASHBOARD_PAYLOAD,
      analysisContext: {
        ...MOCK_DASHBOARD_PAYLOAD.analysisContext,
        analysisRunId: "run_123",
        productName: "Outdated Product Name",
        productDescription: "Outdated product description.",
        goal: "Identify Top Pain Points",
        processingMethod: "Backend Placeholder Summary",
      },
      executiveSummary: "Backend-generated executive summary.",
      sentimentBreakdown: {
        overall: [{ label: "Positive", value: 50 }],
        bySource: [{ sourceLabel: "Pulse Fitness Demo Dataset", negativePercent: 30 }],
      },
      classificationSummary: [{ category: "ux_issue", count: 5, percent: 42 }],
      topThemes: [
        {
          id: "theme_1",
          rank: 1,
          name: "Notification overload",
          description: "Users are overwhelmed by alerts.",
          count: 5,
          percent: 42,
          sentiment: "Mostly negative",
          priority: "High",
          sourceCoverage: "Demo + X",
        },
      ],
      painPoints: [
        {
          title: "Too many notifications",
          summary: "Users mute the app because of noisy alerts.",
          evidenceCount: 5,
          impact: "Lower trust in notifications.",
          recommendedAction: "Add more granular controls.",
          representativeQuotes: [
            {
              text: "There are too many notifications.",
              sourceLabel: "Pulse Fitness Demo Dataset",
            },
          ],
        },
      ],
      featureRequests: [
        {
          request: "Notification controls",
          userNeed: "Reduce noise",
          supportingEvidence: "Demo + X",
          priority: "High",
        },
      ],
      roadmapRecommendations: [
        {
          phase: "Now",
          items: [{ title: "Tune notifications", rationale: "Highest pain point." }],
        },
      ],
      representativeQuotes: [
        {
          text: "Please let me tune alerts.",
          sourceLabel: "Pulse Fitness Demo Dataset",
          themeName: "Notification overload",
          category: "feature_request",
        },
      ],
      modelSignals: [{ label: "Signal", value: "Strong demo correlation" }],
      kpis: [
        { label: "Feedback items analyzed", value: "999" },
        { label: "Sources included", value: "999" },
        { label: "Major themes detected", value: "1" },
      ],
      sourceMix: [
        {
          sourceId: "ignored",
          sourceType: "csv_upload",
          label: "Should be ignored",
          count: 999,
          unit: "items",
          percent: 100,
        },
      ],
    },
    chatHistory: [
      {
        id: "chat_1",
        analysisRunId: "run_123",
        role: "user",
        question: "What should we prioritize?",
        answer: null,
        scope: "all",
        evidence: [],
        followUpSuggestions: [],
        createdAt: "2026-06-18T09:06:00Z",
      },
      {
        id: "chat_2",
        analysisRunId: "run_123",
        role: "assistant",
        question: null,
        answer: "Notification controls are the clearest first move.",
        scope: "all",
        evidence: [],
        followUpSuggestions: ["Show supporting quotes"],
        createdAt: "2026-06-18T09:06:05Z",
      },
    ],
    placeholderMessage: null,
    meta: {
      dataMode: "backend",
      analysisRunId: "run_123",
      feedbackSetId: "set_123",
    },
  }

  return {
    ...base,
    ...overrides,
    analysisRun: {
      ...base.analysisRun,
      ...(overrides.analysisRun ?? {}),
      metadata: {
        ...base.analysisRun.metadata,
        ...(overrides.analysisRun?.metadata ?? {}),
      },
    },
    feedbackSet: {
      ...base.feedbackSet,
      ...(overrides.feedbackSet ?? {}),
    },
    analysisTarget: {
      ...base.analysisTarget,
      ...(overrides.analysisTarget ?? {}),
    },
    dashboard:
      overrides.dashboard === undefined ? base.dashboard : overrides.dashboard,
    sources: overrides.sources ?? base.sources,
    chatHistory: overrides.chatHistory ?? base.chatHistory,
    meta: {
      ...base.meta,
      ...(overrides.meta ?? {}),
    },
  }
}

describe("adaptBackendBundleToDashboard", () => {
  it("prefers backend synthesis sections while deriving stable context from bundle entities", () => {
    const view = adaptBackendBundleToDashboard(makeBundle())

    expect(view.analysisTargetName).toBe("Pulse Fitness")
    expect(view.analysisGoal).toBe("Full Product Feedback Synthesis")
    expect(view.dashboard.executiveSummary).toBe("Backend-generated executive summary.")
    expect(view.dashboard.topThemes).toHaveLength(1)
    expect(view.dashboard.analysisContext.productName).toBe("Pulse Fitness")
    expect(view.dashboard.analysisContext.processingMethod).toBe(
      "Backend Placeholder Summary",
    )
  })

  it("builds a deterministic fallback dashboard when the backend payload is null", () => {
    const view = adaptBackendBundleToDashboard(makeBundle({ dashboard: null }))

    expect(view.dashboard.analysisContext.productName).toBe("Pulse Fitness")
    expect(view.dashboard.executiveSummary).toContain("Pulse Fitness has 12 feedback items")
    expect(view.dashboard.modelSignals[0].value).toBe("Backend demo bundle")
    expect(view.dashboard.topThemes).toEqual(MOCK_DASHBOARD_PAYLOAD.topThemes)
  })

  it("fills partial dashboard payload sections from deterministic fallbacks", () => {
    const view = adaptBackendBundleToDashboard(
      makeBundle({
        dashboard: {
          ...MOCK_DASHBOARD_PAYLOAD,
          analysisContext: {
            ...MOCK_DASHBOARD_PAYLOAD.analysisContext,
            processingMethod: "",
          },
          executiveSummary: "",
          sentimentBreakdown: {
            overall: [],
            bySource: [],
          },
          classificationSummary: [],
          topThemes: [],
          painPoints: [],
          featureRequests: [],
          roadmapRecommendations: [],
          representativeQuotes: [],
          modelSignals: [],
          kpis: [],
          sourceMix: [],
        },
      }),
    )

    expect(view.processingMethod).toBe(
      "Backend Demo Bundle + Placeholder Dashboard Synthesis",
    )
    expect(view.dashboard.sentimentBreakdown.bySource).toHaveLength(2)
    expect(view.dashboard.classificationSummary).toEqual(
      MOCK_DASHBOARD_PAYLOAD.classificationSummary,
    )
    expect(view.dashboard.representativeQuotes[0].sourceLabel).toBe(
      "Pulse Fitness Demo Dataset",
    )
  })

  it("derives a single-source mix from backend sources", () => {
    const bundle = makeBundle({
      sources: [
        {
          id: "source_demo",
          feedbackSetId: "set_123",
          sourceType: "demo_dataset",
          sourceLabel: "Pulse Fitness Demo Dataset",
          itemCount: 12,
          status: "ready",
          metadata: {},
          createdAt: "2026-06-18T08:56:00Z",
        },
      ],
      dashboard: null,
    })

    const view = adaptBackendBundleToDashboard(bundle)

    expect(view.sourceCount).toBe(1)
    expect(view.sourceTags).toEqual(["Demo Dataset"])
    expect(view.dashboard.sourceMix).toEqual([
      {
        sourceId: "source_demo",
        sourceType: "demo_dataset",
        label: "Pulse Fitness Demo Dataset",
        count: 12,
        unit: "items",
        percent: 100,
      },
    ])
  })

  it("keeps selected product metadata from the backend bundle instead of mock dashboard defaults", () => {
    const view = adaptBackendBundleToDashboard(
      makeBundle({
        analysisTarget: {
          id: "target_123",
          name: "CRM Tool",
          description:
            "Pipeline, reporting, and integration feedback from sales teams.",
          createdAt: "2026-06-18T08:50:00Z",
        },
        sources: [
          {
            id: "source_demo",
            feedbackSetId: "set_123",
            sourceType: "demo_dataset",
            sourceLabel: "CRM Tool Demo Dataset",
            itemCount: 12,
            status: "ready",
            metadata: {},
            createdAt: "2026-06-18T08:56:00Z",
          },
        ],
      }),
    )

    expect(view.analysisTargetName).toBe("CRM Tool")
    expect(view.dashboard.analysisContext.productName).toBe("CRM Tool")
    expect(view.dashboard.sourceMix).toEqual([
      {
        sourceId: "source_demo",
        sourceType: "demo_dataset",
        label: "CRM Tool Demo Dataset",
        count: 12,
        unit: "items",
        percent: 100,
      },
    ])
  })

  it("derives multi-source totals and source mix percentages from backend metadata and source rows", () => {
    const view = adaptBackendBundleToDashboard(makeBundle({ dashboard: null }))

    expect(view.totalFeedbackCount).toBe(12)
    expect(view.sourceCount).toBe(2)
    expect(view.dashboard.sourceMix).toEqual([
      {
        sourceId: "source_demo",
        sourceType: "demo_dataset",
        label: "Pulse Fitness Demo Dataset",
        count: 8,
        unit: "items",
        percent: 67,
      },
      {
        sourceId: "source_x",
        sourceType: "x_search",
        label: 'X Search: "pulse fitness"',
        count: 4,
        unit: "posts",
        percent: 33,
      },
    ])
  })

  it("seeds chat history and handles missing chat messages cleanly", () => {
    const withHistory = adaptBackendBundleToDashboard(makeBundle())
    const withoutHistory = adaptBackendBundleToDashboard(
      makeBundle({ chatHistory: [], dashboard: null }),
    )

    expect(withHistory.chatHistory).toEqual([
      {
        role: "user",
        content: "What should we prioritize?",
        scope: "All Sources",
      },
      {
        role: "assistant",
        content: "Notification controls are the clearest first move.",
        followUps: ["Show supporting quotes"],
      },
    ])
    expect(withoutHistory.chatHistory).toEqual([])
  })

  it("derives KPI totals from feedback set and source metadata instead of trusting payload KPI cards", () => {
    const view = adaptBackendBundleToDashboard(
      makeBundle({
        analysisRun: {
          id: "run_123",
          feedbackSetId: "set_123",
          status: "completed",
          currentStep: "generate_dashboard",
          steps: [],
          startedAt: "2026-06-18T09:00:00Z",
          completedAt: "2026-06-18T09:05:00Z",
          errorMessage: null,
          metadata: {
            feedbackItemCount: 20,
            sourceCount: 2,
          },
        },
        feedbackSet: {
          id: "set_123",
          analysisTargetId: "target_123",
          name: "June Demo Run",
          analysisGoal: "Full Product Feedback Synthesis",
          status: "completed",
          totalFeedbackCount: 18,
          createdAt: "2026-06-18T08:55:00Z",
          updatedAt: "2026-06-18T09:05:00Z",
        },
        dashboard: null,
      }),
    )

    expect(view.totalFeedbackCount).toBe(20)
    expect(view.dashboard.kpis[0]).toEqual({
      label: "Feedback items analyzed",
      value: "20",
    })
    expect(view.dashboard.kpis[1]).toEqual({
      label: "Sources included",
      value: "2",
    })
    expect(view.dashboard.kpis.some((kpi) => kpi.label === "Run status")).toBe(true)
  })

  it("does not backfill hidden sections for a narrowed analysis goal", () => {
    const view = adaptBackendBundleToDashboard(
      makeBundle({
        feedbackSet: {
          id: "set_123",
          analysisTargetId: "target_123",
          name: "June Demo Run",
          analysisGoal: "Prioritize Roadmap Opportunities",
          status: "completed",
          totalFeedbackCount: 12,
          createdAt: "2026-06-18T08:55:00Z",
          updatedAt: "2026-06-18T09:05:00Z",
        },
        dashboard: {
          ...MOCK_DASHBOARD_PAYLOAD,
          analysisContext: {
            ...MOCK_DASHBOARD_PAYLOAD.analysisContext,
            goal: "Prioritize Roadmap Opportunities",
          },
          sentimentBreakdown: {
            overall: [],
            bySource: [],
          },
          painPoints: [],
          featureRequests: [
            {
              request: "Notification controls",
              userNeed: "Reduce noise",
              supportingEvidence: "Demo + X",
              priority: "High",
            },
          ],
          roadmapRecommendations: [
            {
              phase: "Now",
              items: [{ title: "Tune notifications", rationale: "Highest pain point." }],
            },
          ],
        },
      }),
    )

    expect(view.dashboard.analysisContext.goal).toBe(
      "Prioritize Roadmap Opportunities",
    )
    expect(view.dashboard.featureRequests).toHaveLength(1)
    expect(view.dashboard.roadmapRecommendations).toHaveLength(1)
    expect(view.dashboard.painPoints).toEqual([])
    expect(view.dashboard.sentimentBreakdown.overall).toEqual([])
  })

  it("preserves the full dashboard for full product feedback synthesis", () => {
    const view = adaptBackendBundleToDashboard(makeBundle())

    expect(view.dashboard.analysisContext.goal).toBe(
      "Full Product Feedback Synthesis",
    )
    expect(view.dashboard.sentimentBreakdown.overall.length).toBeGreaterThan(0)
    expect(view.dashboard.painPoints.length).toBeGreaterThan(0)
    expect(view.dashboard.featureRequests.length).toBeGreaterThan(0)
    expect(view.dashboard.roadmapRecommendations.length).toBeGreaterThan(0)
  })
})

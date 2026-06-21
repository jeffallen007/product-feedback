import type { DashboardPayload, AnalysisGoal } from "@/lib/types/contracts"

type DashboardSectionKey =
  | "sentimentBreakdown"
  | "classificationSummary"
  | "topThemes"
  | "painPoints"
  | "featureRequests"
  | "roadmapRecommendations"
  | "representativeQuotes"
  | "modelSignals"

const FULL_GOAL: AnalysisGoal = "Full Product Feedback Synthesis"

const GOAL_SECTION_MAP: Record<AnalysisGoal, DashboardSectionKey[]> = {
  "Full Product Feedback Synthesis": [
    "sentimentBreakdown",
    "classificationSummary",
    "topThemes",
    "painPoints",
    "featureRequests",
    "roadmapRecommendations",
    "representativeQuotes",
    "modelSignals",
  ],
  "Identify Top Pain Points": [
    "topThemes",
    "painPoints",
    "representativeQuotes",
    "modelSignals",
  ],
  "Find Feature Requests": [
    "topThemes",
    "featureRequests",
    "representativeQuotes",
    "modelSignals",
  ],
  "Prioritize Roadmap Opportunities": [
    "topThemes",
    "featureRequests",
    "roadmapRecommendations",
    "representativeQuotes",
    "modelSignals",
  ],
  "Summarize Sentiment": [
    "sentimentBreakdown",
    "topThemes",
    "representativeQuotes",
    "modelSignals",
  ],
  "Identify Churn / Retention Risks": [
    "classificationSummary",
    "topThemes",
    "painPoints",
    "roadmapRecommendations",
    "representativeQuotes",
    "modelSignals",
  ],
  "Generate Product Strategy Recommendations": [
    "topThemes",
    "featureRequests",
    "roadmapRecommendations",
    "representativeQuotes",
    "modelSignals",
  ],
}

function includesSection(
  goal: AnalysisGoal,
  section: DashboardSectionKey,
): boolean {
  return GOAL_SECTION_MAP[goal].includes(section)
}

export function composeDashboardForGoal(
  dashboard: DashboardPayload,
): DashboardPayload {
  const goal = dashboard.analysisContext.goal
  if (goal === FULL_GOAL) {
    return dashboard
  }

  return {
    ...dashboard,
    sentimentBreakdown: includesSection(goal, "sentimentBreakdown")
      ? dashboard.sentimentBreakdown
      : { overall: [], bySource: [] },
    classificationSummary: includesSection(goal, "classificationSummary")
      ? dashboard.classificationSummary
      : [],
    topThemes: includesSection(goal, "topThemes") ? dashboard.topThemes : [],
    painPoints: includesSection(goal, "painPoints") ? dashboard.painPoints : [],
    featureRequests: includesSection(goal, "featureRequests")
      ? dashboard.featureRequests
      : [],
    roadmapRecommendations: includesSection(goal, "roadmapRecommendations")
      ? dashboard.roadmapRecommendations
      : [],
    representativeQuotes: includesSection(goal, "representativeQuotes")
      ? dashboard.representativeQuotes
      : [],
    modelSignals: includesSection(goal, "modelSignals")
      ? dashboard.modelSignals
      : [],
  }
}

export function getVisibleDashboardSections(
  dashboard: DashboardPayload,
): DashboardSectionKey[] {
  return GOAL_SECTION_MAP[dashboard.analysisContext.goal]
}

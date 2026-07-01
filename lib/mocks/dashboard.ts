import type {
  AnalysisRun,
  AnalysisRunStep,
  ChatRequest,
  ChatResponse,
  DashboardPayload,
  SourceType,
} from "@/lib/types/contracts"

export type AnalysisSourceKey = "all" | "demo" | "x" | "pasted" | "csv"

export interface DashboardSourceTab {
  key: AnalysisSourceKey
  label: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  followUps?: string[]
  scope?: string
}

export interface CannedChatResponse {
  match: string
  response: ChatResponse
}

export interface ScopeOption {
  value: ChatRequest["scope"]
  label: string
}

export const MOCK_DASHBOARD_PAYLOAD: DashboardPayload = {
  analysisContext: {
    analysisRunId: "run_productivity_demo_01",
    productName: "Productivity Tool",
    productDescription:
      "A B2B productivity platform for managing projects, tasks, notifications, dashboards, and cross-functional workflows.",
    goal: "Full Product Feedback Synthesis",
    processingMethod: "MCP Tool Workflow + ML Classifier + LLM Synthesis",
    sourceCount: 3,
    feedbackItemCount: 592,
    lastRunAt: "Today, 1:42 PM",
  },
  sourceMix: [
    {
      sourceId: "source_demo_productivity",
      sourceType: "demo_dataset",
      label: "Demo Dataset",
      count: 482,
      unit: "items",
      percent: 81,
    },
    {
      sourceId: "source_x_search",
      sourceType: "x_search",
      label: "X Search",
      count: 86,
      unit: "posts",
      percent: 15,
    },
    {
      sourceId: "source_pasted_reviews",
      sourceType: "pasted_text",
      label: "Pasted Feedback",
      count: 24,
      unit: "items",
      percent: 4,
    },
  ],
  kpis: [
    { label: "Feedback items analyzed", value: "592" },
    { label: "Sources included", value: "3" },
    { label: "Major themes detected", value: "6" },
    { label: "Negative sentiment", value: "38%" },
    { label: "High-priority opportunities", value: "3" },
  ],
  executiveSummary:
    "Feedback across the combined source set shows strong product value but recurring friction around notification overload, workflow setup complexity, and limited dashboard flexibility. X feedback is more negative and concentrated around notification fatigue, while the demo dataset shows broader workflow and collaboration issues. The highest-priority opportunity is to improve notification controls and reduce setup complexity for new team workflows. The product team should investigate notification preferences, workflow templates, and dashboard customization as near-term roadmap candidates.",
  sentimentBreakdown: {
    overall: [
      { label: "Positive", value: 34 },
      { label: "Neutral", value: 28 },
      { label: "Negative", value: 38 },
    ],
    bySource: [
      { sourceLabel: "Demo Dataset", negativePercent: 31 },
      { sourceLabel: "X Search", negativePercent: 54 },
      { sourceLabel: "Pasted Feedback", negativePercent: 42 },
    ],
  },
  classificationSummary: [
    { category: "ux_issue", count: 142, percent: 24 },
    { category: "feature_request", count: 121, percent: 20 },
    { category: "performance_issue", count: 63, percent: 11 },
    { category: "churn_risk", count: 47, percent: 8 },
  ],
  topThemes: [
    {
      id: "theme_notification_overload",
      rank: 1,
      name: "Notification overload",
      description:
        "Users feel overwhelmed by frequent, low-signal notifications and struggle to surface what matters.",
      count: 142,
      percent: 24,
      sentiment: "Mostly negative",
      priority: "High",
      sourceCoverage: "Mostly X + Demo",
    },
    {
      id: "theme_workflow_setup",
      rank: 2,
      name: "Workflow setup complexity",
      description:
        "Configuring new team workflows is time-consuming and requires too much manual setup.",
      count: 117,
      percent: 20,
      sentiment: "Mostly negative",
      priority: "High",
      sourceCoverage: "Mostly Demo",
    },
    {
      id: "theme_dashboard_customization",
      rank: 3,
      name: "Dashboard customization requests",
      description:
        "Teams want more control over dashboard layout, widgets, and reporting views.",
      count: 91,
      percent: 15,
      sentiment: "Mixed",
      priority: "High",
      sourceCoverage: "Demo + Pasted",
    },
    {
      id: "theme_mobile_performance",
      rank: 4,
      name: "Mobile app performance",
      description:
        "Slow load times and sync delays reduce reliability for distributed teams on mobile.",
      count: 63,
      percent: 11,
      sentiment: "Mostly negative",
      priority: "Medium",
      sourceCoverage: "X + Pasted",
    },
    {
      id: "theme_template_discoverability",
      rank: 5,
      name: "Template discoverability",
      description:
        "Users have trouble finding relevant templates to accelerate project setup.",
      count: 58,
      percent: 10,
      sentiment: "Mixed",
      priority: "Medium",
      sourceCoverage: "Mostly Demo",
    },
    {
      id: "theme_collaboration_friction",
      rank: 6,
      name: "Cross-team collaboration friction",
      description:
        "Coordinating work across teams is hampered by permissions and visibility gaps.",
      count: 47,
      percent: 8,
      sentiment: "Mixed",
      priority: "Medium",
      sourceCoverage: "Demo + Pasted",
    },
  ],
  painPoints: [
    {
      title: "Too many notifications",
      summary:
        "Notification volume drowns out important updates, leading users to mute the app entirely.",
      evidenceCount: 142,
      impact: "Reduced engagement and risk of missing critical workflow events.",
      recommendedAction:
        "Ship granular notification controls and smarter default settings.",
      representativeQuotes: [
        {
          text: "Every project update turns into another notification. I end up muting the app and missing the important stuff.",
          sourceLabel: "X Search",
        },
      ],
    },
    {
      title: "Workflows are hard to configure",
      summary:
        "Teams spend significant time manually building workflows before seeing value.",
      evidenceCount: 117,
      impact: "Slower onboarding and delayed time-to-value for new teams.",
      recommendedAction:
        "Introduce guided workflow templates for common team setups.",
      representativeQuotes: [
        {
          text: "Setting up our first project workflow took an entire afternoon. There should be a faster starting point.",
          sourceLabel: "Demo Dataset",
        },
      ],
    },
    {
      title: "Dashboards are not flexible enough",
      summary:
        "Users want to personalize reporting but are limited to fixed dashboard layouts.",
      evidenceCount: 91,
      impact: "Lower perceived value for teams with specialized reporting needs.",
      recommendedAction:
        "Add customizable dashboard widgets and saved layouts.",
      representativeQuotes: [
        {
          text: "I wish I could rearrange widgets and build a dashboard that matches how my team actually reports.",
          sourceLabel: "Pasted Feedback",
        },
      ],
    },
  ],
  featureRequests: [
    {
      request: "Granular notification controls",
      userNeed: "Reduce alert fatigue",
      supportingEvidence: "X + Demo",
      priority: "High",
    },
    {
      request: "Guided workflow templates",
      userNeed: "Help teams set up faster",
      supportingEvidence: "Demo",
      priority: "High",
    },
    {
      request: "Custom dashboard widgets",
      userNeed: "Let teams personalize reporting",
      supportingEvidence: "Demo + Pasted",
      priority: "High",
    },
    {
      request: "Better mobile sync",
      userNeed: "Improve reliability for distributed teams",
      supportingEvidence: "X + Pasted",
      priority: "Medium",
    },
    {
      request: "Saved project views",
      userNeed: "Reduce repeated filtering work",
      supportingEvidence: "Pasted",
      priority: "Medium",
    },
  ],
  roadmapRecommendations: [
    {
      phase: "Now",
      items: [
        {
          title: "Add granular notification controls",
          rationale:
            "Highest-volume and highest-negativity issue across multiple sources.",
        },
        {
          title: "Improve workflow setup templates",
          rationale:
            "Strong driver of onboarding friction and delayed time-to-value.",
        },
      ],
    },
    {
      phase: "Next",
      items: [
        {
          title: "Add customizable dashboard widgets",
          rationale:
            "High-value request with cross-source signal from teams wanting tailored reporting.",
        },
        {
          title: "Improve mobile sync reliability",
          rationale:
            "Mobile frustration is concentrated but intense, especially in recent X feedback.",
        },
      ],
    },
    {
      phase: "Later",
      items: [
        {
          title: "Add advanced saved views",
          rationale: "Helpful for repeated filtering and team-specific workflows.",
        },
        {
          title: "Expand cross-team reporting features",
          rationale:
            "Supports longer-term collaboration improvements after core friction is reduced.",
        },
      ],
    },
  ],
  representativeQuotes: [
    {
      text: "Every project update turns into another notification. I end up muting the app and missing the important stuff.",
      sourceLabel: "X Search",
      themeName: "Notification overload",
      category: "ux_issue",
    },
    {
      text: "Setting up our first project workflow took an entire afternoon. There should be a faster starting point.",
      sourceLabel: "Demo Dataset",
      themeName: "Workflow setup complexity",
      category: "onboarding_friction",
    },
    {
      text: "I wish I could rearrange widgets and build a dashboard that matches how my team actually reports.",
      sourceLabel: "Pasted Feedback",
      themeName: "Dashboard customization requests",
      category: "feature_request",
    },
    {
      text: "The mobile app lags every morning when everyone syncs. It makes standups painful.",
      sourceLabel: "X Search",
      themeName: "Mobile app performance",
      category: "performance_issue",
    },
    {
      text: "Great tool overall, but finding the right template for a new initiative is mostly guesswork.",
      sourceLabel: "Demo Dataset",
      themeName: "Template discoverability",
      category: "ux_issue",
    },
    {
      text: "Sharing work across teams always hits a permissions wall. We waste time chasing access.",
      sourceLabel: "Pasted Feedback",
      themeName: "Cross-team collaboration friction",
      category: "support_complaint",
    },
  ],
  modelSignals: [
    {
      label: "ML Categories Detected",
      value: "UX issue, feature request, performance issue, churn risk",
    },
    {
      label: "Sentiment Distribution",
      value: "34% positive, 28% neutral, 38% negative",
    },
    {
      label: "Churn Risk Signals",
      value: "47 high-risk comments",
    },
    {
      label: "Evidence Quotes Retrieved",
      value: "18 representative quotes",
    },
  ],
}

export const DASHBOARD_SOURCE_TABS: DashboardSourceTab[] = [
  { key: "all", label: "All Sources" },
  { key: "demo", label: "Demo Dataset" },
  { key: "x", label: "X Search" },
  { key: "pasted", label: "Pasted Feedback" },
  { key: "csv", label: "CSV Upload" },
]

export const PROCESSING_STEPS: string[] = [
  "Creating feedback set",
  "Ingesting sources",
  "Normalizing feedback",
  "Merging and deduplicating items",
  "Running ML classification",
  "Detecting sentiment and themes",
  "Retrieving representative quotes",
  "Generating dashboard",
]

export const MOCK_ANALYSIS_RUN: AnalysisRun = {
  id: "run_productivity_demo_01",
  feedbackSetId: "feedback_set_productivity_demo_01",
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
  startedAt: "2026-06-17T13:41:00.000Z",
  completedAt: "2026-06-17T13:42:00.000Z",
  errorMessage: null,
  metadata: {},
}

export const DASHBOARD_SOURCE_FILTER_TO_TYPE: Record<
  Exclude<AnalysisSourceKey, "all">,
  SourceType
> = {
  demo: "demo_dataset",
  x: "x_search",
  pasted: "pasted_text",
  csv: "csv_upload",
}

export const DASHBOARD_ALERTS = {
  xRateLimited:
    "the X Search source was recently rate limited. Results reflect the last successful pull of 86 posts.",
} as const

export const CHAT_SCOPE_OPTIONS: ScopeOption[] = [
  { value: "all", label: "All Sources" },
  { value: "review", label: "Google Play" },
  { value: "demo_dataset", label: "Demo Dataset" },
  { value: "x_search", label: "X Search" },
  { value: "pasted_text", label: "Pasted Feedback" },
]

export const SUGGESTED_PROMPTS = [
  "What should we prioritize first?",
  "Compare X feedback to the demo dataset.",
  "Which issues appear across all sources?",
  "Only answer using pasted reviews.",
  "Show evidence for notification overload.",
  "Which issues suggest churn risk?",
  "Turn this into a roadmap memo.",
] as const

export const CANNED_CHAT_RESPONSES: CannedChatResponse[] = [
  {
    match: "prioritize first",
    response: {
      answer:
        "The strongest first priority is notification overload. It appears across multiple sources, has the highest volume of negative feedback, and is especially concentrated in recent X posts. I would prioritize granular notification controls and smarter default settings before broader dashboard customization.",
      scopeUsed: "all",
      evidence: [
        {
          feedbackItemId: "feedback_x_001",
          text: "Every project update turns into another notification. I end up muting the app and missing the important stuff.",
          sourceLabel: "X Search",
          themeName: "Notification overload",
          category: "ux_issue",
        },
      ],
      followUpSuggestions: ["Show supporting quotes"],
    },
  },
  {
    match: "compare x",
    response: {
      answer:
        "X feedback is more negative and more concentrated around immediate frustration, especially notification fatigue and mobile performance. The demo dataset is broader and points to structural workflow issues like setup complexity, template discoverability, and collaboration friction.",
      scopeUsed: "all",
      evidence: [],
      followUpSuggestions: [],
    },
  },
  {
    match: "across all sources",
    response: {
      answer:
        "Three issues recur across every source: notification overload, workflow setup complexity, and dashboard customization requests. Notification overload has the widest reach, surfacing strongly in both X posts and the demo dataset, with supporting mentions in pasted reviews.",
      scopeUsed: "all",
      evidence: [],
      followUpSuggestions: [],
    },
  },
  {
    match: "pasted reviews",
    response: {
      answer:
        "Scoped to pasted reviews only (24 items): the dominant signals are dashboard flexibility and saved project views, with a secondary thread around cross-team collaboration friction. Notification complaints exist but are less intense here than in X feedback.",
      scopeUsed: "pasted_text",
      evidence: [],
      followUpSuggestions: [],
    },
  },
  {
    match: "notification overload",
    response: {
      answer:
        "Evidence for notification overload (142 items, mostly X + Demo):\n\n• \"Every project update turns into another notification. I end up muting the app and missing the important stuff.\" — X Search\n• \"I get pinged for things I do not care about and miss the ones I do.\" — Demo Dataset\n• \"Notification settings are all-or-nothing. We need middle ground.\" — Pasted Feedback",
      scopeUsed: "all",
      evidence: [
        {
          feedbackItemId: "feedback_x_001",
          text: "Every project update turns into another notification. I end up muting the app and missing the important stuff.",
          sourceLabel: "X Search",
          themeName: "Notification overload",
          category: "ux_issue",
        },
      ],
      followUpSuggestions: [],
    },
  },
  {
    match: "churn risk",
    response: {
      answer:
        "47 comments carry churn-risk language. The clearest drivers are notification fatigue (\"thinking of switching tools\") and mobile performance issues during peak sync. Workflow setup complexity also appears in churn-adjacent feedback from newer teams still in onboarding.",
      scopeUsed: "all",
      evidence: [],
      followUpSuggestions: [],
    },
  },
  {
    match: "roadmap memo",
    response: {
      answer:
        "Roadmap memo — Productivity Tool\n\nNow: Ship granular notification controls and improved workflow setup templates to address the two highest-volume, highest-negativity themes.\n\nNext: Add customizable dashboard widgets and improve mobile sync reliability.\n\nLater: Advanced saved views and expanded cross-team reporting.\n\nRationale: Notification overload and setup complexity dominate negative sentiment across sources; addressing them first should lift retention and onboarding success.",
      scopeUsed: "all",
      evidence: [],
      followUpSuggestions: [],
    },
  },
  {
    match: "supporting quotes",
    response: {
      answer:
        "Supporting quotes for notification overload:\n\n• \"Every project update turns into another notification.\" — X Search\n• \"I end up muting the app and missing the important stuff.\" — X Search\n• \"Notification settings are all-or-nothing.\" — Pasted Feedback",
      scopeUsed: "all",
      evidence: [],
      followUpSuggestions: [],
    },
  },
]

export const DEFAULT_CHAT_RESPONSE: ChatResponse = {
  answer:
    "Based on the combined feedback set, the recurring themes are notification overload, workflow setup complexity, and dashboard flexibility. Ask about a specific theme, source comparison, churn risk, or request a roadmap memo and I'll synthesize an answer from the analyzed feedback.",
  scopeUsed: "all",
  evidence: [],
  followUpSuggestions: [],
}

function step(name: AnalysisRunStep["name"]): AnalysisRunStep {
  return {
    name,
    status: "completed",
    startedAt: "2026-06-17T13:41:00.000Z",
    completedAt: "2026-06-17T13:42:00.000Z",
    errorMessage: null,
  }
}

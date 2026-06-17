import {
  type LucideIcon,
  MessageSquare,
  Settings2,
  LayoutDashboard,
  Smartphone,
  Search as SearchIcon,
  Users2,
} from "lucide-react"

export type AnalysisSourceKey =
  | "all"
  | "demo"
  | "x"
  | "pasted"
  | "csv"

export type SourceTag = "Demo Dataset" | "X Search" | "Pasted Feedback" | "CSV Upload"

export const ANALYSIS_META = {
  productName: "Productivity Tool",
  productDescription:
    "A B2B productivity platform for managing projects, tasks, notifications, dashboards, and cross-functional workflows.",
  sourcesIncluded: 3,
  feedbackItems: 592,
  lastRun: "Today, 1:42 PM",
  processingMethod: "MCP Tool Workflow + ML Classifier + LLM Synthesis",
  goal: "Full Product Feedback Synthesis",
}

export const SOURCE_MIX: {
  key: AnalysisSourceKey
  label: SourceTag
  count: number
  unit: string
  percent: number
}[] = [
  { key: "demo", label: "Demo Dataset", count: 482, unit: "items", percent: 81 },
  { key: "x", label: "X Search", count: 86, unit: "posts", percent: 15 },
  { key: "pasted", label: "Pasted Feedback", count: 24, unit: "items", percent: 4 },
]

export const SOURCE_TABS: { key: AnalysisSourceKey; label: string }[] = [
  { key: "all", label: "All Sources" },
  { key: "demo", label: "Demo Dataset" },
  { key: "x", label: "X Search" },
  { key: "pasted", label: "Pasted Feedback" },
  { key: "csv", label: "CSV Upload" },
]

export const KPIS = [
  { label: "Feedback items analyzed", value: "592" },
  { label: "Sources included", value: "3" },
  { label: "Major themes detected", value: "6" },
  { label: "Negative sentiment", value: "38%" },
  { label: "High-priority opportunities", value: "3" },
]

export const EXECUTIVE_SUMMARY =
  "Feedback across the combined source set shows strong product value but recurring friction around notification overload, workflow setup complexity, and limited dashboard flexibility. X feedback is more negative and concentrated around notification fatigue, while the demo dataset shows broader workflow and collaboration issues. The highest-priority opportunity is to improve notification controls and reduce setup complexity for new team workflows. The product team should investigate notification preferences, workflow templates, and dashboard customization as near-term roadmap candidates."

export const SENTIMENT_OVERALL = [
  { name: "Positive", value: 34, key: "positive" },
  { name: "Neutral", value: 28, key: "neutral" },
  { name: "Negative", value: 38, key: "negative" },
]

export const SENTIMENT_BY_SOURCE = [
  { source: "Demo Dataset", negative: 31 },
  { source: "X Search", negative: 54 },
  { source: "Pasted Feedback", negative: 42 },
]

export type Theme = {
  rank: number
  name: string
  count: number
  priority: "High" | "Medium"
  sources: string
  sentiment: "Mostly negative" | "Mixed"
  description: string
}

export const THEMES: Theme[] = [
  {
    rank: 1,
    name: "Notification overload",
    count: 142,
    priority: "High",
    sources: "Mostly X + Demo",
    sentiment: "Mostly negative",
    description:
      "Users feel overwhelmed by frequent, low-signal notifications and struggle to surface what matters.",
  },
  {
    rank: 2,
    name: "Workflow setup complexity",
    count: 117,
    priority: "High",
    sources: "Mostly Demo",
    sentiment: "Mostly negative",
    description:
      "Configuring new team workflows is time-consuming and requires too much manual setup.",
  },
  {
    rank: 3,
    name: "Dashboard customization requests",
    count: 91,
    priority: "High",
    sources: "Demo + Pasted",
    sentiment: "Mixed",
    description:
      "Teams want more control over dashboard layout, widgets, and reporting views.",
  },
  {
    rank: 4,
    name: "Mobile app performance",
    count: 63,
    priority: "Medium",
    sources: "X + Pasted",
    sentiment: "Mostly negative",
    description:
      "Slow load times and sync delays reduce reliability for distributed teams on mobile.",
  },
  {
    rank: 5,
    name: "Template discoverability",
    count: 58,
    priority: "Medium",
    sources: "Mostly Demo",
    sentiment: "Mixed",
    description:
      "Users have trouble finding relevant templates to accelerate project setup.",
  },
  {
    rank: 6,
    name: "Cross-team collaboration friction",
    count: 47,
    priority: "Medium",
    sources: "Demo + Pasted",
    sentiment: "Mixed",
    description:
      "Coordinating work across teams is hampered by permissions and visibility gaps.",
  },
]

export type PainPoint = {
  icon: LucideIcon
  title: string
  saying: string
  impact: string
  quote: string
  source: SourceTag
  action: string
}

export const PAIN_POINTS: PainPoint[] = [
  {
    icon: MessageSquare,
    title: "Too many notifications",
    saying:
      "Notification volume drowns out important updates, leading users to mute the app entirely.",
    impact: "Reduced engagement and risk of missing critical workflow events.",
    quote:
      "Every project update turns into another notification. I end up muting the app and missing the important stuff.",
    source: "X Search",
    action: "Ship granular notification controls and smarter default settings.",
  },
  {
    icon: Settings2,
    title: "Workflows are hard to configure",
    saying:
      "Teams spend significant time manually building workflows before seeing value.",
    impact: "Slower onboarding and delayed time-to-value for new teams.",
    quote:
      "Setting up our first project workflow took an entire afternoon. There should be a faster starting point.",
    source: "Demo Dataset",
    action: "Introduce guided workflow templates for common team setups.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboards are not flexible enough",
    saying:
      "Users want to personalize reporting but are limited to fixed dashboard layouts.",
    impact: "Lower perceived value for teams with specialized reporting needs.",
    quote:
      "I wish I could rearrange widgets and build a dashboard that matches how my team actually reports.",
    source: "Pasted Feedback",
    action: "Add customizable dashboard widgets and saved layouts.",
  },
]

export type FeatureRequest = {
  request: string
  need: string
  signal: string
  priority: "High" | "Medium"
}

export const FEATURE_REQUESTS: FeatureRequest[] = [
  {
    request: "Granular notification controls",
    need: "Reduce alert fatigue",
    signal: "X + Demo",
    priority: "High",
  },
  {
    request: "Guided workflow templates",
    need: "Help teams set up faster",
    signal: "Demo",
    priority: "High",
  },
  {
    request: "Custom dashboard widgets",
    need: "Let teams personalize reporting",
    signal: "Demo + Pasted",
    priority: "High",
  },
  {
    request: "Better mobile sync",
    need: "Improve reliability for distributed teams",
    signal: "X + Pasted",
    priority: "Medium",
  },
  {
    request: "Saved project views",
    need: "Reduce repeated filtering work",
    signal: "Pasted",
    priority: "Medium",
  },
]

export const ROADMAP: { phase: "Now" | "Next" | "Later"; items: string[] }[] = [
  {
    phase: "Now",
    items: [
      "Add granular notification controls",
      "Improve workflow setup templates",
    ],
  },
  {
    phase: "Next",
    items: [
      "Add customizable dashboard widgets",
      "Improve mobile sync reliability",
    ],
  },
  {
    phase: "Later",
    items: ["Add advanced saved views", "Expand cross-team reporting features"],
  },
]

export type Quote = {
  text: string
  source: SourceTag
  theme: string
}

export const QUOTES: Quote[] = [
  {
    text: "Every project update turns into another notification. I end up muting the app and missing the important stuff.",
    source: "X Search",
    theme: "Notification overload",
  },
  {
    text: "Setting up our first project workflow took an entire afternoon. There should be a faster starting point.",
    source: "Demo Dataset",
    theme: "Workflow setup complexity",
  },
  {
    text: "I wish I could rearrange widgets and build a dashboard that matches how my team actually reports.",
    source: "Pasted Feedback",
    theme: "Dashboard customization",
  },
  {
    text: "The mobile app lags every morning when everyone syncs. It makes standups painful.",
    source: "X Search",
    theme: "Mobile app performance",
  },
  {
    text: "Great tool overall, but finding the right template for a new initiative is mostly guesswork.",
    source: "Demo Dataset",
    theme: "Template discoverability",
  },
  {
    text: "Sharing work across teams always hits a permissions wall. We waste time chasing access.",
    source: "Pasted Feedback",
    theme: "Cross-team collaboration",
  },
]

export const MODEL_SIGNALS = [
  {
    icon: SearchIcon,
    label: "ML Categories Detected",
    value: "UX issue, feature request, performance issue, churn risk",
  },
  {
    icon: Users2,
    label: "Sentiment Distribution",
    value: "34% positive, 28% neutral, 38% negative",
  },
  {
    icon: Smartphone,
    label: "Churn Risk Signals",
    value: "47 high-risk comments",
  },
  {
    icon: MessageSquare,
    label: "Evidence Quotes Retrieved",
    value: "18 representative quotes",
  },
]

export const PROCESSING_STEPS = [
  "Creating feedback set",
  "Ingesting sources",
  "Normalizing feedback",
  "Merging and deduplicating items",
  "Running ML classification",
  "Detecting sentiment and themes",
  "Retrieving representative quotes",
  "Generating dashboard",
]

export const SUGGESTED_PROMPTS = [
  "What should we prioritize first?",
  "Compare X feedback to the demo dataset.",
  "Which issues appear across all sources?",
  "Only answer using pasted reviews.",
  "Show evidence for notification overload.",
  "Which issues suggest churn risk?",
  "Turn this into a roadmap memo.",
]

export type ChatMessage = {
  role: "user" | "assistant"
  content: string
  followUps?: string[]
  scope?: string
}

export const SCOPE_OPTIONS = [
  "All Sources",
  "Demo Dataset",
  "X Search",
  "Pasted Feedback",
]

// Canned answers keyed by normalized prompt for the source-aware mock chatbot.
export const CANNED_ANSWERS: { match: string; answer: ChatMessage }[] = [
  {
    match: "prioritize first",
    answer: {
      role: "assistant",
      content:
        "The strongest first priority is notification overload. It appears across multiple sources, has the highest volume of negative feedback, and is especially concentrated in recent X posts. I would prioritize granular notification controls and smarter default settings before broader dashboard customization.",
      followUps: ["Show supporting quotes"],
    },
  },
  {
    match: "compare x",
    answer: {
      role: "assistant",
      content:
        "X feedback is more negative and more concentrated around immediate frustration, especially notification fatigue and mobile performance. The demo dataset is broader and points to structural workflow issues like setup complexity, template discoverability, and collaboration friction.",
    },
  },
  {
    match: "across all sources",
    answer: {
      role: "assistant",
      content:
        "Three issues recur across every source: notification overload, workflow setup complexity, and dashboard customization requests. Notification overload has the widest reach, surfacing strongly in both X posts and the demo dataset, with supporting mentions in pasted reviews.",
    },
  },
  {
    match: "pasted reviews",
    answer: {
      role: "assistant",
      content:
        "Scoped to pasted reviews only (24 items): the dominant signals are dashboard flexibility and saved project views, with a secondary thread around cross-team collaboration friction. Notification complaints exist but are less intense here than in X feedback.",
      scope: "Pasted Feedback",
    },
  },
  {
    match: "notification overload",
    answer: {
      role: "assistant",
      content:
        "Evidence for notification overload (142 items, mostly X + Demo):\n\n• \"Every project update turns into another notification. I end up muting the app and missing the important stuff.\" — X Search\n• \"I get pinged for things I do not care about and miss the ones I do.\" — Demo Dataset\n• \"Notification settings are all-or-nothing. We need middle ground.\" — Pasted Feedback",
    },
  },
  {
    match: "churn risk",
    answer: {
      role: "assistant",
      content:
        "47 comments carry churn-risk language. The clearest drivers are notification fatigue (\"thinking of switching tools\") and mobile performance issues during peak sync. Workflow setup complexity also appears in churn-adjacent feedback from newer teams still in onboarding.",
    },
  },
  {
    match: "roadmap memo",
    answer: {
      role: "assistant",
      content:
        "Roadmap memo — Productivity Tool\n\nNow: Ship granular notification controls and improved workflow setup templates to address the two highest-volume, highest-negativity themes.\n\nNext: Add customizable dashboard widgets and improve mobile sync reliability.\n\nLater: Advanced saved views and expanded cross-team reporting.\n\nRationale: Notification overload and setup complexity dominate negative sentiment across sources; addressing them first should lift retention and onboarding success.",
    },
  },
  {
    match: "supporting quotes",
    answer: {
      role: "assistant",
      content:
        "Supporting quotes for notification overload:\n\n• \"Every project update turns into another notification.\" — X Search\n• \"I end up muting the app and missing the important stuff.\" — X Search\n• \"Notification settings are all-or-nothing.\" — Pasted Feedback",
    },
  },
]

export const DEFAULT_ANSWER: ChatMessage = {
  role: "assistant",
  content:
    "Based on the combined feedback set, the recurring themes are notification overload, workflow setup complexity, and dashboard flexibility. Ask about a specific theme, source comparison, churn risk, or request a roadmap memo and I'll synthesize an answer from the analyzed feedback.",
}

# AI Product Feedback Synthesizer Data Contracts

## Purpose

This document defines the first-pass TypeScript interfaces for the initial build of the AI Product Feedback Synthesizer.

These interfaces are intended to:

- stabilize the current mock-first frontend
- guide backend API design
- provide a shared contract between frontend and backend

These are first-pass contracts, not final production schemas. They should optimize for clarity and implementation speed.

## Design Notes

### General rules

- IDs are strings at the API boundary
- timestamps use ISO 8601 strings
- enum-like fields start as string unions
- nullable fields are used where the value may not exist during early pipeline stages
- metadata fields allow limited extensibility without blocking schema evolution

### Scope note

These contracts are intentionally designed for:

- demo dataset flow
- CSV/pasted feedback flow
- dashboard rendering
- grounded chatbot

They do not yet include:

- user accounts
- team workspaces
- billing
- semantic vector retrieval

## AnalysisTarget

```ts
export interface AnalysisTarget {
  id: string
  name: string
  description: string
  createdAt: string
}
```

## FeedbackSet

```ts
export type FeedbackSetStatus =
  | "draft"
  | "ready"
  | "processing"
  | "completed"
  | "failed"

export type AnalysisGoal =
  | "Full Product Feedback Synthesis"
  | "Identify Top Pain Points"
  | "Find Feature Requests"
  | "Prioritize Roadmap Opportunities"
  | "Summarize Sentiment"
  | "Identify Churn / Retention Risks"
  | "Generate Product Strategy Recommendations"

export interface FeedbackSet {
  id: string
  analysisTargetId: string
  name: string | null
  analysisGoal: AnalysisGoal
  status: FeedbackSetStatus
  totalFeedbackCount: number
  createdAt: string
  updatedAt: string
}
```

## DataSource

```ts
export type SourceType =
  | "demo_dataset"
  | "csv_upload"
  | "pasted_text"
  | "x_search"

export type DataSourceStatus =
  | "pending"
  | "ready"
  | "processing"
  | "failed"

export interface DataSource {
  id: string
  feedbackSetId: string
  sourceType: SourceType
  sourceLabel: string
  itemCount: number
  status: DataSourceStatus
  metadata: Record<string, unknown>
  createdAt: string
}
```

## FeedbackItem

```ts
export type SentimentLabel = "positive" | "neutral" | "negative" | "mixed"

export type FeedbackCategory =
  | "bug_report"
  | "feature_request"
  | "ux_issue"
  | "pricing_concern"
  | "performance_issue"
  | "onboarding_friction"
  | "positive_feedback"
  | "support_complaint"
  | "churn_risk"
  | "unknown"

export type SeverityLabel = "low" | "medium" | "high" | "critical"

export interface FeedbackItem {
  id: string
  feedbackSetId: string
  sourceId: string
  sourceType: SourceType
  sourceLabel: string
  rawText: string
  normalizedText: string
  rating: number | null
  feedbackDate: string | null
  authorHandle: string | null
  url: string | null
  category: FeedbackCategory | null
  sentiment: SentimentLabel | null
  severity: SeverityLabel | null
  churnRisk: boolean | null
  themeId: string | null
  dedupeHash: string | null
  metadata: Record<string, unknown>
  createdAt: string
}
```

## AnalysisRun

```ts
export type AnalysisRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"

export interface AnalysisRunStep {
  name:
    | "create_feedback_set"
    | "ingest_sources"
    | "normalize_feedback"
    | "merge_feedback"
    | "dedupe_feedback"
    | "classify_feedback"
    | "analyze_sentiment"
    | "cluster_themes"
    | "retrieve_quotes"
    | "generate_dashboard"
  status: "pending" | "running" | "completed" | "failed"
  startedAt: string | null
  completedAt: string | null
  errorMessage?: string | null
}

export interface AnalysisRun {
  id: string
  feedbackSetId: string
  status: AnalysisRunStatus
  currentStep: string | null
  steps: AnalysisRunStep[]
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  metadata: Record<string, unknown>
}
```

## DashboardPayload

```ts
export interface DashboardContext {
  analysisRunId: string
  productName: string
  productDescription: string
  goal: AnalysisGoal
  processingMethod: string
  sourceCount: number
  feedbackItemCount: number
  lastRunAt: string
}

export interface DashboardSourceMixItem {
  sourceId: string
  sourceType: SourceType
  label: string
  count: number
  unit: string
  percent: number
}

export interface DashboardKpi {
  label: string
  value: string | number
}

export interface SentimentBreakdownItem {
  label: string
  value: number
}

export interface SentimentBySourceItem {
  sourceLabel: string
  negativePercent: number
}

export interface ClassificationSummaryItem {
  category: FeedbackCategory
  count: number
  percent: number
}

export interface ThemeSummary {
  id: string
  rank: number
  name: string
  description: string
  count: number
  percent: number
  sentiment: string
  priority: "High" | "Medium" | "Low"
  sourceCoverage: string
}

export interface QuoteEvidence {
  text: string
  sourceLabel: string
}

export interface PainPointSummary {
  title: string
  summary: string
  evidenceCount: number
  impact: string
  recommendedAction: string
  representativeQuotes: QuoteEvidence[]
}

export interface FeatureRequestSummary {
  request: string
  userNeed: string
  supportingEvidence: string
  priority: "High" | "Medium" | "Low"
}

export interface RoadmapRecommendationItem {
  title: string
  rationale: string
}

export interface RoadmapRecommendationPhase {
  phase: "Now" | "Next" | "Later"
  items: RoadmapRecommendationItem[]
}

export interface RepresentativeQuote {
  text: string
  sourceLabel: string
  themeName: string | null
  category: FeedbackCategory | null
}

export interface ModelSignal {
  label: string
  value: string
}

export interface DashboardPayload {
  analysisContext: DashboardContext
  sourceMix: DashboardSourceMixItem[]
  kpis: DashboardKpi[]
  executiveSummary: string
  sentimentBreakdown: {
    overall: SentimentBreakdownItem[]
    bySource: SentimentBySourceItem[]
  }
  classificationSummary: ClassificationSummaryItem[]
  topThemes: ThemeSummary[]
  painPoints: PainPointSummary[]
  featureRequests: FeatureRequestSummary[]
  roadmapRecommendations: RoadmapRecommendationPhase[]
  representativeQuotes: RepresentativeQuote[]
  modelSignals: ModelSignal[]
}
```

## ChatRequest

```ts
export type ChatScope = "all" | SourceType

export interface ChatRequest {
  analysisRunId: string
  question: string
  scope: ChatScope
}
```

## ChatResponse

```ts
export interface ChatEvidenceItem {
  feedbackItemId: string
  text: string
  sourceLabel: string
  themeName?: string | null
  category?: FeedbackCategory | null
}

export interface ChatResponse {
  answer: string
  scopeUsed: ChatScope
  evidence: ChatEvidenceItem[]
  followUpSuggestions: string[]
}
```

## Recommended Usage Notes

### Frontend

The current frontend should eventually:

- render all dashboard components from `DashboardPayload`
- send chat prompts using `ChatRequest`
- render scoped answers and optional evidence from `ChatResponse`

### Backend

The backend should eventually:

- persist internal entities with richer DB-specific models
- expose these interfaces at the API boundary
- validate outbound payloads against these shapes

### Expected Future Changes

Likely near-term changes:

- adding confidence fields
- expanding theme and quote metadata
- introducing source-level error payloads
- distinguishing dashboard summary provenance from raw run outputs

Likely deferred changes:

- embedding metadata
- vector retrieval references
- user/account fields
- access control fields

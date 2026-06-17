# AI Product Feedback Synthesizer: Initial Assessment and Implementation Plan

## 1. Current Repo Assessment

The repository currently contains a polished mock-first Next.js prototype, not a full integrated product system yet.

What is already present:

- A strong frontend prototype built with Next.js, React, Tailwind, and shadcn-style UI components
- A multi-step demo/custom analysis flow in `app/page.tsx`
- Mock dashboard components for:
  - executive summary
  - source mix
  - sentiment overview
  - top themes
  - pain points
  - feature requests
  - roadmap recommendations
  - representative quotes
  - follow-up chatbot
- Static mock data contracts in:
  - `lib/analysis-data.ts`
  - `lib/feedback-data.ts`
- PRD, UI notes, and architecture notes in `docs/`

What is not yet present:

- No real backend application scaffold
- No FastAPI service
- No Supabase integration
- No Railway deployment scaffold
- No MCP server implementation
- No ingestion pipeline for demo, CSV, pasted text, or X
- No trained ML classifier
- No real LLM synthesis workflow
- No test suite
- No shared typed API contract between frontend and backend

Important implication:

This should be treated as a frontend prototype plus product spec, not as a partially integrated full-stack app. The initial build should preserve the current UX while replacing mock logic with real contracts and services in controlled phases.

## 2. Recommended Project Structure

Recommended target structure:

```text
apps/
  web/                  # Next.js frontend deployed to Vercel
  api/                  # FastAPI backend deployed to Railway

packages/
  contracts/            # Shared API and dashboard contracts
  config/               # Shared tsconfig/eslint/prettier/tooling

supabase/
  migrations/           # SQL migrations
  seeds/                # Demo dataset seed scripts

ml/
  training/             # Model training scripts
  artifacts/            # Saved classifier artifacts
  eval/                 # Evaluation notebooks or reports

data/
  demo/                 # Curated demo datasets

docs/
  ... existing docs ...
```

Recommended structure by responsibility:

- `apps/web`
  - Keep the current Next.js application here
  - Owns UI flows, dashboard rendering, and chat interface
- `apps/api`
  - Owns REST API, orchestration, background processing, MCP exposure, ML inference, and LLM/X integrations
- `packages/contracts`
  - Own shared JSON schema or typed contracts used by frontend and backend
- `supabase`
  - Own migrations, seeds, and local Supabase project configuration
- `ml`
  - Own model training and artifacts separately from inference service code
- `data/demo`
  - Own the three seeded demo datasets used for the public demo path

What should be built first:

- `packages/contracts`
- `apps/api`
- `supabase/migrations`
- `data/demo`

What should be deferred:

- Additional packages for analytics/exporting
- Separate worker service
- Separate standalone MCP service
- Vector-search-specific package layout

## 3. Frontend Implementation Plan

### Goal

Preserve the current polished experience while replacing local mock state with real backend-driven state.

### Phase 1: Stabilize the frontend around real contracts

Build first:

- Extract the current mock data shapes into formal TypeScript contracts
- Refactor components to consume typed payloads instead of file-local assumptions
- Introduce route/state boundaries for:
  - entry
  - demo product selection
  - custom setup
  - source configuration
  - review
  - processing
  - dashboard
- Add robust loading, error, and empty states
- Preserve all current UI screens from the v0 prototype

This phase should remain mock-data-backed.

### Phase 2: Wire the demo dataset vertical slice

Build next:

- Create API clients for feedback set creation and synthesis trigger
- Replace local `setScreen("processing")` / `setScreen("dashboard")` logic with real run creation and polling
- Render the dashboard from `GET /analysis-runs/{id}` payloads

This should be the first real end-to-end slice.

### Phase 3: Add custom ingestion flows

Build after demo dataset:

- CSV upload form handling
- pasted feedback submission
- X search configuration
- source validation feedback
- source status display in review step

### Phase 4: Add real chatbot behavior

Build after dashboard is backed by real data:

- scoped chat requests
- evidence-aware answers
- source-specific answers
- follow-up suggestions from backend

What should be deferred:

- user authentication
- shareable analysis URLs
- export to PDF or Markdown
- advanced workspace features
- vector-search-powered semantic chat

## 4. Mock-Data Dashboard / Chatbot Data Contracts

These contracts should be defined before backend implementation so the UI and API converge on a single schema.

### Core entities

#### AnalysisTarget

```ts
type AnalysisTarget = {
  id: string
  name: string
  description: string
  createdAt: string
}
```

#### FeedbackSet

```ts
type FeedbackSet = {
  id: string
  analysisTargetId: string
  name: string | null
  analysisGoal: string
  status: "draft" | "ready" | "processing" | "completed" | "failed"
  totalFeedbackCount: number
  createdAt: string
  updatedAt: string
}
```

#### DataSource

```ts
type DataSource = {
  id: string
  feedbackSetId: string
  sourceType: "demo_dataset" | "csv_upload" | "pasted_text" | "x_search"
  sourceLabel: string
  itemCount: number
  status: "pending" | "ready" | "processing" | "failed"
  metadata: Record<string, unknown>
  createdAt: string
}
```

#### AnalysisRun

```ts
type AnalysisRun = {
  id: string
  feedbackSetId: string
  status: "queued" | "running" | "completed" | "failed"
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
}
```

### Dashboard payload

```ts
type DashboardPayload = {
  analysisContext: {
    analysisRunId: string
    productName: string
    productDescription: string
    goal: string
    processingMethod: string
    sourceCount: number
    feedbackItemCount: number
    lastRunAt: string
  }
  sourceMix: Array<{
    sourceId: string
    sourceType: string
    label: string
    count: number
    unit: string
    percent: number
  }>
  kpis: Array<{
    label: string
    value: string | number
  }>
  executiveSummary: string
  sentimentBreakdown: {
    overall: Array<{ label: string; value: number }>
    bySource: Array<{ sourceLabel: string; negativePercent: number }>
  }
  classificationSummary: Array<{
    category: string
    count: number
    percent: number
  }>
  topThemes: Array<{
    id: string
    rank: number
    name: string
    description: string
    count: number
    percent: number
    sentiment: string
    priority: string
    sourceCoverage: string
  }>
  painPoints: Array<{
    title: string
    summary: string
    evidenceCount: number
    impact: string
    recommendedAction: string
    representativeQuotes: Array<{
      text: string
      sourceLabel: string
    }>
  }>
  featureRequests: Array<{
    request: string
    userNeed: string
    supportingEvidence: string
    priority: string
  }>
  roadmapRecommendations: Array<{
    phase: "Now" | "Next" | "Later"
    items: Array<{
      title: string
      rationale: string
    }>
  }>
  representativeQuotes: Array<{
    text: string
    sourceLabel: string
    themeName: string | null
    category: string | null
  }>
  modelSignals: Array<{
    label: string
    value: string
  }>
}
```

### Chat contracts

```ts
type ChatRequest = {
  analysisRunId: string
  question: string
  scope: "all" | "demo_dataset" | "csv_upload" | "pasted_text" | "x_search"
}

type ChatResponse = {
  answer: string
  scopeUsed: string
  evidence: Array<{
    feedbackItemId: string
    text: string
    sourceLabel: string
    themeName?: string | null
    category?: string | null
  }>
  followUpSuggestions: string[]
}
```

What should be built first:

- These contracts
- Mock payload fixtures matching them exactly

What should be deferred:

- Overly flexible polymorphic shapes
- Embedding-specific retrieval structures

## 5. Supabase Schema Proposal

Recommended initial tables:

- `analysis_targets`
- `feedback_sets`
- `data_sources`
- `feedback_items`
- `analysis_runs`
- `item_classifications`
- `themes`
- `theme_memberships`
- `representative_quotes`
- `dashboard_summaries`
- `chat_messages`
- `uploaded_files`

### Table outline

#### analysis_targets

- `id` UUID PK
- `name` text not null
- `description` text not null
- `created_at` timestamptz not null default now()

#### feedback_sets

- `id` UUID PK
- `analysis_target_id` UUID FK
- `name` text null
- `analysis_goal` text not null
- `status` text not null
- `total_feedback_count` int not null default 0
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

#### data_sources

- `id` UUID PK
- `feedback_set_id` UUID FK
- `source_type` text not null
- `source_label` text not null
- `status` text not null
- `item_count` int not null default 0
- `metadata_json` jsonb not null default '{}'::jsonb
- `created_at` timestamptz not null default now()

#### feedback_items

- `id` UUID PK
- `feedback_set_id` UUID FK
- `source_id` UUID FK
- `source_type` text not null
- `source_label` text not null
- `raw_text` text not null
- `normalized_text` text not null
- `rating` numeric null
- `feedback_date` timestamptz null
- `author_handle` text null
- `url` text null
- `dedupe_hash` text null
- `sentiment` text null
- `severity` text null
- `churn_risk` boolean null
- `metadata_json` jsonb not null default '{}'::jsonb
- `created_at` timestamptz not null default now()

#### analysis_runs

- `id` UUID PK
- `feedback_set_id` UUID FK
- `status` text not null
- `step_name` text null
- `error_message` text null
- `run_metadata_json` jsonb not null default '{}'::jsonb
- `started_at` timestamptz null
- `completed_at` timestamptz null
- `created_at` timestamptz not null default now()

#### item_classifications

- `id` UUID PK
- `feedback_item_id` UUID FK
- `category` text not null
- `confidence` numeric null
- `sentiment` text null
- `severity` text null
- `churn_risk_score` numeric null
- `created_at` timestamptz not null default now()

#### themes

- `id` UUID PK
- `analysis_run_id` UUID FK
- `name` text not null
- `description` text not null
- `priority` text null
- `sentiment` text null
- `item_count` int not null default 0
- `created_at` timestamptz not null default now()

#### theme_memberships

- `id` UUID PK
- `theme_id` UUID FK
- `feedback_item_id` UUID FK
- `membership_score` numeric null

#### representative_quotes

- `id` UUID PK
- `analysis_run_id` UUID FK
- `theme_id` UUID null FK
- `feedback_item_id` UUID FK
- `quote_text` text not null
- `source_label` text not null
- `created_at` timestamptz not null default now()

#### dashboard_summaries

- `id` UUID PK
- `analysis_run_id` UUID FK
- `summary_json` jsonb not null
- `created_at` timestamptz not null default now()

#### chat_messages

- `id` UUID PK
- `analysis_run_id` UUID FK
- `role` text not null
- `scope` text null
- `message_text` text not null
- `message_metadata_json` jsonb not null default '{}'::jsonb
- `created_at` timestamptz not null default now()

#### uploaded_files

- `id` UUID PK
- `feedback_set_id` UUID FK
- `storage_path` text not null
- `original_filename` text not null
- `mime_type` text not null
- `size_bytes` bigint not null
- `created_at` timestamptz not null default now()

### Storage

Add Supabase Storage bucket:

- `uploads`

### Schema notes

Build first:

- relational model above
- JSONB for source metadata and summaries
- indexes on `feedback_set_id`, `analysis_run_id`, `source_type`, `category`, `sentiment`

Defer:

- pgvector
- semantic retrieval tables
- row-level security complexity for authenticated users

## 6. Railway / FastAPI Backend Plan

### Recommended v1 approach

Use a single FastAPI service hosted on Railway.

This service should handle:

- frontend REST API
- orchestration of synthesis runs
- Supabase writes and reads
- ML inference
- LLM calls
- X integration
- MCP server mounting

### Recommended API endpoints

- `POST /api/feedback-sets`
- `POST /api/feedback-sets/{id}/sources/demo`
- `POST /api/feedback-sets/{id}/sources/csv`
- `POST /api/feedback-sets/{id}/sources/paste`
- `POST /api/feedback-sets/{id}/sources/x`
- `POST /api/feedback-sets/{id}/synthesize`
- `GET /api/analysis-runs/{id}`
- `POST /api/analysis-runs/{id}/chat`
- `GET /api/health`

### Service responsibilities

#### Feedback set creation

- create analysis target
- create feedback set
- persist selected goal

#### Source ingestion

- load seeded demo data
- accept uploaded CSV metadata and parse rows
- split pasted feedback into items
- fetch X posts and normalize them

#### Synthesis orchestration

- create an analysis run
- progress through pipeline steps
- persist outputs
- expose run status to frontend

#### Chat handling

- retrieve analysis context
- retrieve scoped evidence
- produce answer grounded in available data

### Background execution

Recommended v1:

- Start with async/background processing within the same FastAPI service
- Persist run status in `analysis_runs`
- Frontend polls run state

Defer:

- Celery
- Redis queue
- separate worker deployment

Unless synthesis duration or concurrency makes it necessary, avoid early infrastructure expansion.

## 7. MCP Server Implementation Recommendation

### Recommendation

Use a true MCP server in v1, but mount it inside the FastAPI/Railway service rather than deploying it as a separate service initially.

### Why this is the right v1 choice

- It satisfies the architecture story in the PRD
- It keeps deployment complexity low
- It avoids premature service sprawl
- It still allows the system to expose real MCP semantics and tools

### Recommended implementation shape

```text
Railway FastAPI Service
  ├── REST API
  ├── Orchestration layer
  ├── MCP server adapter
  ├── MCP tool implementations
  ├── ML inference
  ├── X integration
  └── LLM synthesis / chat
```

### Practical rule

The same underlying Python tool functions should serve both:

- internal synthesis orchestration
- external MCP tool exposure

That prevents duplicate logic and keeps the “true MCP” claim credible.

### Defer

- standalone MCP service
- cross-process tool execution
- multi-client MCP gateway

## 8. MCP Tools List and Responsibilities

Recommended v1 MCP tools:

### Core setup and ingestion

- `create_feedback_set`
  - Creates analysis target and feedback set container
- `load_demo_dataset`
  - Loads seeded demo dataset into normalized feedback items
- `parse_uploaded_csv`
  - Validates CSV, identifies text column, parses rows
- `parse_pasted_feedback`
  - Splits raw text into individual feedback items
- `search_x_feedback`
  - Fetches recent public X posts for a query and normalizes them

### Processing

- `normalize_feedback_items`
  - Cleans text, standardizes metadata, prepares items for downstream analysis
- `merge_feedback_sources`
  - Combines all source records into one analysis set
- `dedupe_feedback_items`
  - Removes exact/near duplicates while preserving attribution

### Analysis

- `classify_feedback`
  - Runs lightweight ML category classification
- `analyze_sentiment`
  - Assigns sentiment labels and optional confidence
- `detect_churn_risk`
  - Flags likely churn-risk signals
- `cluster_themes`
  - Groups items into themes
- `retrieve_representative_quotes`
  - Selects evidence quotes per theme/category

### Synthesis and chat

- `generate_dashboard_summary`
  - Produces executive summary, implications, and recommendations from structured inputs
- `answer_followup_question`
  - Retrieves scoped evidence and produces grounded answers
- `store_analysis_run`
  - Persists structured results and run artifacts

### Build order

Build first:

- `create_feedback_set`
- `load_demo_dataset`
- `normalize_feedback_items`
- `merge_feedback_sources`
- `dedupe_feedback_items`
- `classify_feedback`
- `cluster_themes`
- `generate_dashboard_summary`

Build later:

- `search_x_feedback`
- `answer_followup_question`

## 9. Lightweight ML Classifier Plan

### Goal

Include a real trained model in the product workflow without overengineering the ML layer.

### Recommended model approach

- scikit-learn
- TF-IDF features
- logistic regression or linear SVM
- serialized artifact loaded by FastAPI

### Target categories

- Bug report
- Feature request
- UX issue
- Pricing concern
- Performance issue
- Onboarding friction
- Positive feedback
- Support complaint
- Churn risk

### Recommended modeling strategy

Use two layers:

1. Multi-class classifier for feedback category
2. Binary churn-risk detector, either:
   - lightweight separate classifier, or
   - rule-plus-model hybrid

This is more practical than forcing churn risk into the same label space if training data is weak.

### Data strategy

Recommended v1 approach:

- public review/support datasets where usable
- hand-labeled subset of feedback examples
- synthetic augmentation for categories with thin public coverage

### Deliverables

- training script
- evaluation report
- saved model artifact
- inference wrapper
- versioned label mapping

### What should be built first

- baseline model with enough credibility to demonstrate real ML in workflow

### What should be deferred

- transformer fine-tuning
- active learning UI
- user-driven relabeling workflow

## 10. X Integration Plan

### Goal

Support one live external source that fits the public portfolio demo story.

### v1 scope

User may enter:

- product name
- company name
- X handle
- keyword query

Backend should:

- call X API with app-owned credentials
- fetch recent public posts
- normalize posts into feedback items
- persist source attribution and raw metadata

### Required UX behavior

- Users do not authenticate with X
- Results are labeled as public social feedback
- Empty, partial, and rate-limited states are shown clearly
- Users understand that X is recent public conversation, not exhaustive customer truth

### Guardrails

- cap number of fetched posts
- cap number of API requests per synthesis
- persist raw payload metadata for debugging
- use graceful fallback messaging on rate limits/errors

### Build order

Build after:

- demo dataset flow works
- CSV/paste ingestion works
- dashboard synthesis works

### Defer

- historical search depth
- complex advanced query UI
- engagement analytics
- streaming ingestion

## 11. LLM Synthesis Plan

### Role of the LLM

The LLM should handle higher-order synthesis and explanation, not all processing.

### LLM responsibilities

- executive summary
- theme descriptions
- product implications
- roadmap recommendations
- follow-up chatbot answers

### Inputs to the LLM

LLM prompts should consume structured backend outputs, not raw unbounded source text only.

Recommended structured inputs:

- analysis goal
- source mix
- category counts
- sentiment breakdown
- theme summaries
- top evidence quotes
- churn-risk signals
- source-specific differences

### Output requirements

The LLM should:

- stay grounded in supplied evidence
- avoid unsupported claims
- distinguish between strong evidence and weaker inference
- keep output concise and dashboard-ready

### Two-prompt strategy

Build first:

1. Dashboard synthesis prompt
   - generates summary, top implications, and recommendations
2. Chat answer prompt
   - grounded in retrieved evidence and scoped context

### Defer

- multi-agent LLM prompt choreography beyond what is needed for visible product value
- fine-tuned LLM behavior
- semantic retrieval pipelines requiring embeddings

## 12. Testing Plan

### Frontend testing

- Component tests for major screens and dashboard states
- Contract-driven rendering tests using fixture payloads
- Manual responsive smoke tests for desktop and mobile

### Backend testing

- Unit tests for:
  - CSV parsing
  - pasted text splitting
  - normalization
  - deduplication
  - ML inference
  - sentiment utilities
- Integration tests for:
  - demo dataset synthesis flow
  - chat against stored analysis results

### Contract testing

- Validate backend payloads against shared contract schemas
- Validate frontend fixtures against the same schemas

### Data tests

- Fixture-based tests for:
  - malformed CSVs
  - unknown text column mapping
  - duplicate feedback rows
  - empty X search responses

### What should be built first

- backend parser/inference tests
- contract validation tests
- one end-to-end demo dataset flow test

### What should be deferred

- broad browser automation suite
- load/performance testing beyond basic smoke coverage

## 13. Deployment Plan

### Vercel

Hosts:

- Next.js frontend

Responsibilities:

- public UI
- environment-specific frontend variables
- API base URL configuration

### Railway

Hosts:

- FastAPI backend
- mounted MCP server
- ML inference runtime

Responsibilities:

- backend secrets
- synthesis jobs
- LLM and X credentials

### Supabase

Hosts:

- Postgres
- Storage bucket for CSV uploads

Responsibilities:

- persistent feedback and analysis data
- uploaded file storage
- demo dataset seeding

### Recommended rollout order

1. Local development with mock contracts
2. Local FastAPI plus local or remote Supabase
3. Vercel preview frontend + Railway preview API
4. Seed demo datasets into hosted Supabase
5. Production deploy for public portfolio demo

### Build first

- simple environment management
- preview deployments
- health checks
- seed scripts

### Defer

- multi-environment enterprise-grade release pipeline
- advanced autoscaling strategy

## 14. Major Risks / Unknowns

### 1. Classifier training data quality

The best public or synthetic dataset mix for the initial classifier is still unresolved.

### 2. X API limits / cost / reliability

The live X source may be the least stable part of the product. Rate limiting or product tier restrictions may force tighter v1 scope.

### 3. Public unauthenticated uploads

Allowing uploads without auth creates abuse, storage, and privacy risk. v1 can still do this, but file size/type/rate protections are needed.

### 4. Long-running synthesis on Railway

If runs are slow, the system may need stronger job orchestration earlier than planned.

### 5. MCP complexity vs product value

MCP helps the technical story, but it is not the shortest path to a working product. It should be implemented pragmatically, not as a platform project.

### 6. Chat quality without embeddings

Retrieval without vectors may still be sufficient in v1 if analysis outputs and quote tables are designed carefully. This remains to be validated.

### 7. Demo dataset sourcing

The quality of the seeded demo experience will heavily affect how impressive the product feels in a hiring context.

## 15. Recommended Milestone Sequence

### Milestone 1: Preserve and formalize the frontend prototype

Build first:

- shared contracts
- typed mock fixtures
- cleanup of current frontend state model

Outcome:

- Current prototype remains polished and stable, but is contract-driven rather than ad hoc

### Milestone 2: Demo dataset end-to-end vertical slice

Build next:

- Supabase schema
- FastAPI scaffold
- demo dataset ingestion
- synthesis orchestration
- real dashboard fetch

Outcome:

- User selects one demo product, runs synthesis, and sees a real generated dashboard

### Milestone 3: Custom ingestion

Build next:

- CSV upload
- pasted feedback
- source validation

Outcome:

- User can bring their own feedback into the same pipeline

### Milestone 4: ML-backed classification and stronger synthesis

Build next:

- trained classifier artifact
- persisted classifications
- richer dashboard sections

Outcome:

- Product clearly demonstrates more than a simple LLM wrapper

### Milestone 5: Chatbot follow-up

Build next:

- scoped chat API
- grounded evidence retrieval
- source-aware answers

Outcome:

- User can ask follow-up questions against current analysis context

### Milestone 6: X integration

Build after core loop is stable:

- X source ingestion
- X-specific failure states
- dashboard source labeling

Outcome:

- Product demonstrates one live external source

### Milestone 7: Hardening and launch polish

Build last:

- tests
- deployment hardening
- monitoring
- documentation updates

Outcome:

- Public portfolio-ready release

## 16. First 10 Implementation Tickets

### 1. Define shared frontend/backend contracts

Create shared schema/types for feedback set, sources, analysis run, dashboard payload, and chat request/response.

Acceptance criteria:

- frontend mock data conforms to shared contracts
- backend can import or validate against same shapes

### 2. Reorganize repo into web/api/contracts/supabase/ml structure

Restructure the repository into a clear monorepo layout without changing product behavior.

Acceptance criteria:

- current frontend still runs
- new backend/package directories exist

### 3. Add Supabase schema migrations and storage setup

Implement initial schema and `uploads` storage bucket configuration.

Acceptance criteria:

- migrations create all v1 core tables
- demo seed path is prepared

### 4. Seed the three demo datasets

Add seeded records for Fitness App, CRM Tool, and Productivity Tool demo paths.

Acceptance criteria:

- each dataset can be loaded by identifier
- source counts match intended UX copy or are updated intentionally

### 5. Scaffold FastAPI backend and health/config layer

Create the Railway-targeted API app with environment config and health endpoint.

Acceptance criteria:

- app boots locally
- health check passes
- Supabase connectivity is configured

### 6. Implement feedback set creation and demo source ingestion

Allow frontend to create a feedback set and attach one demo dataset source.

Acceptance criteria:

- demo source records and feedback items are persisted
- API returns IDs needed by frontend

### 7. Implement synthesis run orchestration for demo data

Add run creation, step progression, persistence, and polling support.

Acceptance criteria:

- analysis run transitions from queued to completed
- failures are stored and surfaced cleanly

### 8. Build the first mounted MCP server and core tools

Expose initial ingestion and synthesis tools through a true MCP interface within the API service.

Acceptance criteria:

- at least core tools are callable through MCP
- REST workflow uses the same underlying tool logic

### 9. Train and package the initial lightweight classifier

Create the baseline category classifier and inference wrapper.

Acceptance criteria:

- model artifact loads in backend
- classification results are persisted for demo synthesis

### 10. Replace dashboard mock flow with real demo vertical slice

Wire the frontend demo flow to the real backend so a user can synthesize a seeded dataset and view results.

Acceptance criteria:

- productivity demo path works end to end
- processing and dashboard states use live API responses

## Explicit Build-First vs Defer Guidance

### Build first

- Shared contracts
- Repo restructuring
- Supabase schema
- Demo dataset seeding
- FastAPI backend scaffold
- Mounted MCP server
- Demo dataset ingestion
- Core synthesis workflow
- Lightweight ML classifier
- Real dashboard fetch

### Build second

- CSV upload ingestion
- Pasted feedback ingestion
- Chatbot grounded on analysis context

### Build later

- X integration
- stronger run monitoring
- better prompt refinement

### Explicitly defer

- user auth
- team workspaces
- billing
- shareable dashboard URLs
- PDF/Markdown export
- enterprise privacy model
- direct SaaS integrations beyond X
- fine-tuned LLM
- vector search / pgvector unless trivial
- separate worker infra unless job duration forces it
- separate standalone MCP deployment unless external usage requires it

## Recommended First Real Vertical Slice

The first real system slice should be:

> A user selects the Productivity Tool demo dataset, clicks synthesize, the backend ingests seeded feedback, runs normalization/classification/theme generation/synthesis, stores the results, and the frontend renders a real dashboard from persisted analysis output.

That is the correct first build target because it proves the full product loop while avoiding early complexity from uploads, X, and chat.

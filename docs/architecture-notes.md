# Architecture Notes: AI Product Feedback Synthesizer

## Purpose

These notes summarize the intended v1 technical architecture. They are meant to guide Codex and implementation planning after the PRD and UI prototype are reviewed.

The product should demonstrate a real AI application architecture, not a simple LLM wrapper.

## High-Level Stack

### Frontend

- Next.js / React
- Tailwind CSS
- shadcn/ui
- lucide-react
- Recharts
- Hosted on Vercel

### Database and Storage

- Supabase Postgres
- Supabase Storage for uploaded CSVs
- Optional future pgvector support

### Backend

- FastAPI backend hosted on Railway
- Agent orchestration layer
- True MCP server if feasible
- MCP tools for ingestion, normalization, classification, synthesis, and follow-up Q&A
- Lightweight ML classifier
- LLM API calls
- X API integration

### External Services

- LLM provider
- X API
- Optional embedding API in later version

## Core Product Model

The backend should model the app around a multi-source feedback set.

Conceptual hierarchy:

```text
Analysis Target
  └── Feedback Set
        └── Data Sources
              └── Feedback Items
```

### Analysis Target

Represents the product being analyzed.

Fields may include:

- id
- name
- description
- created_at

Examples:

- Productivity Tool
- Acme Project Management
- Peloton App

### Feedback Set

Represents one analysis container.

Fields may include:

- id
- analysis_target_id
- name
- analysis_goal
- status
- total_feedback_count
- created_at
- updated_at

### Data Source

Represents one source included in the feedback set.

Source types:

- demo_dataset
- csv_upload
- pasted_text
- x_search

Fields may include:

- id
- feedback_set_id
- source_type
- source_label
- item_count
- status
- metadata_json
- created_at

### Feedback Item

Represents one normalized feedback record.

Fields may include:

- id
- feedback_set_id
- source_id
- source_type
- source_label
- raw_text
- normalized_text
- rating
- date
- author_handle
- url
- category
- sentiment
- theme_id
- severity
- churn_risk
- metadata_json
- created_at

## Required v1 Input Paths

### Demo Dataset

- User selects one demo product.
- Backend loads corresponding demo feedback records.
- Only one demo dataset should be selected per demo-path analysis.

### CSV Upload

- User uploads one CSV file in v1.
- Backend detects or maps feedback text column.
- Uploaded file may be stored in Supabase Storage.
- Parsed rows become feedback items.

### Pasted Feedback

- User pastes one block of text in v1.
- Backend splits the text into feedback items where possible.

### X Search

- User enters product, company, handle, or keyword query.
- Backend uses app-owned X credentials.
- Public users should not authenticate with X.
- Retrieved posts are normalized into feedback items.
- X items should be clearly labeled as public social feedback.
- X API failures and rate limits should be handled gracefully.

## Agentic Workflow

The system should process each analysis through a multi-step workflow:

1. Create or load analysis target.
2. Create feedback set.
3. Add configured sources.
4. Ingest each source.
5. Normalize feedback items.
6. Merge sources.
7. Deduplicate where possible.
8. Preserve source attribution.
9. Classify feedback items.
10. Analyze sentiment, severity, and churn risk.
11. Cluster feedback into themes.
12. Retrieve representative quotes.
13. Generate dashboard summaries.
14. Store analysis results.
15. Support source-aware chatbot follow-ups.

## MCP Layer

v1 should use a true MCP server if feasible.

Preferred initial deployment:

```text
Railway FastAPI service
  ├── REST endpoints for frontend
  ├── Agent orchestration
  ├── MCP server mounted inside service or adjacent service
  ├── MCP tools
  ├── ML classifier
  └── LLM / X API calls
```

Codex should evaluate whether to:

1. Mount MCP inside the main FastAPI backend, or
2. Deploy MCP as a separate Railway service.

For v1 simplicity, mounting MCP inside the FastAPI service may be acceptable if it still uses true MCP semantics.

## Candidate MCP Tools

- create_feedback_set
- load_demo_dataset
- parse_uploaded_csv
- parse_pasted_feedback
- search_x_feedback
- normalize_feedback_items
- merge_feedback_sources
- dedupe_feedback_items
- classify_feedback
- analyze_sentiment
- cluster_themes
- retrieve_representative_quotes
- generate_dashboard_summary
- answer_followup_question
- store_analysis_run

## ML Classifier

v1 should include a lightweight trained ML classifier.

Acceptable approach:

- scikit-learn
- TF-IDF features
- Logistic regression or Linear SVM
- Saved model artifact loaded by backend
- Public or synthetic labeled training data

Primary categories may include:

- Bug report
- Feature request
- UX issue
- Pricing concern
- Performance issue
- Onboarding friction
- Positive feedback
- Support complaint
- Churn risk

The model does not need to be state-of-the-art. It needs to demonstrate that the product includes a real trained model inside the workflow.

## LLM Responsibilities

The LLM should handle higher-order synthesis and explanation, not all processing.

LLM responsibilities:

- Executive summary
- Theme descriptions
- Product implications
- Roadmap recommendations
- Follow-up chatbot answers
- Source-aware comparisons
- Roadmap memo generation

The LLM should use structured analysis context from the backend and avoid unsupported claims.

## Embeddings / Vector Search

Embeddings and pgvector are likely deferred from v1.

v1 retrieval can use:

- feedback_set_id
- source_id
- theme_id
- category
- sentiment
- keyword matching
- representative quote tables

The schema should not block future vector search support.

Possible v1.1 additions:

- pgvector embeddings
- Semantic quote retrieval
- Similar-feedback search
- Better chatbot grounding
- Cross-source semantic comparison

## Supabase Tables: Initial Sketch

Potential tables:

- analysis_targets
- feedback_sets
- data_sources
- feedback_items
- analysis_runs
- classifications
- themes
- representative_quotes
- dashboard_summaries
- chat_messages
- uploaded_files

Exact schema should be finalized during implementation planning.

## Frontend API Needs

The frontend will likely need backend endpoints such as:

- POST /api/feedback-sets
- POST /api/feedback-sets/{id}/sources/demo
- POST /api/feedback-sets/{id}/sources/csv
- POST /api/feedback-sets/{id}/sources/paste
- POST /api/feedback-sets/{id}/sources/x
- POST /api/feedback-sets/{id}/synthesize
- GET /api/analysis-runs/{id}
- POST /api/analysis-runs/{id}/chat

Exact API names are flexible.

## Dashboard Data Contract

The dashboard should receive structured data such as:

- analysis_context
- source_mix
- executive_summary
- kpis
- sentiment_breakdown
- top_themes
- classification_summary
- pain_points
- feature_requests
- roadmap_recommendations
- representative_quotes
- model_agent_signals

Codex should derive specific TypeScript types from the approved dashboard UI.

## Chatbot Requirements

Chatbot should be scoped to the current analysis run.

It should support:

- All-source answers
- Source-specific answers
- Source comparisons
- Evidence retrieval when requested
- Roadmap memo generation

Example prompts:

- What should we prioritize first?
- Compare X feedback to the demo dataset.
- Which issues appear across all sources?
- Only answer using pasted reviews.
- Show evidence for notification overload.
- Which issues suggest churn risk?
- Turn this into a roadmap memo.

## Deployment Assumptions

### Vercel

- Hosts the Next.js frontend.
- Public user interface.
- Should not expose backend secrets.

### Supabase

- Stores feedback sets, data sources, feedback records, analysis outputs, and chat messages.
- May store uploaded CSV files.

### Railway

- Hosts FastAPI backend and MCP-related services.
- Stores environment variables for LLM, Supabase, and X API credentials.
- Handles ML inference and long-running synthesis workflows.

## Security and Privacy Notes

v1 is public and unauthenticated. Do not treat it as enterprise-secure.

Include visible copy warning users not to upload sensitive or confidential data.

Backend should enforce:

- File type validation
- File size limits
- Basic input validation
- Rate limiting or abuse protection if feasible
- Secret handling through Railway environment variables

Current retention assumption:

- No automatic purge date in v1.

This should be revisited before broader public distribution.

## Non-Goals for v1

- User authentication
- Team workspaces
- Billing
- Full enterprise privacy model
- Exportable PDF / Markdown report
- Shareable dashboard URLs
- Direct integrations with Zendesk, Intercom, G2, App Store, Google Play, Salesforce
- Fine-tuned LLM
- Complex training UI
- Full vector search unless trivial to add

## Recommended Implementation Order

1. Preserve and clean up v0 UI prototype.
2. Mock dashboard and chatbot UI states.
3. Define TypeScript data types for UI mock data.
4. Draft implementation plan from PRD, UI notes, architecture notes, and screenshots.
5. Build frontend vertical slice with mock data.
6. Add Supabase schema.
7. Add Railway FastAPI backend.
8. Add MCP tool layer.
9. Add demo dataset ingestion.
10. Add upload/paste ingestion.
11. Add lightweight ML classifier.
12. Add synthesis workflow with LLM.
13. Add X integration.
14. Add chatbot follow-up.
15. Polish and deploy.

# AI Product Feedback Synthesizer Backlog

## Purpose

This backlog is execution-ready and organized for the initial build of the AI Product Feedback Synthesizer.

It includes:

- epics
- tickets
- descriptions
- acceptance criteria
- dependencies
- suggested order of execution

This backlog assumes:

- no product code has been implemented yet beyond the v0 prototype
- the current root-level frontend should be preserved during the first implementation passes

## Suggested Execution Order

Recommended epic order:

1. Epic A: Contracts and planning foundation
2. Epic B: Backend and data foundation
3. Epic C: Demo dataset vertical slice
4. Epic D: ML-backed synthesis pipeline
5. Epic E: Custom ingestion
6. Epic F: Chatbot follow-up
7. Epic G: X integration
8. Epic H: Hardening and deployment
9. Epic I: Repo migration to target structure

## Epic A: Contracts and Planning Foundation

### Ticket A1: Define first-pass shared data contracts

Description:

Create the initial interfaces for analysis workflow objects, dashboard payloads, and chat payloads.

Acceptance criteria:

- `AnalysisTarget`, `FeedbackSet`, `DataSource`, `FeedbackItem`, `AnalysisRun`, `DashboardPayload`, `ChatRequest`, and `ChatResponse` are documented
- shapes are sufficient for both current mock UI and future backend payloads

Dependencies:

- none

Suggested order:

- first

### Ticket A2: Align current mock data to approved contract shapes

Description:

Prepare the mock structures so frontend components can later switch to live payloads with minimal churn.

Acceptance criteria:

- all current mock data concepts map cleanly to documented contracts
- mismatches or missing fields are identified

Dependencies:

- A1

Suggested order:

- second

### Ticket A3: Define API surface for first backend iteration

Description:

Document the initial REST endpoints required for the demo vertical slice and later custom sources/chat.

Acceptance criteria:

- create feedback set endpoint is defined
- add source endpoints are defined
- synthesize endpoint is defined
- analysis run fetch endpoint is defined
- chat endpoint is defined

Dependencies:

- A1

Suggested order:

- third

## Epic B: Backend and Data Foundation

### Ticket B1: Scaffold FastAPI application

Description:

Create the initial backend service with app bootstrap, config handling, and health check.

Acceptance criteria:

- FastAPI service boots locally
- environment variables are defined for Supabase, LLM provider, and X
- health endpoint responds successfully

Dependencies:

- A3

Suggested order:

- fourth

### Ticket B2: Define Supabase schema and migrations

Description:

Create the core relational schema for analysis targets, feedback sets, sources, items, runs, themes, summaries, files, and chat messages.

Acceptance criteria:

- migrations cover all v1 core entities
- enum or constrained text fields are defined for status/source/category concepts
- indexes are added for core lookups

Dependencies:

- A1

Suggested order:

- fifth

### Ticket B3: Set up Supabase storage model for CSV uploads

Description:

Define bucket usage and metadata table support for uploaded source files.

Acceptance criteria:

- `uploads` bucket strategy is documented or created
- `uploaded_files` records are represented in schema

Dependencies:

- B2

Suggested order:

- sixth

### Ticket B4: Create demo dataset seeding strategy

Description:

Prepare seeded demo datasets for Fitness App, CRM Tool, and Productivity Tool.

Acceptance criteria:

- each demo dataset has a stable identifier
- seed format is defined
- expected counts and descriptions are documented

Dependencies:

- B2

Suggested order:

- seventh

## Epic C: Demo Dataset Vertical Slice

### Ticket C1: Implement feedback set creation flow

Description:

Allow the frontend to create an analysis target and feedback set for a new run.

Acceptance criteria:

- backend can create and persist an analysis target
- backend can create and persist a feedback set
- API returns identifiers needed for follow-on actions

Dependencies:

- B1
- B2

Suggested order:

- eighth

### Ticket C2: Implement demo dataset ingestion

Description:

Load one of the seeded demo datasets into a feedback set as a `demo_dataset` source.

Acceptance criteria:

- source record is created
- feedback items are inserted
- total counts are updated

Dependencies:

- B4
- C1

Suggested order:

- ninth

### Ticket C3: Implement analysis run creation and status tracking

Description:

Add persistent analysis runs with queued/running/completed/failed states.

Acceptance criteria:

- synthesis run can be created
- run status can be updated by step
- errors are persisted

Dependencies:

- B2
- C1

Suggested order:

- tenth

### Ticket C4: Implement synthesis orchestration skeleton

Description:

Create the initial multi-step synthesis workflow for demo data, even if some steps are placeholder implementations at first.

Acceptance criteria:

- run progresses through named stages
- stage output can be persisted
- completed run is retrievable

Dependencies:

- C2
- C3

Suggested order:

- eleventh

### Ticket C5: Implement analysis run fetch endpoint

Description:

Return a full dashboard payload for a completed analysis run.

Acceptance criteria:

- API returns dashboard-ready payload
- payload matches the documented contract

Dependencies:

- A1
- C4

Suggested order:

- twelfth

### Ticket C6: Wire the current demo frontend flow to live backend data

Description:

Replace the mock-only demo path with real API-driven synthesis and dashboard rendering.

Acceptance criteria:

- user can select a demo product and trigger real synthesis
- processing state reflects live run status
- dashboard renders from backend payload

Dependencies:

- C5

Suggested order:

- thirteenth

## Epic D: ML-Backed Synthesis Pipeline

### Ticket D1: Define category taxonomy and labeling rules

Description:

Finalize the first-pass category set and labeling guidance for the classifier.

Acceptance criteria:

- category list is locked for v1
- class definitions are documented
- churn-risk handling approach is documented

Dependencies:

- A1

Suggested order:

- parallel with Epic C after foundation exists

### Ticket D2: Prepare training dataset and evaluation split

Description:

Assemble public and synthetic data for the baseline classifier and define evaluation splits.

Acceptance criteria:

- training sources are documented
- evaluation split exists
- label balance is reviewed

Dependencies:

- D1

Suggested order:

- after D1

### Ticket D3: Train baseline classifier and package artifact

Description:

Train the first lightweight model and produce a versioned inference artifact.

Acceptance criteria:

- model trains successfully
- artifact can be loaded by backend
- baseline metrics are recorded

Dependencies:

- D2

Suggested order:

- after D2

### Ticket D4: Implement backend inference wrapper

Description:

Load the saved model artifact in the backend and expose classification as part of synthesis.

Acceptance criteria:

- backend can classify feedback items
- classification results are persisted

Dependencies:

- D3
- B1

Suggested order:

- after D3

### Ticket D5: Implement structured theme and summary generation

Description:

Transform classified items into themes, representative quotes, and dashboard summaries.

Acceptance criteria:

- themes are generated and stored
- representative quotes are selected and stored
- dashboard summary content is produced

Dependencies:

- D4
- C4

Suggested order:

- after D4

## Epic E: Custom Ingestion

### Ticket E1: Define CSV upload constraints and column-mapping behavior

Description:

Finalize supported file types, size caps, and fallback behavior when no text column is detected.

Acceptance criteria:

- constraints are documented
- text-column detection rules are defined
- fallback selection behavior is defined

Dependencies:

- A1

Suggested order:

- before CSV implementation

### Ticket E2: Implement CSV upload ingestion

Description:

Accept a CSV upload, store metadata, parse rows, and normalize them into feedback items.

Acceptance criteria:

- CSV file metadata is stored
- feedback rows are parsed
- source status is surfaced

Dependencies:

- B3
- E1

Suggested order:

- after demo slice stabilizes

### Ticket E3: Implement pasted feedback ingestion

Description:

Convert pasted text blocks into source records and normalized feedback items.

Acceptance criteria:

- pasted text becomes one source
- text is split into multiple items where possible
- item count is surfaced

Dependencies:

- C1

Suggested order:

- alongside or just after E2

### Ticket E4: Wire custom-source frontend flows to backend

Description:

Connect the existing custom product/source flow to real API behavior.

Acceptance criteria:

- review screen reflects real configured sources
- synthesis works for custom input

Dependencies:

- E2
- E3

Suggested order:

- after ingestion endpoints exist

## Epic F: Chatbot Follow-Up

### Ticket F1: Define retrieval strategy for grounded chat

Description:

Specify how the backend will retrieve evidence for answers without vector search in v1.

Acceptance criteria:

- scope filtering rules are documented
- evidence sources are defined
- prompt grounding strategy is defined

Dependencies:

- D5

Suggested order:

- after structured outputs exist

### Ticket F2: Implement chat endpoint for analysis runs

Description:

Accept a chat question tied to an analysis run and return a grounded response.

Acceptance criteria:

- backend accepts `ChatRequest`
- backend returns `ChatResponse`
- evidence is optionally included

Dependencies:

- F1
- D5

Suggested order:

- after F1

### Ticket F3: Wire frontend chat panel to backend

Description:

Replace canned frontend chat responses with live analysis-aware answers.

Acceptance criteria:

- chat works against current analysis
- scope selector affects answer behavior
- error states are visible

Dependencies:

- F2

Suggested order:

- after F2

## Epic G: X Integration

### Ticket G1: Define X query scope and fallback behavior

Description:

Finalize allowed query types, result caps, and rate-limit/error handling.

Acceptance criteria:

- query modes are defined
- caps are defined
- fallback UX is defined

Dependencies:

- A3

Suggested order:

- before implementation

### Ticket G2: Implement backend X source ingestion

Description:

Fetch recent public X posts using app-owned credentials and normalize them as a data source.

Acceptance criteria:

- X source records are created
- normalized items are stored
- failure cases are surfaced cleanly

Dependencies:

- G1
- B1
- C1

Suggested order:

- after custom ingestion and chat

### Ticket G3: Wire X source flow in frontend

Description:

Connect the existing X source UI to real source creation and synthesis behavior.

Acceptance criteria:

- X source appears in review flow
- dashboard labels X-derived results correctly

Dependencies:

- G2

Suggested order:

- after G2

## Epic H: Hardening and Deployment

### Ticket H1: Add parser and normalization tests

Description:

Create tests for CSV parsing, pasted text splitting, normalization, and deduplication.

Acceptance criteria:

- malformed input fixtures are covered
- expected parsed outputs are asserted

Dependencies:

- E2
- E3

Suggested order:

- after custom ingestion is implemented

### Ticket H2: Add contract validation tests

Description:

Validate backend payloads and frontend fixtures against shared contracts.

Acceptance criteria:

- dashboard payload contract is validated
- chat contract is validated

Dependencies:

- A1
- C5
- F2

Suggested order:

- after core API payloads exist

### Ticket H3: Add end-to-end smoke test for demo flow

Description:

Cover the core hiring-manager demo path from demo selection to dashboard.

Acceptance criteria:

- one end-to-end demo flow test exists
- major failure points are detectable

Dependencies:

- C6

Suggested order:

- after demo slice is live

### Ticket H4: Prepare Vercel, Railway, and Supabase deployment configs

Description:

Set up deployment-ready environment configuration and release flow.

Acceptance criteria:

- preview deploy strategy is documented
- required environment variables are documented
- health checks are defined

Dependencies:

- B1
- C6

Suggested order:

- once demo flow is stable

### Ticket H5: Add launch-ready privacy, validation, and abuse guardrails

Description:

Implement or document safeguards for public uploads and public usage.

Acceptance criteria:

- file limits are enforced or finalized
- privacy warnings are present
- basic rate-limiting strategy is defined

Dependencies:

- E2
- G2

Suggested order:

- before public launch

## Epic I: Repo Migration to Target Structure

### Ticket I1: Introduce `apps/api`, `packages/contracts`, `supabase`, `ml`, and `data/demo`

Description:

Create target directories while keeping the current root frontend intact.

Acceptance criteria:

- directories exist
- implementation can proceed without breaking current app

Dependencies:

- A1

Suggested order:

- early, after planning docs are in place

### Ticket I2: Move root frontend into `apps/web`

Description:

Relocate the Next.js app after the demo slice is stable.

Acceptance criteria:

- app still runs
- build/dev commands are updated
- no behavior regressions are introduced

Dependencies:

- C6
- I1

Suggested order:

- late

### Ticket I3: Centralize shared contract imports

Description:

Move ad hoc frontend types and backend payload definitions onto the shared contracts package.

Acceptance criteria:

- frontend and backend import shared contracts from one place
- duplicate definitions are removed

Dependencies:

- I1
- I2

Suggested order:

- after repo move stabilizes

## Critical Path Summary

The minimum viable critical path is:

1. A1
2. A3
3. B1
4. B2
5. B4
6. C1
7. C2
8. C3
9. C4
10. C5
11. C6
12. D1
13. D2
14. D3
15. D4
16. D5
17. F1
18. F2
19. F3

Custom ingestion and X integration should follow that path, not precede it.

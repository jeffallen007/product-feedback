# AI Product Feedback Synthesizer

AI Product Feedback Synthesizer is a portfolio demo application that turns fragmented product feedback into roadmap intelligence.

The app lets a user create a feedback set, synthesize product insights, review a dashboard, and ask follow-up questions through a chat interface. It is designed to demonstrate product thinking, full-stack execution, backend persistence, and applied AI product architecture.

## Live Demo

* Frontend: deployed on Vercel
* Backend: deployed on Railway
* Backend health check: `https://product-feedback-production.up.railway.app/health`

## What It Does

Product teams often receive feedback from many disconnected sources: customer interviews, support tickets, sales notes, app reviews, CSV exports, social posts, and internal research.

This app demonstrates a workflow for converting that fragmented feedback into:

* prioritized themes
* customer pain points
* product opportunities
* roadmap-relevant summaries
* follow-up answers through a chat interface

## Demo Flow

The currently supported end-to-end flow is the demo dataset path:

1. Choose `Try Demo Dataset`
2. Select a demo product, such as `Productivity Tool`
3. Create a feedback set
4. Synthesize the feedback set
5. Review the dashboard
6. Ask follow-up questions in chat

The deployed demo writes rows to Supabase and retrieves the dashboard through the backend API.

## Architecture

```text
Vercel Frontend
      ↓
Railway FastAPI Backend
      ↓
Supabase Database
```

## Tech Stack

### Frontend

* Next.js
* TypeScript
* React
* Tailwind-style component UI
* Vercel deployment

### Backend

* FastAPI
* Python
* Pydantic
* Pytest
* Railway deployment

### Database

* Supabase Postgres
* SQL migrations in `supabase/migrations`

## Current Implementation

Implemented:

* deployed Next.js frontend
* deployed FastAPI backend
* Supabase-backed demo dataset flow
* feedback set creation
* demo source creation
* synthesis run creation
* dashboard bundle retrieval
* persisted chat messages
* backend and frontend test coverage
* production deployment on Vercel and Railway

Backend endpoints:

* `GET /health`
* `POST /feedback-sets`
* `POST /feedback-sets/{feedback_set_id}/sources/demo`
* `POST /feedback-sets/{feedback_set_id}/synthesize`
* `GET /analysis-runs/{analysis_run_id}`
* `GET /analysis-runs/{analysis_run_id}/bundle`
* `POST /analysis-runs/{analysis_run_id}/chat`
* `GET /analysis-runs/{analysis_run_id}/chat`

## What Is Real vs Simulated

### Real

* deployed frontend on Vercel
* deployed backend on Railway
* Supabase persistence
* backend-owned demo dataset flow
* analysis run creation
* dashboard bundle retrieval
* chat message persistence
* frontend and backend validation tests

### Simulated / Placeholder

* synthesis logic currently uses deterministic demo content
* chatbot responses are placeholder logic
* CSV upload flow is presentational
* pasted feedback flow is presentational
* X/social search flow is presentational

This is intentional for the current version: the goal was to first build and deploy the full product skeleton, then progressively replace simulated intelligence with real ingestion, classification, and LLM-based synthesis.

## Repo Layout

```text
.
├── app/                 # Next.js app router frontend
├── components/          # Frontend UI components
├── lib/                 # Frontend services, types, mocks, adapters
├── apps/api/            # FastAPI backend
├── docs/                # PRD, architecture, contracts, planning docs
└── supabase/            # SQL migrations and related setup
```

## Local Development

### Frontend Setup

Install dependencies:

```bash
pnpm install
```

Copy the frontend env example:

```bash
cp .env.example .env.local
```

Start the frontend:

```bash
pnpm dev
```

The frontend runs at:

```text
http://localhost:3000
```

Frontend env vars:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_USE_BACKEND_DEMO=true
```

### Backend Setup

Create the backend env file:

```bash
cp apps/api/.env.example apps/api/.env
```

Fill in:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Create a virtual environment and install dependencies:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

Start the backend:

```bash
./.venv/bin/uvicorn app.main:app --env-file .env --reload
```

The backend runs locally at:

```text
http://127.0.0.1:8000
```

### MCP Server Setup

The MCP server is a thin integration layer over the existing FastAPI backend. It does not duplicate ingestion, synthesis, dashboard, or chat business logic.

Install MCP server dependencies in a Python environment:

```bash
python3 -m pip install -r apps/mcp/requirements.txt
```

Set the backend URL when using anything other than the local default:

```bash
export PRODUCT_FEEDBACK_BACKEND_BASE_URL=http://localhost:8000
```

Run the MCP server from the repo root:

```bash
python -m apps.mcp.server
```

The MCP server uses Streamable HTTP at `/mcp`. It binds to `0.0.0.0` and reads `PORT` from the environment, defaulting to `8001` for local runs.

Available MCP tools:

* `create_feedback_set`
* `add_pasted_feedback`
* `run_synthesis`
* `get_analysis_bundle`
* `ask_analysis_question`

Example agent workflow:

1. Call `create_feedback_set` with product name, description, and analysis goal.
2. Call `add_pasted_feedback` with the returned `feedback_set_id` and newline-separated feedback.
3. Call `run_synthesis` with the `feedback_set_id`.
4. Call `get_analysis_bundle` with the returned `analysis_run_id`.
5. Call `ask_analysis_question` with the `analysis_run_id` and a follow-up question.

### Railway MCP Deployment

Create a separate Railway web service for the MCP server.

Recommended Railway service root:

```text
/
```

Keep the service root at the repository root because the MCP modules import from `apps.mcp`.

Install command:

```bash
python -m pip install -r apps/mcp/requirements.txt
```

Start command:

```bash
python -m apps.mcp.server
```

Required environment variable:

```bash
PRODUCT_FEEDBACK_BACKEND_BASE_URL=https://your-fastapi-backend.example.com
```

Railway provides the `PORT` environment variable automatically. The MCP server reads it and exposes Streamable HTTP on `/mcp`.

## Supabase Setup

The backend demo path requires a Supabase project. The FastAPI backend persists:

* analysis targets
* feedback sets
* data sources
* analysis runs
* dashboard summaries
* chat messages

Apply the existing migration from `supabase/migrations/` before running the backend demo flow.

The frontend does not require Supabase credentials directly.

## Local End-to-End Demo

1. Start the backend from `apps/api`
2. Start the frontend from the repo root
3. Open the frontend in the browser
4. Choose `Try Demo Dataset`
5. Select a demo product
6. Click `Synthesize Feedback Set`

Expected behavior:

* frontend calls FastAPI instead of the mock-only demo path
* FastAPI writes rows to Supabase
* dashboard loads from the backend-owned analysis bundle
* chat uses the backend-backed demo flow when available

If the backend is unavailable, the frontend falls back to mock demo behavior.

## Testing

From the repo root:

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

From `apps/api`:

```bash
./.venv/bin/python -m pytest
```

Current validation status:

* frontend tests passing
* backend tests passing
* Next.js production build passing

## Deployment

### Railway Backend

Railway service root:

```text
apps/api
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Required Railway env vars:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_ENV=production
FRONTEND_ORIGINS=
```

`FRONTEND_ORIGINS` should include the deployed Vercel frontend URL and any local development origins needed.

### Vercel Frontend

The frontend deploys from the repo root.

Required Vercel env vars:

```bash
NEXT_PUBLIC_API_BASE_URL=https://product-feedback-production.up.railway.app
NEXT_PUBLIC_USE_BACKEND_DEMO=true
```

Do not put Supabase service role credentials in Vercel.

## Roadmap

Near-term product improvements:

* make dashboard synthesis content more realistic
* connect pasted feedback to the backend
* add CSV upload ingestion
* add real ML/LLM-based synthesis
* improve source-aware chat responses
* add stronger portfolio/demo narrative and screenshots

## Project Goal

This project is intended to show how an AI-native product workflow can move from raw customer feedback to structured product intelligence. It demonstrates the foundation for a system that could help product managers, founders, and customer-facing teams identify what customers are asking for, why it matters, and what to build next.

# API Scaffold

This backend scaffold uses `requirements.txt` instead of `pyproject.toml` to keep the first FastAPI setup as simple as possible for local iteration and Railway bootstrapping.

## Local Run

1. Copy the environment example and fill in placeholder values with your local Supabase project settings:

```bash
cp .env.example .env
```

Required variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

2. Create a virtual environment.
3. Install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

4. Start the API from `apps/api` with Uvicorn's built-in env file loading:

```bash
./.venv/bin/uvicorn app.main:app --env-file .env --reload
```

This loads `apps/api/.env` automatically, so no manual `source .env` step is required.

The health endpoint will be available at `GET /health`.

## Railway Deployment

Recommended Railway service root: `apps/api`

Install command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Required env vars:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional env vars:

- `APP_ENV=production`
- `FRONTEND_ORIGINS`
  Comma-separated allowed frontend origins for CORS, for example:

```bash
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app
```

### Analysis worker

Apply `supabase/migrations/20260925_000003_analysis_progress_jobs.sql` before enabling asynchronous synthesis. Deploy a separate Railway service from the same repository with root directory `apps/api`, the same Supabase credentials and optional OpenAI settings as the API, and start command:

```bash
python -m app.worker
```

The worker does not need a public domain. It claims queued analysis runs, records their actual stage changes, and marks a run complete only after the dashboard summary is saved. Keep the API service running for browser and MCP requests. The existing synchronous synthesis route stays available for MCP clients.

## Routes

- `GET /health`
- `POST /feedback-sets`
- `POST /feedback-sets/{feedback_set_id}/sources/demo`
- `POST /feedback-sets/{feedback_set_id}/synthesize`
- `POST /feedback-sets/{feedback_set_id}/analysis-runs` (queue a run; requires `analysisGoal` and a UUID `requestKey`)
- `GET /analysis-runs/{analysis_run_id}/progress`
- `GET /analysis-runs/{analysis_run_id}`
- `POST /analysis-runs/{analysis_run_id}/chat`
- `GET /analysis-runs/{analysis_run_id}/chat`
- `GET /analysis-runs/{analysis_run_id}/bundle`

`POST /feedback-sets/{feedback_set_id}/synthesize` remains synchronous for MCP and
other existing callers. It generates a dashboard from persisted feedback and
returns after the summary is saved. The asynchronous route queues the same
synthesis logic for the worker and returns immediately.

`POST /analysis-runs/{analysis_run_id}/chat` currently persists both the user message and a deterministic
placeholder assistant reply in `chat_messages`, without calling an LLM.

`GET /analysis-runs/{analysis_run_id}/chat` returns persisted chat history for the run in chronological order,
or an empty array when the run exists but has no chat messages yet.

`GET /analysis-runs/{analysis_run_id}/bundle` returns a backend-owned post-synthesis payload for the demo slice,
including the analysis run, feedback set, analysis target, sources, dashboard, chat history, and a placeholder
message when no dashboard summary exists.

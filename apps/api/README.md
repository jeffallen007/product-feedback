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

## Routes

- `GET /health`
- `POST /feedback-sets`
- `POST /feedback-sets/{feedback_set_id}/sources/demo`
- `POST /feedback-sets/{feedback_set_id}/synthesize`
- `GET /analysis-runs/{analysis_run_id}`
- `POST /analysis-runs/{analysis_run_id}/chat`
- `GET /analysis-runs/{analysis_run_id}/chat`
- `GET /analysis-runs/{analysis_run_id}/bundle`

`POST /feedback-sets/{feedback_set_id}/synthesize` currently creates both a placeholder
`analysis_runs` row and a placeholder `dashboard_summaries` row derived from persisted demo-source metadata.

`POST /analysis-runs/{analysis_run_id}/chat` currently persists both the user message and a deterministic
placeholder assistant reply in `chat_messages`, without calling an LLM.

`GET /analysis-runs/{analysis_run_id}/chat` returns persisted chat history for the run in chronological order,
or an empty array when the run exists but has no chat messages yet.

`GET /analysis-runs/{analysis_run_id}/bundle` returns a backend-owned post-synthesis payload for the demo slice,
including the analysis run, feedback set, analysis target, sources, dashboard, chat history, and a placeholder
message when no dashboard summary exists.

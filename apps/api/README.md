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

4. Start the API from `apps/api`:

```bash
uvicorn app.main:app --reload
```

The health endpoint will be available at `GET /health`.

## Routes

- `GET /health`
- `POST /feedback-sets`

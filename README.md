# AI Product Feedback Synthesizer

Portfolio demo application for synthesizing multi-source product feedback into a polished dashboard and follow-up chat experience.

Current stack:

- Frontend: Next.js at the repo root, intended for Vercel
- Backend: FastAPI in `apps/api`, intended for Railway
- Data: Supabase for persisted backend demo runs

Current scope:

- Demo dataset path can run end-to-end against the backend and persist rows to Supabase
- Custom CSV, pasted feedback, and X search flows remain mocked
- Dashboard synthesis content is still placeholder/demo content

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

## Frontend Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy the frontend env example:

```bash
cp .env.example .env.local
```

3. Start the frontend:

```bash
pnpm dev
```

The frontend runs at `http://127.0.0.1:3000` or `http://localhost:3000`.

Frontend env vars:

- `NEXT_PUBLIC_API_BASE_URL`
  Local default: `http://127.0.0.1:8000`
- `NEXT_PUBLIC_USE_BACKEND_DEMO`
  Set to `true` to enable the backend-backed demo dataset flow

## Backend Setup

1. Create the backend env file:

```bash
cp apps/api/.env.example apps/api/.env
```

2. Fill in:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

3. Create a backend virtualenv and install dependencies:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

4. Start the backend:

```bash
./.venv/bin/uvicorn app.main:app --env-file .env --reload
```

The backend runs locally at `http://127.0.0.1:8000`.

Backend env vars:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_ENV`
  Optional. Defaults to `development`.
- `FRONTEND_ORIGINS`
  Optional comma-separated list of allowed frontend origins for CORS.
  If unset, the backend allows:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
  - `http://localhost:3001`
  - `http://127.0.0.1:3001`

Example:

```bash
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Supabase Setup

The backend demo path requires a Supabase project because the FastAPI app persists:

- analysis targets
- feedback sets
- data sources
- analysis runs
- placeholder dashboard summaries
- chat messages

Apply the existing migration from `supabase/migrations/` in your Supabase project before running the backend demo flow.

The frontend does not require Supabase env vars directly.

## Local E2E Demo

1. Start the backend from `apps/api`.
2. Start the frontend from the repo root.
3. Open the frontend in the browser.
4. Choose `Try Demo Dataset`.
5. Select a demo product.
6. Continue to review and click `Synthesize Feedback Set`.

Expected behavior:

- frontend calls FastAPI instead of using the mock demo path
- FastAPI writes rows to Supabase
- dashboard loads from the backend-owned analysis bundle
- chat uses the backend-backed demo flow when available

If the backend is unavailable or returns an error, the frontend falls back to mock demo behavior.

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

## Deployment Notes

### Railway Backend

Recommended service root: `apps/api`

Build/install steps:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set these Railway env vars:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_ORIGINS`
  Set this to the eventual Vercel frontend origin, or a comma-separated list if needed.

Optional:

- `APP_ENV=production`

### Vercel Frontend

The frontend can stay at the repo root.

Set these Vercel env vars:

- `NEXT_PUBLIC_API_BASE_URL`
  Set this to the Railway backend URL
- `NEXT_PUBLIC_USE_BACKEND_DEMO=true`

Do not put Supabase service role credentials in Vercel.

## Next Deployment Steps

1. Create a Railway service rooted at `apps/api`.
2. Set Railway env vars for Supabase and `FRONTEND_ORIGINS`.
3. Create a Vercel project from the repo root.
4. Set Vercel frontend env vars to point at Railway.
5. Update `FRONTEND_ORIGINS` on Railway to the actual Vercel origin.
6. Run the demo dataset path against deployed services and verify rows are written to Supabase.

# Product Feedback Synthesizer — agent guidance

## What this project does

This is a public portfolio demo that turns customer feedback into themes,
evidence-backed insights, roadmap recommendations, and follow-up answers.
The core user flow is: choose an analysis target → add feedback sources →
run synthesis → inspect the dashboard → ask questions about the analysis.

Keep the distinction between the analysis target (a demo product or a custom
product name and description) and the feedback sources.

## Architecture and boundaries

- The Next.js frontend lives at the repository root and is documented as
  deployed to Vercel. Its main workflow calls FastAPI directly when
  `NEXT_PUBLIC_USE_BACKEND_DEMO=true` and `NEXT_PUBLIC_API_BASE_URL` is set;
  otherwise it uses in-memory mock data.
- The FastAPI backend lives in `apps/api` and is documented as deployed to
  Railway. It owns ingestion, synthesis, chat, and privileged Supabase access.
- Supabase stores feedback sets, sources, feedback items, analysis runs,
  dashboard summaries, and chat messages for backend-backed flows.
- `apps/mcp` is a separate Railway MCP service that calls the FastAPI backend.
  Keep business logic in FastAPI rather than duplicating it in MCP tools. The
  `/mcp-demo` page uses a Next.js server route, an OpenAI agent, and an MCP
  client to run the agent-facing workflow.
- Backend synthesis and chat use OpenAI when configured and fall back to
  deterministic results when the key is absent or an LLM request fails. The
  `/mcp-demo` agent requires an OpenAI key and has no scripted fallback.
- The working web input paths are demo datasets, pasted feedback, and CSV
  upload. X Search is marked as a future feature in the UI; do not treat it as
  a working input path unless the task explicitly implements it. MCP currently
  exposes pasted feedback ingestion, not CSV or demo-source ingestion.

Verify these descriptions against the current code before relying on them;
update this file when the architecture changes.

## How to approach a task

1. Read the relevant source and tests first. Use the PRDs, architecture notes,
   implementation plan, checkpoints, and UI notes in `docs/` when a task touches
   those decisions; do not load every doc for a small change. The PRDs,
   architecture notes, implementation plan, and UI notes describe intended or
   earlier states. Use the checkpoints for milestone context, then verify all
   claims against current code, schema migrations, tests, and observed behavior.
2. Trace behavior across the frontend, API, persistence, and MCP layer when
   a change crosses those boundaries.
3. Preserve the working demo, paste, and CSV flows while changing related code.
4. Keep changes scoped. If documentation and implementation disagree, report
   the discrepancy and use the current code and observed behavior to guide
   the fix. Do not treat unimplemented PRD features or old plan milestones as
   existing capabilities.
5. Check the working tree before editing and preserve unrelated user changes.

## Verification

Run checks relevant to the files changed. From the repository root, the
current commands are:

- Python API and MCP tests: `apps/api/.venv/bin/python -m pytest`
- Frontend types: `pnpm exec tsc --noEmit`
- Frontend tests: `pnpm test`
- Production build: `pnpm build`

The Python command uses the local `apps/api/.venv` and collects both
`apps/api/tests` and `apps/mcp/tests` from the root. If that environment is
absent, install the dependencies from both Python requirements files in a
suitable environment before running the same test directories. TypeScript's
incremental mode may write a build-info file; use `--incremental false` when
a check must leave the working tree untouched. A production build writes
generated `.next` files. For changes to a user flow, exercise that flow as
well as its automated checks. Report what ran, what passed, and anything that
could not be verified.

## Data, credentials, and deployment

- Do not commit API keys, Supabase credentials, `.env` files, or real customer
  feedback.
- Keep server-side secrets and privileged Supabase operations out of client
  code.
- Treat schema changes and data migrations as changes that need an explicit
  compatibility and verification plan.
- Before changing deployment configuration, inspect the current Vercel and
  Railway settings and document any required environment-variable changes.

## Completion

Finish the requested implementation, update relevant documentation when
behavior changes, review the diff for regressions, and give a concise summary
of the change and its verification.

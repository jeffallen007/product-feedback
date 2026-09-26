# Product Feedback Synthesizer — agent guidance

## What this project does

This is a public portfolio demo that turns customer feedback into themes,
evidence-backed insights, roadmap recommendations, and follow-up answers.
The core user flow is: choose an analysis target → add feedback sources →
run synthesis → inspect the dashboard → ask questions about the analysis.

Keep the distinction between the analysis target (a demo product or a custom
product name and description) and the feedback sources.

## Architecture and boundaries

- The Next.js frontend lives at the repository root and deploys to Vercel.
- The FastAPI backend lives in `apps/api` and deploys to Railway.
- Supabase stores feedback and analysis data.
- `apps/mcp` is a thin MCP integration layer over the FastAPI backend. Keep
  business logic in the shared backend rather than duplicating it in MCP tools.
- OpenAI powers synthesis and chat where configured. Understand the existing
  fallback behavior before changing it.
- The working input paths are demo datasets, pasted feedback, and CSV upload.
  X Search is presented as a future feature; do not treat it as a working
  input path unless the task explicitly implements it.

Verify these descriptions against the current code before relying on them;
update this file when the architecture changes.

## How to approach a task

1. Read the relevant source and tests first. Use the PRDs, architecture notes,
   implementation plan, checkpoints, and UI notes in the docs/ folder when the
   task touches those decisions; do not load every doc for a small change.
2. Trace behavior across the frontend, API, persistence, and MCP layer when
   a change crosses those boundaries.
3. Preserve the working demo, paste, and CSV flows while changing related code.
4. Keep changes scoped. If documentation and implementation disagree, report
   the discrepancy and use the current code and observed behavior to guide
   the fix.
5. Check the working tree before editing and preserve unrelated user changes.

## Verification

Run checks relevant to the files changed. The historically used commands are:

- API tests: `apps/api/.venv/bin/python -m pytest`
- Frontend types: `pnpm exec tsc --noEmit`
- Frontend tests: `pnpm test`
- Production build: `pnpm build`

Confirm these commands against the current package and Python setup. For
changes to a user flow, exercise that flow as well as its automated checks.
Report what ran, what passed, and anything that could not be verified.

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

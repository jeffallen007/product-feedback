# Real synthesis progress — implementation plan

Status: approved and implemented on `feature/live-synthesis-progress`; deployment is pending. This plan addresses the standard web demo and custom feedback flows. The existing MCP workflow must continue to work.

## Goal and acceptance criteria

- Show the processing view immediately after a valid **Synthesize Feedback Set** click, before the first network request completes.
- Advance each stage only when its corresponding request or backend operation completes. At most one stage is active; a later stage cannot finish before an earlier one. Let long stages remain indeterminate rather than inventing elapsed-time percentages.
- Show a useful error on the processing view if creation, ingestion, job start, polling, synthesis, or dashboard retrieval fails. Never navigate to a dashboard before its summary is persisted and retrievable.
- Preserve the demo, pasted feedback, CSV upload, mock-mode, chat, and MCP flows. X Search remains unavailable.
- Keep source counts and item counts tied to server responses; do not show the current placeholder defaults while a real run is pending.

## Current behavior and validated assumptions

- `app/page.tsx` awaits `runDemoAnalysis` before showing `ProcessingState`. That service awaits feedback-set creation, demo ingestion, synchronous synthesis, and bundle retrieval in order. The custom path also awaits creation, each source, and synthesis before changing screens.
- `components/processing-state.tsx` advances eight labels every 520 ms, then waits 600 ms. Its progress is independent of backend work. The labels come from `lib/mocks/dashboard.ts`.
- FastAPI's `POST /feedback-sets/{id}/synthesize` finishes the work before returning. `AnalysisRunService.create_placeholder_run` currently inserts a run marked `completed` before generation, and `_to_analysis_run_response` returns `steps=[]`. The persisted run is therefore not yet a trustworthy progress source.
- Demo ingestion reads a local CSV, infers review attributes, and persists the source and feedback items. It already runs before synthesis. OpenAI synthesis can fall back to deterministic output on missing key or LLM failure.
- `analysis_runs` already has `queued`, `running`, `completed`, and `failed` statuses plus `current_step`, timestamps, and `error_message`. There is no job worker or durable step history. The existing API and MCP endpoint are synchronous.
- The current frontend test runner is Vitest with a Node environment; its tests cover service calls, not the timed processing component's rendered behavior.

Read-only baseline checks run on September 25, 2026:

| Check | Result |
| --- | --- |
| `PYTHONDONTWRITEBYTECODE=1 apps/api/.venv/bin/python -m pytest -p no:cacheprovider` | 80 passed, including API and MCP tests |
| `pnpm test` | 22 passed across 5 files |
| `pnpm exec tsc --noEmit --incremental false` | Passed |

No production synthesis was submitted for this planning task; the reported 20–40 second delay has not been apportioned among ingestion, Supabase, OpenAI, and bundle retrieval. Measure stage durations in a staging run before tuning polling or timeouts. A production build was not needed to validate these design assumptions.

## Proposed user-visible stages

1. **Creating feedback set** — the current create request returns.
2. **Ingesting feedback** — every selected source request returns successfully. For multiple sources, show `n of N sources` within this stage.
3. **Starting analysis** — the new asynchronous start endpoint returns a run ID.
4. **Loading and preparing feedback** — the worker loads persisted rows and prepares the synthesis input.
5. **Generating insights** — the worker completes the existing OpenAI or deterministic synthesis call. This can be the longest stage.
6. **Saving dashboard** — the worker persists the dashboard and marks the run complete.
7. **Opening dashboard** — the browser fetches and validates the completed bundle.

The first three stages are confirmed by browser request results; the last three are confirmed by persisted backend status. The active stage has an indeterminate per-stage bar, which fills only on completion; later stages stay pending. An overall bar can use completed-stage count, clearly representing stages rather than time or item-level percentage. Remove or rename the current untracked labels for deduplication and trained ML classification unless those operations are actually implemented and instrumented. The processing view should not add a fixed delay after completion.

## API and persistence design

1. Add `POST /feedback-sets/{feedback_set_id}/analysis-runs` (proposed name) to validate that the set has ingested items, create a `queued` run, and return `202 Accepted` with its ID immediately. Accept the selected analysis goal and a client-generated idempotency key; a repeated start request with the same key returns the same run. Persist the goal with the run so the worker does not depend on mutable feedback-set state.
2. Add `GET /analysis-runs/{analysis_run_id}/progress` returning only run status, current stage, ordered stage statuses and timestamps, safe error text, and completion metadata. Do not return the full dashboard or customer feedback on each poll. Unknown IDs return 404. The browser fetches the existing bundle once after `completed`.
3. Add an **additive** Supabase migration for durable run-step rows, an idempotency key, and worker claim/lease fields. Keep the existing run-status constraint and historical runs readable. Use a service-role-only database function to atomically claim a queued or expired run; prevent two workers from executing the same claim. Give steps unique `(analysis_run_id, ordinal)` identity, status, and start/end timestamps.
4. Refactor the current synthesis service so synchronous and queued entry points call the same analysis logic. The worker records `running` and each actual stage boundary. It writes the summary and changes the run to `completed` only after persistence succeeds; ideally one database transaction/function finalizes both. On an unrecoverable error, record `failed`, a safe message, and the failed stage. Keep the existing missing-key, timeout, invalid-LLM-output, and LLM-error deterministic fallback behavior and store the chosen synthesis method.
5. Add a Railway worker process using the `apps/api` code and dependencies. It claims runs atomically, renews a lease during work, resumes or fails abandoned runs after a bounded number of attempts, and uses an upsert/transaction for the unique dashboard summary so retries cannot duplicate it. Log run ID, stage, and elapsed time without feedback text or secrets. A process-local FastAPI background task alone would lose queued work on a restart, so it is not the recommended durability mechanism.
6. Keep `POST /feedback-sets/{id}/synthesize` synchronous for the existing MCP `run_synthesis` tool and other callers. Share the service logic, but do not silently change its response timing or shape in this rollout. Correct its premature `completed` state as part of the shared lifecycle refactor without breaking its final response.

The new database migration needs a compatibility review: old API instances must tolerate added columns/table, and new API instances must not enqueue work before the worker and claim function are deployed. No table drop or rewrite of historical runs is planned. Inspect the actual Railway and Supabase configuration before implementation/deployment; README values are documentation, not proof of live settings.

## Frontend design

1. In `app/page.tsx`, validate required inputs before leaving review, then snapshot the selected target, goal, sources, and CSV file on click, enter `processing` immediately, and start orchestration after that view mounts. Guard against double starts and stale callbacks. Keep creation and ingestion sequential as today so a later stage never completes early.
2. Move request orchestration into a focused controller/service that emits stage transitions and retains `feedbackSetId` and `analysisRunId`. Reuse the existing create and source endpoints. After all source requests succeed, call the new start endpoint and poll progress about every 1–2 seconds while the page is visible; back off transient polling errors, surface a sustained connection problem, and stop at a terminal status.
3. Replace `ProcessingState`'s `setTimeout` progression with props/state from that controller. Render the actual completed, active, pending, and failed stages. Update counts from responses. A failed create/ingest/start stage should offer a clear **Start over** action; do not blindly retry a write that may have succeeded server-side. A polling interruption can retry the read using the same run ID.
4. Fetch and validate the dashboard bundle after a `completed` status, then navigate immediately. If the summary is unexpectedly missing, show an error rather than a finished progress display. The dashboard's existing load and cached-bundle behavior should still work.
5. For backend-disabled mock mode, retain a working demo/custom path but avoid presenting timer-driven steps as real processing. Finish the mock operation and proceed without the eight-step simulation, or label any preview animation explicitly as simulated.
6. Store the run ID in a URL query parameter once received so a reload during synthesis can resume polling. A reload before a run ID exists may require starting over; document this limit in the UI. Aborting a browser poll must not cancel a queued server job.

## Implementation order

1. Record staging timings for existing create, ingest, synthesize, and bundle requests; inspect live Railway service definitions, Vercel variables, and Supabase migration state. Confirm the deploy sequence and worker budget.
2. Add the migration, claim/finalize operations, status contract, and backend service split. Cover queued/running/completed/failed transitions and legacy synchronous behavior with fake clients before wiring a worker.
3. Add and validate the worker in staging, including a forced worker restart, lease recovery, idempotent finalization, and an OpenAI-failure fallback. Keep the old synchronous endpoint active.
4. Implement immediate frontend transition and real stages for demo, paste, CSV, and mock mode. Add focused tests for the controller with deferred requests and rendered processing behavior, then manually exercise the flows in a browser.
5. Deploy migration, backend, and worker before enabling the new Vercel frontend path. Gate the new path with a frontend feature flag so the existing synchronous path is available for rollback. Verify the deployed staging flow and then production with a controlled demo run.
6. Update README, data-contracts, and AGENTS.md when the behavior and architecture actually change. Review the final diff and deployed timings.

## Verification and rollout gates for implementation

- API tests: fast `202` response; idempotent run start; no-source rejection; ordered progress; no completed status before dashboard persistence; safe failed status; LLM fallback; claim contention; worker crash/reclaim; no duplicate summary; legacy synchronous endpoint and MCP client remain compatible.
- Frontend tests: processing screen appears before deferred network responses settle; each stage advances only on its real completion; longer synthesis remains active; no out-of-order completion; error and polling recovery; no duplicate submit; correct counts; dashboard only after complete; mock mode does not claim backend progress.
- Run `apps/api/.venv/bin/python -m pytest`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm build` once implementation starts. Exercise demo, paste, and CSV end to end against staging, including an OpenAI fallback and a deliberately failed job. Check MCP `run_synthesis` separately.
- Observe run IDs and stage durations in logs. Monitor queued jobs, stale leases, failure rate, and poll errors during rollout. Roll back by disabling the frontend feature flag while keeping the additive migration and synchronous endpoint; let already queued jobs finish or mark them failed explicitly.

Deployment changes expected: a Railway worker service with the same server-side Supabase and OpenAI settings as the API, plus optional poll/lease configuration; an additive Supabase migration; and a Vercel frontend flag for the new path. No privileged credentials belong in client code. The exact live service settings must be checked before those changes are made.

## Decisions and deployment ownership

- **Progress labels:** The owner approved replacing the eight timed labels with stages backed by real request or worker completion.
- **Worker service:** The owner approved a separate Railway worker service for durable progress and restart recovery.
- **Who configures Railway:** On September 25, 2026, the local Railway CLI (v5.48.0) was authenticated and could list the `product-feedback` project; this checkout was not linked to a Railway project. Codex should prepare the worker code and deployment configuration, inspect the existing project's service settings, and configure the worker through the authenticated CLI when implementation and deployment are authorized. No Railway change was made during planning. The owner's action is needed only if the account lacks permission, reaches a billing/service limit, or an interactive account step cannot be completed by Codex. Do not ask the owner to create the service in advance.

If Codex cannot create the service, provide these finalized instructions to the owner, adjusted to the actual worker entry point and inspected service settings:

1. In the existing Railway `product-feedback` project and the same environment as the FastAPI service, create a separate service named `product-feedback-worker`. Connect it to the same GitHub repository and branch. Set its Root Directory to `/apps/api`, matching the API's intended Python project root. [Railway monorepo guide](https://docs.railway.com/guides/deploying-a-monorepo).
2. Set its custom build command to `pip install -r requirements.txt` if Railway does not detect the Python requirements correctly. Set its custom start command to the worker module added during implementation (planned: `python -m app.worker`). Configure one replica initially. The worker needs no public domain. [Railway build/start commands](https://docs.railway.com/builds/build-and-start-commands), [Railway worker guide](https://docs.railway.com/guides/cron-workers-queues).
3. In the worker's Variables tab, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` using Railway references/shared variables where possible. Add `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_TIMEOUT_SECONDS` if the API uses them in that environment; preserve the existing deterministic fallback when no OpenAI key is configured. Set worker poll/lease variables only if the implementation introduces them. Do not paste secrets into files, chat, or client-side variables. [Railway variables guide](https://docs.railway.com/variables).
4. Apply the additive Supabase migration first. Deploy the API and worker, then confirm the worker logs show successful startup and that a staging run moves from `queued` through the real stages to `completed`. Only then enable the new Vercel frontend flag and redeploy the frontend. Keep the old synchronous API path for rollback.

The precise command, variable names, and Railway settings must be rechecked against the implemented worker and live API service before anyone follows these instructions. The owner does not need to take these steps now.

## Implementation notes and deployment status

- The additive migration stores the three worker stages as ordered JSON in `analysis_runs.steps_json`, rather than creating a separate run-step table. The existing run row is the single source for a status poll; a worker claim resets those stages when an expired lease is retried. Claim, lease renewal, and dashboard finalization are service-role-only PostgreSQL functions. Finalization saves the summary and marks the run completed in one transaction.
- The frontend flag is `NEXT_PUBLIC_USE_ASYNC_SYNTHESIS=true`, and it only takes effect when the backend demo path is enabled. The flag remains off by default. The old synchronous route remains available for MCP and rollback.
- A local PostgreSQL 17 instance applied all three migrations and exercised claim, expired-lease reclaim, step reset, finalization, and rejection of the former worker's stale claim. Automated API and frontend tests, type checking, and a production build passed during implementation.
- The Railway project has a production environment with API and MCP services but no staging environment. The API service uses the GitHub repository's `main` branch, root `/apps/api`, and the `uvicorn app.main:app --host 0.0.0.0 --port $PORT` start command. No Supabase migration, Railway service, Vercel variable, or production deploy has been changed yet. Deployment should follow the sequence above after the implementation branch is reviewed and merged.

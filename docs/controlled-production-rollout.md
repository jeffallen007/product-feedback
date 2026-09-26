# Controlled production rollout: live synthesis progress

This runbook applies to [PR #1](https://github.com/jeffallen007/product-feedback/pull/1) and the [implementation plan](./synthesis-progress-implementation-plan.md). Use it after PR review. The Railway project has a production API and MCP service but no worker. The new web flow is gated by `NEXT_PUBLIC_USE_ASYNC_SYNTHESIS`, which must stay unset or `false` until the database, API, and worker have been verified.

## 1. Prepare and review

1. Review PR #1, including the migration, worker, API, frontend changes, tests, and implementation plan. The PR's Vercel preview build passed when this runbook was written; check its latest status before merging.
2. Record the currently healthy Vercel and Railway API deployment IDs so they are easy to find if rollback is needed.
3. In the Supabase `product-feedback` project, check **Database → Backups** for an available backup. Backup availability depends on the plan. See the [Supabase backup guide](https://supabase.com/docs/guides/platform/backups).
4. Confirm that the Vercel Production value of `NEXT_PUBLIC_USE_ASYNC_SYNTHESIS` is absent or `false`. Keep it that way through step 4.

## 2. Apply the migration, then merge

The migration only adds columns, indexes, and functions. Apply it while the current API is still serving traffic. From the repository root:

```bash
supabase link --project-ref lepzqrdsbyvwjnxfckvw
supabase migration list
supabase db push --dry-run
```

The CLI may ask for the production database password. Do not put that password in chat, a repository file, or a shell command that will be recorded in history.

**Stop if the dry run proposes anything other than `20260925_000003_analysis_progress_jobs.sql`.** Reconcile the remote migration history before proceeding. If it shows only that migration, apply it:

```bash
supabase db push
```

See the [Supabase CLI workflow](https://supabase.com/docs/guides/local-development/cli-workflows) for linking, previewing, and pushing migrations.

After the migration succeeds, mark PR #1 ready and merge it into `main`. Confirm that the Railway API and Vercel production deployments reach the merged commit. With the frontend flag still off, exercise the existing demo flow and confirm it reaches a dashboard.

## 3. Deploy a Railway worker

In Railway's existing **product-feedback → production** environment, create a separate service named `product-feedback-worker`. Configure it as follows:

| Setting | Value |
| --- | --- |
| Repository | `jeffallen007/product-feedback` |
| Branch | `main` |
| Root directory | `/apps/api` |
| Start command | `python -m app.worker` |
| Replicas | 1 |
| Public domain | None |

Give the worker `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Match the API's `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_TIMEOUT_SECONDS` settings so it uses the same synthesis configuration. Use Railway variable references to the existing API service where possible; do not paste secrets into repository files. Deploy the staged changes. In worker logs, confirm `Analysis worker started` appears and there are no repeated startup errors.

Railway documents [monorepo root settings](https://docs.railway.com/deployments/monorepo), [variable references](https://docs.railway.com/variables), and [workers without public domains](https://docs.railway.com/guides/embeddings-pipeline).

## 4. Run one API canary while the frontend flag is off

Use the production API to create **one synthetic demo feedback set**:

1. `POST /feedback-sets` with an `analysisTarget` name and description and `analysisGoal: "Full Product Feedback Synthesis"`.
2. `POST /feedback-sets/{feedback_set_id}/sources/demo` with `demoProductId: "productivity_tool"`.
3. `POST /feedback-sets/{feedback_set_id}/analysis-runs` with the analysis goal and a fresh UUID `requestKey`. Confirm it returns HTTP **202** promptly and includes an `analysisRun.id`.
4. Poll `GET /analysis-runs/{analysis_run_id}/progress`. Confirm the run moves from `queued` to `running` to `completed`, and that `prepare_feedback`, `generate_insights`, and `save_dashboard` complete in order.
5. Fetch `GET /analysis-runs/{analysis_run_id}/bundle` and confirm its `dashboard` is present. Check the worker logs for the run ID and a completion message.

The API base URL is `https://product-feedback-production.up.railway.app`. This canary writes synthetic demo rows to production. If the run stays queued, fails, or has no dashboard, **leave the frontend flag off** and investigate the API and worker logs.

## 5. Enable the web flow and observe it

In **Vercel → product-feedback → Settings → Environment Variables**, add `NEXT_PUBLIC_USE_ASYNC_SYNTHESIS=true` for **Production**, then create a new production deployment. Environment-variable changes only affect new deployments. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

At `https://product-feedback-two-green.vercel.app/`, run the demo path. The processing view should appear immediately after **Synthesize Feedback Set** is clicked. Stages should complete in order; **Generating insights** may take longer than other stages. Confirm the dashboard and chat work. Then check one pasted-feedback flow, one CSV flow, and the MCP demo. Watch API and worker logs for failures and jobs stuck in `queued` or `running`.

## Rollback

- **UI problem:** Roll Vercel back to the production deployment from step 2, which was built with the flag off. Also remove the flag or set it to `false` before a future redeploy. Vercel notes that Instant Rollback restores an earlier build and pauses automatic production-domain assignment until the rollback is undone. See the [Vercel rollback guide](https://vercel.com/docs/instant-rollback).
- **Worker problem:** Turn the frontend flag off, then restore the worker's last healthy Railway deployment or fix it. Queued runs may wait until a healthy worker returns.
- **API problem:** Turn the frontend flag off and roll the Railway API back to its last healthy deployment. See the [Railway rollback guide](https://docs.railway.com/guides/roll-back-bad-deploy).

Leave the additive database migration in place for an ordinary code rollback. Restoring the entire database to an earlier point could discard feedback and analysis runs created since then.

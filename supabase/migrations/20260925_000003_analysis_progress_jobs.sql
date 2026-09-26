alter table public.analysis_runs
  add column if not exists request_key uuid,
  add column if not exists steps_json jsonb not null default '[]'::jsonb,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists worker_id text,
  add column if not exists lease_expires_at timestamptz;

create unique index if not exists idx_analysis_runs_request_key
  on public.analysis_runs (request_key) where request_key is not null;

create index if not exists idx_analysis_runs_claim
  on public.analysis_runs (status, lease_expires_at, created_at);

create or replace function public.claim_next_analysis_run(
  p_worker_id text,
  p_lease_seconds integer
)
returns setof public.analysis_runs
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_lease_seconds < 30 or p_lease_seconds > 3600 then
    raise exception 'Invalid lease duration';
  end if;

  update public.analysis_runs
  set status = 'failed',
      error_message = 'Analysis stopped after repeated worker interruptions.',
      current_step = coalesce(current_step, 'prepare_feedback'),
      completed_at = now(),
      lease_expires_at = null,
      worker_id = null
  where status = 'running'
    and lease_expires_at < now()
    and attempt_count >= 3;

  return query
  with candidate as (
    select id
    from public.analysis_runs
    where attempt_count < 3
      and (status = 'queued' or (status = 'running' and lease_expires_at < now()))
    order by created_at
    for update skip locked
    limit 1
  )
  update public.analysis_runs as run
  set status = 'running',
      worker_id = p_worker_id,
      attempt_count = run.attempt_count + 1,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      started_at = coalesce(run.started_at, now()),
      error_message = null,
      current_step = null,
      steps_json = case
        when run.status = 'running' then (
          select jsonb_agg(
            jsonb_build_object(
              'name', step.value->>'name',
              'status', 'pending',
              'startedAt', null,
              'completedAt', null
            ) order by step.ordinality
          )
          from jsonb_array_elements(run.steps_json) with ordinality as step(value, ordinality)
        )
        else run.steps_json
      end
  from candidate
  where run.id = candidate.id
  returning run.*;
end;
$$;

create or replace function public.renew_analysis_run_lease(
  p_run_id uuid,
  p_worker_id text,
  p_attempt_count integer,
  p_lease_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_lease_seconds < 30 or p_lease_seconds > 3600 then
    raise exception 'Invalid lease duration';
  end if;

  update public.analysis_runs
  set lease_expires_at = now() + make_interval(secs => p_lease_seconds)
  where id = p_run_id
    and status = 'running'
    and worker_id = p_worker_id
    and attempt_count = p_attempt_count;
  return found;
end;
$$;

create or replace function public.finish_analysis_run(
  p_run_id uuid,
  p_worker_id text,
  p_attempt_count integer,
  p_dashboard jsonb,
  p_metadata jsonb,
  p_steps jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.analysis_runs
  where id = p_run_id
    and status = 'running'
    and worker_id = p_worker_id
    and attempt_count = p_attempt_count
  for update;
  if not found then
    return false;
  end if;

  insert into public.dashboard_summaries (analysis_run_id, summary_payload)
  values (p_run_id, p_dashboard)
  on conflict (analysis_run_id) do update
  set summary_payload = excluded.summary_payload,
      updated_at = now();

  update public.analysis_runs
  set status = 'completed',
      current_step = 'save_dashboard',
      metadata_json = p_metadata,
      steps_json = p_steps,
      completed_at = now(),
      error_message = null,
      lease_expires_at = null,
      worker_id = null
  where id = p_run_id;
  return true;
end;
$$;

revoke all on function public.claim_next_analysis_run(text, integer) from public, anon, authenticated;
revoke all on function public.renew_analysis_run_lease(uuid, text, integer, integer) from public, anon, authenticated;
revoke all on function public.finish_analysis_run(uuid, text, integer, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.claim_next_analysis_run(text, integer) to service_role;
grant execute on function public.renew_analysis_run_lease(uuid, text, integer, integer) to service_role;
grant execute on function public.finish_analysis_run(uuid, text, integer, jsonb, jsonb, jsonb) to service_role;

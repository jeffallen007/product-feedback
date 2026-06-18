create extension if not exists pgcrypto;

create table if not exists analysis_targets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists feedback_sets (
  id uuid primary key default gen_random_uuid(),
  analysis_target_id uuid not null references analysis_targets(id) on delete cascade,
  name text,
  analysis_goal text not null,
  status text not null check (status in ('draft', 'ready', 'processing', 'completed', 'failed')),
  total_feedback_count integer not null default 0 check (total_feedback_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists data_sources (
  id uuid primary key default gen_random_uuid(),
  feedback_set_id uuid not null references feedback_sets(id) on delete cascade,
  source_type text not null check (source_type in ('demo_dataset', 'csv_upload', 'pasted_text', 'x_search')),
  source_label text not null,
  item_count integer not null default 0 check (item_count >= 0),
  status text not null check (status in ('pending', 'ready', 'processing', 'failed')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists feedback_items (
  id uuid primary key default gen_random_uuid(),
  feedback_set_id uuid not null references feedback_sets(id) on delete cascade,
  source_id uuid not null references data_sources(id) on delete cascade,
  source_type text not null check (source_type in ('demo_dataset', 'csv_upload', 'pasted_text', 'x_search')),
  source_label text not null,
  raw_text text not null,
  normalized_text text not null,
  rating numeric(4,2),
  feedback_date timestamptz,
  author_handle text,
  url text,
  category text check (category in ('bug_report', 'feature_request', 'ux_issue', 'pricing_concern', 'performance_issue', 'onboarding_friction', 'positive_feedback', 'support_complaint', 'churn_risk', 'unknown')),
  sentiment text check (sentiment in ('positive', 'neutral', 'negative', 'mixed')),
  severity text check (severity in ('low', 'medium', 'high', 'critical')),
  churn_risk boolean,
  theme_id uuid,
  dedupe_hash text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists analysis_runs (
  id uuid primary key default gen_random_uuid(),
  feedback_set_id uuid not null references feedback_sets(id) on delete cascade,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  current_step text,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists dashboard_summaries (
  id uuid primary key default gen_random_uuid(),
  analysis_run_id uuid not null unique references analysis_runs(id) on delete cascade,
  summary_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  analysis_run_id uuid not null references analysis_runs(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  question text,
  answer text,
  scope text not null check (scope in ('all', 'demo_dataset', 'csv_upload', 'pasted_text', 'x_search')),
  evidence_json jsonb not null default '[]'::jsonb,
  follow_up_suggestions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_feedback_sets_analysis_target_id on feedback_sets (analysis_target_id);
create index if not exists idx_data_sources_feedback_set_id on data_sources (feedback_set_id);
create index if not exists idx_feedback_items_feedback_set_id on feedback_items (feedback_set_id);
create index if not exists idx_feedback_items_source_id on feedback_items (source_id);
create index if not exists idx_feedback_items_category on feedback_items (category);
create index if not exists idx_feedback_items_sentiment on feedback_items (sentiment);
create index if not exists idx_analysis_runs_feedback_set_id on analysis_runs (feedback_set_id);
create index if not exists idx_chat_messages_analysis_run_id on chat_messages (analysis_run_id);

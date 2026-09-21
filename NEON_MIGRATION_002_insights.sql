-- Migration 002: insight feedback for "Why Am I Feeling This Way?"
-- Run: PG_URL='<connection-string>' node scripts/migrate-sql.mjs NEON_MIGRATION_002_insights.sql

create table if not exists insight_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  insight_key text not null,
  insight_type text not null default '',
  action text not null check (action in ('helpful','dismissed','hidden_type','corrected')),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, insight_key, action)
);
create index if not exists insight_feedback_user_idx on insight_feedback (user_id, created_at desc);

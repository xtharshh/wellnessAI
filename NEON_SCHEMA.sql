-- MindTrace AI — Neon Postgres schema (production, replaces Supabase)
-- Run once against your Neon database (pooled connection string is fine for DDL).
-- gen_random_uuid() is built-in on Postgres 13+; no extensions required.

-- ─── Users & auth ────────────────────────────────────────────────
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text not null default '',
  avatar_url text,
  privacy_consent_at timestamptz,
  onboarding_complete boolean not null default false,
  dob text,
  gender text,
  height numeric,
  weight numeric,
  body_fat numeric,
  blood_type text,
  resting_hr numeric,
  activity_level text,
  daily_steps_goal integer,
  sleep_duration_goal numeric,
  water_intake_goal integer,
  created_at timestamptz not null default now()
);
create index if not exists users_email_idx on users (lower(email));

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions (user_id);
create index if not exists sessions_expiry_idx on sessions (expires_at);

create table if not exists reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists reset_tokens_user_idx on reset_tokens (user_id);

-- ─── Settings ────────────────────────────────────────────────────
create table if not exists user_settings (
  user_id uuid primary key references users(id) on delete cascade,
  notifications_enabled boolean not null default true,
  data_sharing_enabled boolean not null default false,
  theme text not null default 'light' check (theme in ('light','dark'))
);

-- ─── Wellness snapshots (real device telemetry only) ─────────────
create table if not exists wellness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  mood_score numeric not null,
  sleep_hours numeric not null,
  activity_level numeric not null,
  stress_index numeric not null,
  risk_level text not null check (risk_level in ('low','medium','high')),
  metadata jsonb not null default '{}'
);
create index if not exists snapshots_user_time_idx on wellness_snapshots (user_id, recorded_at desc);

-- ─── Recommendations ─────────────────────────────────────────────
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null check (category in ('sleep','mindfulness','activity','general')),
  priority integer not null default 3,
  generated_at timestamptz not null default now(),
  dismissed boolean not null default false,
  completed boolean not null default false
);
create index if not exists recs_user_idx on recommendations (user_id, dismissed, priority);

-- ─── Lifestyle items ─────────────────────────────────────────────
create table if not exists lifestyle_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  creator text not null default '',
  category text not null,
  description text not null default '',
  reason text not null default '',
  image_url text,
  link_url text,
  custom boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists lifestyle_user_idx on lifestyle_items (user_id, created_at desc);

-- ─── Journals ────────────────────────────────────────────────────
create table if not exists journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  mood_score numeric not null default 50,
  mood_tag text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists journals_user_idx on journals (user_id, created_at desc);

-- ─── Exercises ───────────────────────────────────────────────────
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  duration text not null default '',
  steps jsonb not null default '[]',
  explanation text not null default '',
  category text not null default 'general',
  custom boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists exercises_user_idx on exercises (user_id, created_at desc);

-- ─── Doctors & appointments ──────────────────────────────────────
create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  specialty text not null default 'General wellness',
  bio text,
  avatar_url text,
  is_available boolean not null default true,
  session_url text,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  doctor_id uuid references doctors(id) on delete set null,
  scheduled_at timestamptz not null,
  mode text not null check (mode in ('video','chat','in_person')),
  status text not null default 'requested'
    check (status in ('requested','confirmed','completed','cancelled')),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists appts_user_idx on appointments (user_id, scheduled_at);

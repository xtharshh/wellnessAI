-- Create lifestyle_items table for persisting AI-suggested music, books, movies, etc.
-- Run this SQL in your Supabase project's SQL Editor

create table public.lifestyle_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  creator text not null,
  category text not null,
  description text not null,
  reason text not null,
  image_url text,
  link_url text,
  custom boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.lifestyle_items enable row level security;

-- Create RLS policies
create policy "Users can view own lifestyle items" on public.lifestyle_items
  for select using (auth.uid() = user_id);

create policy "Users can insert own lifestyle items" on public.lifestyle_items
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own lifestyle items" on public.lifestyle_items
  for delete using (auth.uid() = user_id);

-- Create index on user_id for better query performance
create index idx_lifestyle_items_user_id on public.lifestyle_items(user_id);

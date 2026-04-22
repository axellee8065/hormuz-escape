-- ============================================================
--  HORMUZ ESCAPE — Supabase schema
--  Run in Supabase SQL Editor once per project.
-- ============================================================

-- ---------- TABLE ----------
create table if not exists public.scores (
  id          bigserial primary key,
  user_id     text        not null,
  user_name   text        not null,
  score       integer     not null,
  stage       integer     not null default 1,
  distance    integer     not null default 0,
  duration_s  integer     not null default 0,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

-- ---------- INDEXES ----------
create index if not exists scores_score_desc_idx
  on public.scores (score desc);

create index if not exists scores_user_idx
  on public.scores (user_id);

create index if not exists scores_created_idx
  on public.scores (created_at desc);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.scores enable row level security;

-- Anyone (including anon) can read the leaderboard
drop policy if exists "public read scores" on public.scores;
create policy "public read scores"
  on public.scores
  for select
  using (true);

-- Anyone can insert, but with strict validation to block abuse
drop policy if exists "anyone can insert scores" on public.scores;
create policy "anyone can insert scores"
  on public.scores
  for insert
  with check (
        score      >= 0
    and score      <  10000000          -- hard cap; raise if needed
    and stage      between 1 and 50
    and distance   between 0 and 10000000
    and duration_s between 0 and 36000  -- 10 hours sanity cap
    and length(user_name) between 1 and 18
    and length(user_id)   between 1 and 64
  );

-- ---------- CONVENIENCE VIEW: top 100 ----------
create or replace view public.scores_top100 as
  select
    id, user_id, user_name, score, stage, distance, created_at
  from public.scores
  order by score desc
  limit 100;

-- ---------- OPTIONAL: per-user best score view ----------
create or replace view public.scores_best_by_user as
  select distinct on (user_id)
    user_id, user_name, score, stage, distance, created_at
  from public.scores
  order by user_id, score desc;

-- ---------- OPTIONAL: simple daily leaderboard ----------
create or replace view public.scores_today as
  select id, user_id, user_name, score, stage, distance, created_at
  from public.scores
  where created_at >= (now() - interval '24 hours')
  order by score desc
  limit 100;

-- ============================================================
--  Done. The frontend (index.html) only needs SUPABASE_URL and
--  SUPABASE_ANON_KEY from Settings → API.
-- ============================================================

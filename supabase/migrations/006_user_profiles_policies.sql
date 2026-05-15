-- =============================================================================
-- Migration 006 — Explicit per-command RLS policies on user_profiles
-- =============================================================================
-- Backstory: production was set up before migration 000 existed and had
-- only legacy SELECT + UPDATE policies on user_profiles. When the onboarding
-- flow tried to upsert (which Postgres evaluates as INSERT-with-conflict-
-- fallback-to-UPDATE), the missing INSERT policy caused a 42501 RLS
-- violation. Onboarding crashed on production despite working on staging.
--
-- This migration drops any legacy policy names (whether from manual setup
-- or earlier migration revisions) and recreates four explicit per-command
-- policies:
--   - SELECT  : users read their own row
--   - INSERT  : users insert their own row (NEW — was missing on prod)
--   - UPDATE  : users update their own row, can't reassign user_id
--   - DELETE  : users delete their own row
--
-- All policies scoped to the `authenticated` role explicitly.
-- All write-paths use WITH CHECK so user_id cannot be mutated to another
-- user's UUID (closes a minor security gap in the legacy UPDATE policy
-- which had with_check = NULL).
-- =============================================================================

-- Drop any prior policy variants — covers both the FOR ALL shorthand from
-- migration 000 and the legacy manual policies that ended up on production.
drop policy if exists "user_profiles: users manage own row" on public.user_profiles;
drop policy if exists "user_profiles: users select own row" on public.user_profiles;
drop policy if exists "user_profiles: users insert own row" on public.user_profiles;
drop policy if exists "user_profiles: users update own row" on public.user_profiles;
drop policy if exists "user_profiles: users delete own row" on public.user_profiles;
drop policy if exists "Users can view own profile"   on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Users can delete own profile" on public.user_profiles;

-- Ensure RLS is on (defensive — should already be enabled by migration 000).
alter table public.user_profiles enable row level security;

-- ── SELECT ────────────────────────────────────────────────────────────────────
create policy "user_profiles: users select own row"
  on public.user_profiles for select
  to authenticated
  using (user_id = auth.uid());

-- ── INSERT ────────────────────────────────────────────────────────────────────
create policy "user_profiles: users insert own row"
  on public.user_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

-- ── UPDATE ────────────────────────────────────────────────────────────────────
create policy "user_profiles: users update own row"
  on public.user_profiles for update
  to authenticated
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── DELETE ────────────────────────────────────────────────────────────────────
create policy "user_profiles: users delete own row"
  on public.user_profiles for delete
  to authenticated
  using (user_id = auth.uid());

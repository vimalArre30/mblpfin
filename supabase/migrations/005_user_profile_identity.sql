-- =============================================================================
-- Migration 005 — User profile identity fields
-- =============================================================================
-- Adds the onboarding-v1 identity fields to user_profiles:
--   - name      : user's display name (compulsory at onboarding)
--   - username  : unique handle for future social features (compulsory)
--
-- Username constraints:
--   - 3-20 characters
--   - lowercase alphanumeric + underscore only (^[a-z0-9_]{3,20}$)
--   - case-insensitive uniqueness enforced via a functional unique index on
--     LOWER(username) so "Vimal" and "vimal" cannot both exist
--
-- These fields are NULL for existing users — the onboarding flow uses NULL as
-- the "not yet onboarded" signal and redirects to /onboarding (web) or the
-- OnboardingScreen (Flutter) until both are filled.
-- =============================================================================

-- ── 1. Add the columns ────────────────────────────────────────────────────────

alter table public.user_profiles
  add column if not exists name     text,
  add column if not exists username text;

-- ── 2. Username format constraint ─────────────────────────────────────────────

alter table public.user_profiles
  drop constraint if exists user_profiles_username_format;

alter table public.user_profiles
  add constraint user_profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');

-- ── 3. Case-insensitive uniqueness on username ────────────────────────────────

drop index if exists user_profiles_username_lower_idx;

create unique index user_profiles_username_lower_idx
  on public.user_profiles (lower(username))
  where username is not null;

-- ── 4. Name length sanity ─────────────────────────────────────────────────────

alter table public.user_profiles
  drop constraint if exists user_profiles_name_length;

alter table public.user_profiles
  add constraint user_profiles_name_length
  check (name is null or (char_length(trim(name)) between 1 and 60));

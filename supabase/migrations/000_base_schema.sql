-- ============================================================
-- Migration 000: Base schema — complete table definitions for fresh installs
--
-- This file captures all tables in their current final state,
-- including columns that were added incrementally to the live DB.
-- Migrations 001-003 will still run after this and are safe:
--   001 — ADD COLUMN IF NOT EXISTS note; CREATE TABLE IF NOT EXISTS transaction_labels → no-ops for note/table; RLS+policy still applies cleanly
--   002 — ADD COLUMN IF NOT EXISTS categories.type → no-op (included below)
--   003 — UPDATE categories SET type = 'expense' WHERE type IS NULL → no-op (column has NOT NULL default)
-- ============================================================


-- ── 1. WALLETS ────────────────────────────────────────────────

create table if not exists wallets (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  name       text        not null,
  emoji      text,
  color      text,
  created_at timestamptz not null default now()
);

alter table wallets enable row level security;

create policy "wallets: users manage own rows"
  on wallets for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ── 2. CATEGORIES ─────────────────────────────────────────────
-- user_id = null → system default (visible to all users).
-- `type` column included here; migration 002's ADD COLUMN IF NOT EXISTS will be a no-op.

create table if not exists categories (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users on delete cascade,
  name       text        not null,
  icon       text,
  type       text        not null default 'expense'
                           check (type in ('income', 'expense', 'both')),
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

create policy "categories: users read own + system rows"
  on categories for select
  using (user_id = auth.uid() or user_id is null);

create policy "categories: users insert own rows"
  on categories for insert
  with check (user_id = auth.uid());

create policy "categories: users update own rows"
  on categories for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "categories: users delete own rows"
  on categories for delete
  using (user_id = auth.uid());


-- ── 3. LABELS ─────────────────────────────────────────────────
-- user_id = null → system default (e.g. Need / Want / Investment).

create table if not exists labels (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users on delete cascade,
  name       text        not null,
  color      text,
  created_at timestamptz not null default now()
);

alter table labels enable row level security;

create policy "labels: users read own + system rows"
  on labels for select
  using (user_id = auth.uid() or user_id is null);

create policy "labels: users insert own rows"
  on labels for insert
  with check (user_id = auth.uid());

create policy "labels: users update own rows"
  on labels for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "labels: users delete own rows"
  on labels for delete
  using (user_id = auth.uid());


-- ── 4. TRANSACTIONS ───────────────────────────────────────────
-- Complete column set as of the current live schema.
-- Columns added incrementally to the live DB are included here
-- so fresh installs get the full schema in one pass:
--   note               — migration 001 adds via ADD COLUMN IF NOT EXISTS (no-op)
--   entry_type         — was added via inline migration in schema.sql
--   transfer_id        — was added via inline migration in schema.sql
--   to_wallet_id       — was added via inline migration in schema.sql
--   is_opening_balance — was added via inline migration in schema.sql
-- The old `label_id` FK column from the original schema is intentionally
-- omitted — it was superseded by the transaction_labels join table.

create table if not exists transactions (
  id                 uuid           primary key default gen_random_uuid(),
  user_id            uuid           not null references auth.users on delete cascade,
  wallet_id          uuid           references wallets(id) on delete set null,
  category_id        uuid           references categories(id) on delete set null,
  amount             numeric(12, 2) not null,
  description        text,
  type               text           not null default 'debit'
                                      check (type in ('debit', 'credit')),
  entry_type         text           not null default 'expense'
                                      check (entry_type in ('income', 'expense', 'transfer')),
  date               date           not null default current_date,
  note               text,
  transfer_id        uuid,
  to_wallet_id       uuid           references wallets(id) on delete set null,
  is_opening_balance boolean        not null default false,
  created_at         timestamptz    not null default now()
);

alter table transactions enable row level security;

create policy "transactions: users manage own rows"
  on transactions for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ── 5. TRANSACTION_LABELS ─────────────────────────────────────
-- Join table: one transaction ↔ many labels.
-- Table structure created here; RLS and policy are added by migration 001
-- (its CREATE TABLE IF NOT EXISTS will be a no-op; ENABLE RLS +
-- CREATE POLICY will still execute cleanly against this already-created table).

create table if not exists transaction_labels (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  label_id       uuid not null references labels(id) on delete cascade,
  unique(transaction_id, label_id)
);

-- RLS and policy for transaction_labels intentionally live in migration 001.


-- ── 6. USER_PROFILES ──────────────────────────────────────────
-- Freemium plan tracking. Created directly in Supabase on the live DB
-- and not present in any previous migration file.

create table if not exists user_profiles (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null unique references auth.users on delete cascade,
  plan            text        not null default 'free'
                                check (plan in ('free', 'pro')),
  plan_expires_at timestamptz,
  entry_count     int         not null default 0,
  updated_at      timestamptz,
  created_at      timestamptz not null default now()
);

alter table user_profiles enable row level security;

create policy "user_profiles: users manage own row"
  on user_profiles for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

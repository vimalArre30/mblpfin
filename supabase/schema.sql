-- ============================================================
-- MrBottomLine Expenditure Tracker — Supabase Schema
-- Run this entire file in the Supabase SQL editor
-- (Dashboard → SQL Editor → New Query → paste → Run)
-- ============================================================


-- ── 1. WALLETS ───────────────────────────────────────────────
create table if not exists wallets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  emoji       text,
  color       text,
  created_at  timestamptz not null default now()
);

alter table wallets enable row level security;

create policy "wallets: users manage own rows"
  on wallets for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ── 2. CATEGORIES ────────────────────────────────────────────
-- user_id = null means system default (visible to all users)
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade,
  name        text not null,
  icon        text,
  created_at  timestamptz not null default now()
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
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "categories: users delete own rows"
  on categories for delete
  using (user_id = auth.uid());


-- ── 3. LABELS ────────────────────────────────────────────────
-- user_id = null means system default (e.g. Need / Want / Investment)
create table if not exists labels (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade,
  name        text not null,
  color       text,
  created_at  timestamptz not null default now()
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
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "labels: users delete own rows"
  on labels for delete
  using (user_id = auth.uid());


-- ── 4. TRANSACTIONS ──────────────────────────────────────────
create table if not exists transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  wallet_id    uuid references wallets(id) on delete set null,
  category_id  uuid references categories(id) on delete set null,
  label_id     uuid references labels(id) on delete set null,
  amount       numeric(12, 2) not null,
  description  text,
  type         text not null default 'debit'
                 check (type in ('debit', 'credit')),
  date         date not null default current_date,
  created_at   timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "transactions: users manage own rows"
  on transactions for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ============================================================
-- SEED — System-level defaults (user_id = null)
-- Safe to re-run: uses ON CONFLICT DO NOTHING
-- ============================================================

-- Default categories
insert into categories (name, icon, user_id) values
  ('Food',               '🍔', null),
  ('Travel',             '✈️',  null),
  ('Utilities',          '💡', null),
  ('Health',             '🏥', null),
  ('Entertainment',      '🎬', null),
  ('Shopping',           '🛍️', null),
  ('Investment',         '📈', null),
  ('Farmstay Expenses',  '🌿', null)
on conflict do nothing;

-- Default labels
insert into labels (name, color, user_id) values
  ('Need',        '#2563EB', null),
  ('Want',        '#D97706', null),
  ('Investment',  '#16A34A', null),
  ('Savings',     '#7C3AED', null)
on conflict do nothing;

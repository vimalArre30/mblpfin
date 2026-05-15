-- =============================================================================
-- Migration 004 — Default seed on signup
-- =============================================================================
-- When a new user signs up via auth.users insert, automatically create:
--   1. A user_profiles row (replaces lazy-init pattern in /api/tracker/transactions)
--   2. 4 default wallets (Cash, Bank Account, Credit Card, Savings)
--   3. 5 income categories (Salary, Interest, Dividends, Mutual Fund Profits, Stock Profits)
--   4. 10 expense categories (Food, Transport, Bills, Shopping, Entertainment,
--      Health, Rent, Education, Travel, Personal Care)
--
-- The trigger is SECURITY DEFINER so the function runs with the privileges of
-- the user that owns it (postgres) — bypassing RLS to insert into wallets,
-- categories, and user_profiles on behalf of the new user.
--
-- Idempotent: each insert is guarded by NOT EXISTS so re-running on an
-- existing user is a safe no-op. Useful for backfilling pre-existing users
-- via a one-shot script (see bottom of file).
-- =============================================================================

-- ── 1. Trigger function ───────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_user_id uuid := new.id;
begin
  -- ── user_profiles ──────────────────────────────────────────────────────────
  insert into public.user_profiles (user_id, plan, entry_count)
  values (new_user_id, 'free', 0)
  on conflict (user_id) do nothing;

  -- ── Default wallets ────────────────────────────────────────────────────────
  -- Only seed if the user has no wallets yet (idempotency guard).
  if not exists (select 1 from public.wallets where user_id = new_user_id) then
    insert into public.wallets (user_id, name, emoji, color) values
      (new_user_id, 'Cash',         '💵', '#F59E0B'),
      (new_user_id, 'Bank Account', '🏦', '#3B82F6'),
      (new_user_id, 'Credit Card',  '💳', '#EF4444'),
      (new_user_id, 'Savings',      '💰', '#22C55E');
  end if;

  -- ── Default income categories ──────────────────────────────────────────────
  if not exists (
    select 1 from public.categories
    where user_id = new_user_id and type = 'income'
  ) then
    insert into public.categories (user_id, name, icon, type) values
      (new_user_id, 'Salary',              '💼', 'income'),
      (new_user_id, 'Interest',            '🏦', 'income'),
      (new_user_id, 'Dividends',           '📈', 'income'),
      (new_user_id, 'Mutual Fund Profits', '💹', 'income'),
      (new_user_id, 'Stock Profits',       '📊', 'income');
  end if;

  -- ── Default expense categories ─────────────────────────────────────────────
  if not exists (
    select 1 from public.categories
    where user_id = new_user_id and type = 'expense'
  ) then
    insert into public.categories (user_id, name, icon, type) values
      (new_user_id, 'Food & Dining',  '🍔', 'expense'),
      (new_user_id, 'Transport',      '🚗', 'expense'),
      (new_user_id, 'Bills & Utilities', '💡', 'expense'),
      (new_user_id, 'Shopping',       '🛍️', 'expense'),
      (new_user_id, 'Entertainment',  '🎬', 'expense'),
      (new_user_id, 'Health',         '🏥', 'expense'),
      (new_user_id, 'Rent',           '🏠', 'expense'),
      (new_user_id, 'Education',      '📚', 'expense'),
      (new_user_id, 'Travel',         '✈️', 'expense'),
      (new_user_id, 'Personal Care',  '💆', 'expense');
  end if;

  return new;
end;
$$;

-- ── 2. Trigger on auth.users ──────────────────────────────────────────────────

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 3. Backfill existing users (one-shot) ─────────────────────────────────────
-- Run the seeding function against every existing user. Idempotency guards
-- inside handle_new_user() ensure this is safe to run on users who already
-- have wallets / categories — those branches are skipped.
--
-- Wrapped in a do-block so it can be re-run from this migration file without
-- side effects.

do $$
declare
  u record;
begin
  for u in select id from auth.users loop
    -- Synthesize a NEW record shape for handle_new_user. Use direct inserts
    -- here instead of the trigger function because triggers expect a real
    -- NEW row from an actual INSERT — easier to inline the logic.
    insert into public.user_profiles (user_id, plan, entry_count)
    values (u.id, 'free', 0)
    on conflict (user_id) do nothing;

    if not exists (select 1 from public.wallets where user_id = u.id) then
      insert into public.wallets (user_id, name, emoji, color) values
        (u.id, 'Cash',         '💵', '#F59E0B'),
        (u.id, 'Bank Account', '🏦', '#3B82F6'),
        (u.id, 'Credit Card',  '💳', '#EF4444'),
        (u.id, 'Savings',      '💰', '#22C55E');
    end if;

    if not exists (
      select 1 from public.categories
      where user_id = u.id and type = 'income'
    ) then
      insert into public.categories (user_id, name, icon, type) values
        (u.id, 'Salary',              '💼', 'income'),
        (u.id, 'Interest',            '🏦', 'income'),
        (u.id, 'Dividends',           '📈', 'income'),
        (u.id, 'Mutual Fund Profits', '💹', 'income'),
        (u.id, 'Stock Profits',       '📊', 'income');
    end if;

    if not exists (
      select 1 from public.categories
      where user_id = u.id and type = 'expense'
    ) then
      insert into public.categories (user_id, name, icon, type) values
        (u.id, 'Food & Dining',  '🍔', 'expense'),
        (u.id, 'Transport',      '🚗', 'expense'),
        (u.id, 'Bills & Utilities', '💡', 'expense'),
        (u.id, 'Shopping',       '🛍️', 'expense'),
        (u.id, 'Entertainment',  '🎬', 'expense'),
        (u.id, 'Health',         '🏥', 'expense'),
        (u.id, 'Rent',           '🏠', 'expense'),
        (u.id, 'Education',      '📚', 'expense'),
        (u.id, 'Travel',         '✈️', 'expense'),
        (u.id, 'Personal Care',  '💆', 'expense');
    end if;
  end loop;
end $$;

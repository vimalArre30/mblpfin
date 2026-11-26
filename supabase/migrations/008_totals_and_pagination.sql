-- ============================================================
-- Migration 008: server-side totals + keyset pagination support (B1)
--
-- Why: PostgREST silently caps every response at 1000 rows, so any total
-- computed in the browser from a fetched list is wrong past 1000 entries.
-- Totals are now computed in SQL and returned as a handful of numbers; lists
-- are fetched 50 at a time with a keyset cursor (see /api/tracker/transactions).
--
-- Data model facts these functions rely on (they differ from the Month 1
-- doc's draft SQL, which would have returned wrong numbers):
--   * There is NO wallets.opening_balance column. A wallet's opening balance
--     is an ordinary transactions row: is_opening_balance = true,
--     entry_type = 'income'. It is therefore already inside "income".
--   * A transfer is TWO signed rows, one per wallet, each with its own
--     wallet_id: the debit leg has amount = -X (and to_wallet_id = destination),
--     the credit leg has amount = +X (and to_wallet_id null). A wallet's
--     transfer movement is simply sum(amount) of the transfer rows whose
--     wallet_id is that wallet. Never also add rows matched by to_wallet_id:
--     that counts the debit leg a second time.
--   * Income and expense amounts are stored positive (abs() is applied only
--     to match what the app has always displayed).
--
-- All functions are SECURITY INVOKER, so the existing RLS on transactions /
-- wallets / labels applies; auth.uid() is also checked explicitly so the
-- user_id index is used. Period bounds are plain dates chosen by the caller
-- in local (Asia/Kolkata) terms: nothing here converts through UTC.
-- NULL bounds mean "unbounded", i.e. all time.
-- ============================================================


-- ── Indexes used by every totals query and every paged list ───────────
-- (named distinctly so a differently-shaped pre-existing index cannot make
--  "if not exists" silently skip these)
create index if not exists transactions_user_date_created_id_idx
  on public.transactions (user_id, date desc, created_at desc, id desc);

create index if not exists transactions_wallet_date_idx
  on public.transactions (wallet_id, date desc);


-- ── totals_for_period ──────────────────────────────────────────────────
-- Income / expense / transfer movement for a period, optionally one wallet.
-- p_wallet_id filters on wallet_id ONLY (each transfer leg lives on its own
-- wallet). With p_to = a date and p_from = null this is a wallet "snapshot as
-- of that date". p_exclude_opening leaves opening-balance rows out.
create or replace function public.totals_for_period(
  p_from date default null,
  p_to date default null,
  p_wallet_id uuid default null,
  p_exclude_opening boolean default false
) returns table (
  income        numeric,
  expense       numeric,
  transfers_in  numeric,   -- sum of credit legs (positive amounts)
  transfers_out numeric,   -- sum of debit legs, as a positive number
  transfers     numeric,   -- signed net of all transfer legs in scope
  expense_count bigint,
  entries       bigint     -- every row in scope (incl. opening balance, transfer legs)
)
language sql
security invoker
stable
set search_path = public
as $$
  with t as (
    select
      amount,
      coalesce(entry_type, case when type = 'credit' then 'income' else 'expense' end) as et
    from public.transactions
    where user_id = auth.uid()
      and (p_from is null or date >= p_from)
      and (p_to   is null or date <= p_to)
      and (p_wallet_id is null or wallet_id = p_wallet_id)
      and (not p_exclude_opening or not coalesce(is_opening_balance, false))
  )
  select
    coalesce(sum(abs(amount)) filter (where et = 'income'),  0),
    coalesce(sum(abs(amount)) filter (where et = 'expense'), 0),
    coalesce(sum(amount)      filter (where et = 'transfer' and amount > 0), 0),
    coalesce(-sum(amount)     filter (where et = 'transfer' and amount < 0), 0),
    coalesce(sum(amount)      filter (where et = 'transfer'), 0),
    count(*) filter (where et = 'expense'),
    count(*)
  from t;
$$;


-- ── wallet_balances ────────────────────────────────────────────────────
-- Every wallet of the caller at once, all time.
-- balance = income (incl. opening balance) - expense + signed transfer legs.
create or replace function public.wallet_balances()
returns table (
  wallet_id     uuid,
  income        numeric,
  expense       numeric,
  transfers_in  numeric,
  transfers_out numeric,
  balance       numeric,
  entries       bigint
)
language sql
security invoker
stable
set search_path = public
as $$
  with t as (
    select
      wallet_id,
      amount,
      coalesce(entry_type, case when type = 'credit' then 'income' else 'expense' end) as et
    from public.transactions
    where user_id = auth.uid()
  )
  select
    w.id,
    coalesce(sum(abs(t.amount)) filter (where t.et = 'income'),  0),
    coalesce(sum(abs(t.amount)) filter (where t.et = 'expense'), 0),
    coalesce(sum(t.amount)      filter (where t.et = 'transfer' and t.amount > 0), 0),
    coalesce(-sum(t.amount)     filter (where t.et = 'transfer' and t.amount < 0), 0),
      coalesce(sum(abs(t.amount)) filter (where t.et = 'income'),  0)
    - coalesce(sum(abs(t.amount)) filter (where t.et = 'expense'), 0)
    + coalesce(sum(t.amount)      filter (where t.et = 'transfer'), 0),
    count(t.amount)
  from public.wallets w
  left join t on t.wallet_id = w.id
  where w.user_id = auth.uid()
  group by w.id;
$$;


-- ── spend_by_category ──────────────────────────────────────────────────
-- Per-category totals for a period (dashboard chart, analytics, wallet pills).
-- Default is expenses only; pass array['expense','income'] for both.
-- Transfers and opening-balance rows never appear here.
create or replace function public.spend_by_category(
  p_from date default null,
  p_to date default null,
  p_wallet_id uuid default null,
  p_entry_types text[] default array['expense']
) returns table (
  category_id uuid,
  total       numeric,
  entries     bigint
)
language sql
security invoker
stable
set search_path = public
as $$
  select
    category_id,
    sum(abs(amount)),
    count(*)
  from public.transactions
  where user_id = auth.uid()
    and not coalesce(is_opening_balance, false)
    and coalesce(entry_type, case when type = 'credit' then 'income' else 'expense' end) = any (p_entry_types)
    and entry_type is distinct from 'transfer'
    and (p_from is null or date >= p_from)
    and (p_to   is null or date <= p_to)
    and (p_wallet_id is null or wallet_id = p_wallet_id)
  group by category_id
  order by 2 desc;
$$;


-- ── label_spend ────────────────────────────────────────────────────────
-- Expense totals per label name (Need / Want / ...) for a period.
-- Not in the doc's draft; added because the dashboard, analytics and the
-- wallet AI insight all show Need vs Want and must not sum in the browser.
create or replace function public.label_spend(
  p_from date default null,
  p_to date default null,
  p_wallet_id uuid default null
) returns table (
  label_name text,
  total      numeric,
  entries    bigint
)
language sql
security invoker
stable
set search_path = public
as $$
  select
    l.name,
    sum(abs(t.amount)),
    count(*)
  from public.transactions t
  join public.transaction_labels tl on tl.transaction_id = t.id
  join public.labels l on l.id = tl.label_id
  where t.user_id = auth.uid()
    and coalesce(t.entry_type, case when t.type = 'credit' then 'income' else 'expense' end) = 'expense'
    and (p_from is null or t.date >= p_from)
    and (p_to   is null or t.date <= p_to)
    and (p_wallet_id is null or t.wallet_id = p_wallet_id)
  group by l.name;
$$;


-- ── monthly_totals ─────────────────────────────────────────────────────
-- Month-by-month income / expense for [p_from, p_to] (p_to null = open end).
-- The caller decides the window in Asia/Kolkata terms (the API passes the
-- first day of the month 5 months back for the dashboard's 6-month chart).
create or replace function public.monthly_totals(
  p_from date,
  p_to date default null
) returns table (
  month   date,
  income  numeric,
  expense numeric
)
language sql
security invoker
stable
set search_path = public
as $$
  select
    date_trunc('month', date)::date,
    coalesce(sum(abs(amount)) filter (where coalesce(entry_type, case when type = 'credit' then 'income' else 'expense' end) = 'income'),  0),
    coalesce(sum(abs(amount)) filter (where coalesce(entry_type, case when type = 'credit' then 'income' else 'expense' end) = 'expense'), 0)
  from public.transactions
  where user_id = auth.uid()
    and date >= p_from
    and (p_to is null or date <= p_to)
  group by 1
  order by 1;
$$;


-- ── Permissions: signed-in users only ──────────────────────────────────
revoke all on function public.totals_for_period(date, date, uuid, boolean)       from public, anon;
revoke all on function public.wallet_balances()                                  from public, anon;
revoke all on function public.spend_by_category(date, date, uuid, text[])        from public, anon;
revoke all on function public.label_spend(date, date, uuid)                      from public, anon;
revoke all on function public.monthly_totals(date, date)                         from public, anon;

grant execute on function public.totals_for_period(date, date, uuid, boolean)    to authenticated, service_role;
grant execute on function public.wallet_balances()                               to authenticated, service_role;
grant execute on function public.spend_by_category(date, date, uuid, text[])     to authenticated, service_role;
grant execute on function public.label_spend(date, date, uuid)                   to authenticated, service_role;
grant execute on function public.monthly_totals(date, date)                      to authenticated, service_role;

-- Make PostgREST pick up the new functions immediately.
notify pgrst, 'reload schema';

-- Add type column to categories: income | expense | both
-- Safe to re-run — uses IF NOT EXISTS guard
alter table categories
  add column if not exists type text not null default 'expense'
    check (type in ('income', 'expense', 'both'));

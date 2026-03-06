-- ============================================================
-- Migration 001: Add note to transactions + transaction_labels join table
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Add optional note column to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS note text;

-- Join table: one transaction can have many labels
CREATE TABLE IF NOT EXISTS transaction_labels (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  uuid not null references transactions(id) on delete cascade,
  label_id        uuid not null references labels(id) on delete cascade,
  unique(transaction_id, label_id)
);

ALTER TABLE transaction_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transaction_labels: users manage own rows"
  ON transaction_labels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    )
  );

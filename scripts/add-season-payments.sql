-- add-season-payments.sql
-- Commissioner-only buy-in tracking, one row per user PER SEASON.
-- A row existing means that user has paid for that season; toggling
-- "unpaid" deletes the row.
--
-- RLS is enabled with NO policies, so the public anon key can't read or
-- write this table at all — only the service-role admin client (used by
-- the commissioner-gated API routes / admin pages) can.
--
-- Safe to run more than once in the Supabase SQL editor.

BEGIN;

CREATE TABLE IF NOT EXISTS season_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_season_payments_season ON season_payments(season_id);

ALTER TABLE season_payments ENABLE ROW LEVEL SECURITY;

COMMIT;

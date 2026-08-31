-- schema_additions.sql
-- Run this ONCE against the new Supabase project if you already ran the
-- original schema.sql from this folder (the one without winner_picks,
-- avatar_url, photo_url, or multi-elimination support).
--
-- schema.sql in this folder has since been updated to include all of this
-- inline, for anyone spinning up a project from scratch going forward.
-- This file exists only to bring an already-created database up to match.
--
-- Safe to run top to bottom in the Supabase SQL editor.

BEGIN;

-- 1. Avatar photo on users (profile page)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Contestant photo (admin contestants page)
ALTER TABLE contestants ADD COLUMN IF NOT EXISTS photo_url text;

-- 3. Multi-elimination support: a week can have more than one boot
--    (double/triple elimination episodes), so this is a junction table,
--    not a single column on weeks.
CREATE TABLE IF NOT EXISTS week_eliminations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  contestant_id uuid NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_id, contestant_id)
);

-- Migrate any existing single-column eliminations before dropping it
-- (no-op on a brand new project with no weeks yet, but safe either way).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weeks' AND column_name = 'eliminated_contestant_id'
  ) THEN
    INSERT INTO week_eliminations (week_id, contestant_id)
    SELECT id, eliminated_contestant_id FROM weeks
    WHERE eliminated_contestant_id IS NOT NULL
    ON CONFLICT (week_id, contestant_id) DO NOTHING;

    ALTER TABLE weeks DROP COLUMN eliminated_contestant_id;
  END IF;
END $$;

-- 4. Winner picks: one pregame "who wins the season" prediction per user
--    PER SEASON — not a single all-time pick, since the same friend group
--    plays every season.
CREATE TABLE IF NOT EXISTS winner_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  contestant_id uuid NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_winner_picks_user ON winner_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_winner_picks_season ON winner_picks(season_id);

COMMIT;

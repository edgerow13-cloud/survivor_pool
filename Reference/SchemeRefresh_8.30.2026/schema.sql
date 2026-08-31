-- schema.sql
-- Fresh schema for the Survivor pool app.
-- Multi-season support (single pool, no leagues/pool_memberships) is
-- built in from the start — this is a clean rebuild, not a migration.
--
-- Run this in the Supabase SQL editor on your NEW project, top to bottom.

BEGIN;

-- ---------------------------------------------------------------------
-- seasons
-- ---------------------------------------------------------------------
CREATE TABLE seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number int UNIQUE NOT NULL,
  name text NOT NULL,
  premiere_date date,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enforce at most one active season at a time
CREATE UNIQUE INDEX one_active_season
  ON seasons (is_active)
  WHERE is_active = true;

COMMENT ON TABLE seasons IS 'One row per Survivor season tracked by the pool.';

-- ---------------------------------------------------------------------
-- users (pool participants)
-- ---------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('commissioner', 'player');
CREATE TYPE user_status AS ENUM ('active', 'eliminated', 'inactive');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'player',
  status user_status NOT NULL DEFAULT 'active',
  eliminated_week int,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Note: users are NOT season-scoped — the same friend group plays across
-- seasons. status/eliminated_week reflect standing in the active season;
-- when a new season starts, reset status back to 'active' for everyone
-- who should be playing (commissioner action via /admin).

-- ---------------------------------------------------------------------
-- contestants
-- ---------------------------------------------------------------------
CREATE TABLE contestants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES seasons(id),
  name text NOT NULL,
  is_eliminated boolean NOT NULL DEFAULT false,
  eliminated_week int,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contestants_season ON contestants(season_id);

-- ---------------------------------------------------------------------
-- tribes
-- ---------------------------------------------------------------------
CREATE TABLE tribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES seasons(id),
  name text NOT NULL,
  color text NOT NULL,
  is_merged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tribes_season ON tribes(season_id);

-- ---------------------------------------------------------------------
-- contestant_tribe_history
-- ---------------------------------------------------------------------
CREATE TABLE contestant_tribe_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contestant_id uuid NOT NULL REFERENCES contestants(id),
  tribe_id uuid NOT NULL REFERENCES tribes(id),
  week_number int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contestant_id, week_number)
);

-- Lookup pattern for a contestant's tribe as of week N:
--   SELECT tribe_id FROM contestant_tribe_history
--   WHERE contestant_id = $1 AND week_number <= $2
--   ORDER BY week_number DESC LIMIT 1;

-- ---------------------------------------------------------------------
-- weeks
-- ---------------------------------------------------------------------
CREATE TABLE weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES seasons(id),
  week_number int NOT NULL,
  episode_date timestamptz,
  is_locked boolean NOT NULL DEFAULT false,
  is_results_entered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, week_number)
);

CREATE INDEX idx_weeks_season ON weeks(season_id);

-- ---------------------------------------------------------------------
-- week_eliminations
-- Junction table: a week can have more than one boot (double/triple
-- elimination episodes), so this isn't a single column on weeks.
-- ---------------------------------------------------------------------
CREATE TABLE week_eliminations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  contestant_id uuid NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_id, contestant_id)
);

-- ---------------------------------------------------------------------
-- picks
-- ---------------------------------------------------------------------
CREATE TYPE pick_outcome AS ENUM ('safe', 'eliminated', 'no_pick');

CREATE TABLE picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  week_id uuid NOT NULL REFERENCES weeks(id),
  contestant_id uuid REFERENCES contestants(id),
  outcome pick_outcome,
  is_commissioner_override boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_id)
);

CREATE INDEX idx_picks_week ON picks(week_id);
CREATE INDEX idx_picks_user ON picks(user_id);

-- ---------------------------------------------------------------------
-- winner_picks
-- One pregame "who wins the season" prediction per user PER SEASON — not
-- a single all-time pick, since the same friend group plays every season.
-- ---------------------------------------------------------------------
CREATE TABLE winner_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  contestant_id uuid NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, season_id)
);

CREATE INDEX idx_winner_picks_user ON winner_picks(user_id);
CREATE INDEX idx_winner_picks_season ON winner_picks(season_id);

COMMIT;

-- ---------------------------------------------------------------------
-- Next steps after running this file:
--
-- 1. Insert yourself as commissioner:
--      INSERT INTO users (name, email, role, status)
--      VALUES ('Eddie', 'your@email.com', 'commissioner', 'active');
--
-- 2. Insert the Season 51 row and seed contestants/tribes
--    (see the companion Claude Code prompt for this).
--
-- 3. Set up env vars in Vercel + local .env.local:
--      NEXT_PUBLIC_SUPABASE_URL=
--      NEXT_PUBLIC_SUPABASE_ANON_KEY=
--      SUPABASE_SERVICE_ROLE_KEY=
--      NEXT_PUBLIC_APP_URL=
--
-- 4. IMPORTANT: this is a brand new free-tier project, which means it
--    will auto-pause again after 7 days of inactivity and can be
--    deleted after prolonged inactivity, exactly like last time.
--    Before you put any real player data in here, either:
--      a) upgrade to Pro ($25/mo) for backups + to disable auto-pause, or
--      b) set up a scheduled pg_dump (cron/GitHub Action) to somewhere
--         durable, so this doesn't happen again.
-- ---------------------------------------------------------------------

-- seed-season-51.sql
-- One-off seed for Survivor 51 on a fresh Supabase project.
-- Run this AFTER schema.sql (or schema.sql + schema_additions.sql) has
-- been applied. Safe to re-run — every insert is idempotent.
--
-- What this does:
--   1. Creates the seasons row (season_number 51, marked active).
--   2. Inserts all 21 Season 51 castaways, scoped to that season.
--   3. Inserts you as commissioner, if not already done via the SQL editor.
--
-- What this deliberately leaves out:
--   Tribes and week-1 contestant_tribe_history rows — tribes haven't been
--   announced yet. See the commented-out template at the bottom for how
--   to append those once you have tribe names, colors, and rosters.

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Season
-- ---------------------------------------------------------------------
INSERT INTO seasons (season_number, name, premiere_date, is_active)
VALUES (51, 'Survivor 51: The Open Era', '2026-09-23', true)
ON CONFLICT (season_number) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Contestants (21 castaways, tribes TBD)
-- ---------------------------------------------------------------------
INSERT INTO contestants (season_id, name)
SELECT s.id, c.name
FROM (SELECT id FROM seasons WHERE season_number = 51) s
CROSS JOIN (
  VALUES
    ('Aaliyah Puglia'),
    ('Alexis Levine'),
    ('An "Thien An" Nguyen'),
    ('Ana Sani'),
    ('Angelica "Jelly" Loblack'),
    ('Brady Booker'),
    ('Carter Krull'),
    ('Cristian Chavez'),
    ('Danny "Kilby" Kilby'),
    ('Devin Way'),
    ('Eric Macksoud'),
    ('Jenna Doore'),
    ('Kristin Flickinger'),
    ('Lewis Kelly'),
    ('Linnea Capobianco'),
    ('Maggie Nestor'),
    ('Mike Pinsky'),
    ('Ori-Jean Charles'),
    ('Patt Cannaday'),
    ('Rob Antonson'),
    ('Sharonda Cox')
) AS c(name)
WHERE NOT EXISTS (
  SELECT 1 FROM contestants existing
  WHERE existing.season_id = s.id AND existing.name = c.name
);

-- ---------------------------------------------------------------------
-- 3. Commissioner
-- ---------------------------------------------------------------------
-- Replace the email below with the address you'll actually log in with
-- on pool.eddiegerow.com before running this (or skip this insert if
-- you've already added yourself via the SQL editor).
INSERT INTO users (name, email, role, status)
VALUES ('Eddie', 'your@email.com', 'commissioner', 'active')
ON CONFLICT (email) DO NOTHING;

COMMIT;

-- ---------------------------------------------------------------------
-- Once tribes are announced, create them and backfill week 1 like this:
--
-- INSERT INTO tribes (season_id, name, color, is_merged)
-- SELECT id, 'TribeName', '#F97316', false FROM seasons WHERE season_number = 51;
--
-- INSERT INTO contestant_tribe_history (contestant_id, tribe_id, week_number)
-- SELECT c.id, t.id, 1
-- FROM contestants c
-- JOIN seasons s ON s.id = c.season_id AND s.season_number = 51
-- JOIN tribes t ON t.season_id = s.id AND t.name = 'TribeName'
-- WHERE c.name IN ('Contestant One', 'Contestant Two', ...);
--
-- Repeat the contestant_tribe_history insert (with week_number = 1) for
-- each tribe's initial roster.
-- ---------------------------------------------------------------------

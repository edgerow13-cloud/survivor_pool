-- ============================================================
-- Migration 003: Seed data
-- Tribes, all 24 contestants, starting tribe assignments (week 1),
-- and the 3 contestants already eliminated before pool starts
-- ============================================================

-- ============================================================
-- TRIBES (3 starting tribes)
-- Commissioner will add the merged tribe when it occurs mid-season
-- ============================================================

insert into tribes (id, name, color, is_merged) values
  ('11111111-0000-0000-0000-000000000001', 'Cila', '#F97316', false),  -- orange
  ('11111111-0000-0000-0000-000000000002', 'Kalo', '#16A34A', false),  -- green
  ('11111111-0000-0000-0000-000000000003', 'Vatu', '#BE185D', false);  -- magenta

-- ============================================================
-- CONTESTANTS (all 24)
-- 3 already eliminated; 21 active entering Episode 3
-- ============================================================

insert into contestants (id, name, is_eliminated, eliminated_week) values
  -- Cila tribe (8)
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Joe Hunter',             false, null),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Savannah Louie',         true,  2),    -- voted out Ep 2
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Christian Hubicki',      false, null),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Cirie Fields',           false, null),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'Ozzy Lusth',             false, null),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'Emily Flippen',          false, null),
  ('aaaaaaaa-0000-0000-0000-000000000007', 'Rick Devens',            false, null),
  ('aaaaaaaa-0000-0000-0000-000000000008', 'Jenna Lewis-Dougherty',  true,  1),    -- voted out Ep 1
  -- Kalo tribe (8)
  ('aaaaaaaa-0000-0000-0000-000000000009', 'Jonathan Young',         false, null),
  ('aaaaaaaa-0000-0000-0000-000000000010', 'Dee Valladares',         false, null),
  ('aaaaaaaa-0000-0000-0000-000000000011', 'Mike White',             false, null),
  ('aaaaaaaa-0000-0000-0000-000000000012', 'Kamilla Karthigesu',     false, null),
  ('aaaaaaaa-0000-0000-0000-000000000013', 'Charlie Davis',          false, null),
  ('aaaaaaaa-0000-0000-0000-000000000014', 'Tiffany Ervin',          false, null),
  ('aaaaaaaa-0000-0000-0000-000000000015', 'Benjamin "Coach" Wade',  false, null),
  ('aaaaaaaa-0000-0000-0000-000000000016', 'Chrissy Hofbeck',        false, null),
  -- Vatu tribe (8)
  ('aaaaaaaa-0000-0000-0000-000000000017', 'Colby Donaldson',        false, null),
  ('aaaaaaaa-0000-0000-0000-000000000018', 'Genevieve Mushaluk',     false, null),
  ('aaaaaaaa-0000-0000-0000-000000000019', 'Rizo Velovic',           false, null),
  ('aaaaaaaa-0000-0000-0000-000000000020', 'Angelina Keeley',        false, null),
  ('aaaaaaaa-0000-0000-0000-000000000021', 'Q Burdette',             false, null),
  ('aaaaaaaa-0000-0000-0000-000000000022', 'Stephenie LaGrossa Kendrick', false, null),
  ('aaaaaaaa-0000-0000-0000-000000000023', 'Kyle Fraser',            true,  1),    -- medevac Ep 1
  ('aaaaaaaa-0000-0000-0000-000000000024', 'Aubry Bracco',           false, null);

-- ============================================================
-- CONTESTANT_TRIBE_HISTORY
-- All 24 contestants assigned to their starting tribe at week_number = 1
-- ============================================================

insert into contestant_tribe_history (contestant_id, tribe_id, week_number) values
  -- Cila (orange)
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 1),  -- Joe Hunter
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 1),  -- Savannah Louie
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 1),  -- Christian Hubicki
  ('aaaaaaaa-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 1),  -- Cirie Fields
  ('aaaaaaaa-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 1),  -- Ozzy Lusth
  ('aaaaaaaa-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', 1),  -- Emily Flippen
  ('aaaaaaaa-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', 1),  -- Rick Devens
  ('aaaaaaaa-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001', 1),  -- Jenna Lewis-Dougherty
  -- Kalo (green)
  ('aaaaaaaa-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000002', 1),  -- Jonathan Young
  ('aaaaaaaa-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000002', 1),  -- Dee Valladares
  ('aaaaaaaa-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000002', 1),  -- Mike White
  ('aaaaaaaa-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000002', 1),  -- Kamilla Karthigesu
  ('aaaaaaaa-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000002', 1),  -- Charlie Davis
  ('aaaaaaaa-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000002', 1),  -- Tiffany Ervin
  ('aaaaaaaa-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000002', 1),  -- Benjamin "Coach" Wade
  ('aaaaaaaa-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000002', 1),  -- Chrissy Hofbeck
  -- Vatu (magenta)
  ('aaaaaaaa-0000-0000-0000-000000000017', '11111111-0000-0000-0000-000000000003', 1),  -- Colby Donaldson
  ('aaaaaaaa-0000-0000-0000-000000000018', '11111111-0000-0000-0000-000000000003', 1),  -- Genevieve Mushaluk
  ('aaaaaaaa-0000-0000-0000-000000000019', '11111111-0000-0000-0000-000000000003', 1),  -- Rizo Velovic
  ('aaaaaaaa-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000003', 1),  -- Angelina Keeley
  ('aaaaaaaa-0000-0000-0000-000000000021', '11111111-0000-0000-0000-000000000003', 1),  -- Q Burdette
  ('aaaaaaaa-0000-0000-0000-000000000022', '11111111-0000-0000-0000-000000000003', 1),  -- Stephenie LaGrossa Kendrick
  ('aaaaaaaa-0000-0000-0000-000000000023', '11111111-0000-0000-0000-000000000003', 1),  -- Kyle Fraser
  ('aaaaaaaa-0000-0000-0000-000000000024', '11111111-0000-0000-0000-000000000003', 1);  -- Aubry Bracco

-- ============================================================
-- WEEKS (Episodes 1 & 2 — backfill only; pool starts at Ep 3)
-- Commissioner will add Episode 3+ via /admin/weeks
-- is_locked and is_results_entered = true since these are historical
-- ============================================================

insert into weeks (week_number, episode_date, is_locked, is_results_entered, eliminated_contestant_id) values
  (1, '2026-02-25 20:00:00-05', true, true,
    (select id from contestants where name = 'Jenna Lewis-Dougherty')),
  -- Note: Kyle Fraser also left Ep 1 (medevac) — commissioner can add a note
  -- The schema supports one eliminated_contestant_id per week; for weeks with
  -- multiple exits, the commissioner can handle the second via the admin panel
  -- (this seed records the voted-out boot; Kyle's medevac is reflected via
  -- contestants.is_eliminated = true / eliminated_week = 1)
  (2, '2026-03-04 20:00:00-05', true, true,
    (select id from contestants where name = 'Savannah Louie'));

-- ============================================================
-- Migration 002: Row Level Security (RLS) policies
-- ============================================================

-- Helper function: is the current user the commissioner?
create or replace function is_commissioner()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from users
    where id = auth.uid()
    and role = 'commissioner'
  );
$$;

-- Helper function: is the current user active (or commissioner)?
create or replace function is_active_player()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from users
    where id = auth.uid()
    and (status = 'active' or role = 'commissioner')
  );
$$;

-- ============================================================
-- users
-- ============================================================

alter table users enable row level security;

-- Anyone authenticated can read all users (needed for pool grid display)
create policy "users: authenticated read"
  on users for select
  to authenticated
  using (true);

-- Users can update their own row (name only — role/status updated server-side)
create policy "users: self update"
  on users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Commissioner can update any user row (for approvals, reinstatements, etc.)
create policy "users: commissioner update"
  on users for update
  to authenticated
  using (is_commissioner());

-- Insert handled by service role only (via API routes on join approval)
-- No direct client insert policy needed

-- ============================================================
-- tribes
-- ============================================================

alter table tribes enable row level security;

-- All authenticated users can read tribes
create policy "tribes: authenticated read"
  on tribes for select
  to authenticated
  using (true);

-- Only commissioner can insert/update/delete tribes
create policy "tribes: commissioner insert"
  on tribes for insert
  to authenticated
  with check (is_commissioner());

create policy "tribes: commissioner update"
  on tribes for update
  to authenticated
  using (is_commissioner());

create policy "tribes: commissioner delete"
  on tribes for delete
  to authenticated
  using (is_commissioner());

-- ============================================================
-- contestants
-- ============================================================

alter table contestants enable row level security;

-- All authenticated users can read contestants
create policy "contestants: authenticated read"
  on contestants for select
  to authenticated
  using (true);

-- Only commissioner can insert/update/delete contestants
create policy "contestants: commissioner insert"
  on contestants for insert
  to authenticated
  with check (is_commissioner());

create policy "contestants: commissioner update"
  on contestants for update
  to authenticated
  using (is_commissioner());

create policy "contestants: commissioner delete"
  on contestants for delete
  to authenticated
  using (is_commissioner());

-- ============================================================
-- contestant_tribe_history
-- ============================================================

alter table contestant_tribe_history enable row level security;

-- All authenticated users can read tribe history (needed for grid display)
create policy "cth: authenticated read"
  on contestant_tribe_history for select
  to authenticated
  using (true);

-- Only commissioner can insert/update/delete tribe history
create policy "cth: commissioner insert"
  on contestant_tribe_history for insert
  to authenticated
  with check (is_commissioner());

create policy "cth: commissioner update"
  on contestant_tribe_history for update
  to authenticated
  using (is_commissioner());

create policy "cth: commissioner delete"
  on contestant_tribe_history for delete
  to authenticated
  using (is_commissioner());

-- ============================================================
-- weeks
-- ============================================================

alter table weeks enable row level security;

-- All authenticated users can read weeks
create policy "weeks: authenticated read"
  on weeks for select
  to authenticated
  using (true);

-- Only commissioner can insert/update/delete weeks
create policy "weeks: commissioner insert"
  on weeks for insert
  to authenticated
  with check (is_commissioner());

create policy "weeks: commissioner update"
  on weeks for update
  to authenticated
  using (is_commissioner());

create policy "weeks: commissioner delete"
  on weeks for delete
  to authenticated
  using (is_commissioner());

-- ============================================================
-- picks
-- ============================================================

alter table picks enable row level security;

-- A user can always read their own picks
create policy "picks: own read"
  on picks for select
  to authenticated
  using (user_id = auth.uid());

-- A user can read other players' picks only for weeks that are locked
-- (deadline passed) AND results have been entered
create policy "picks: read locked weeks"
  on picks for select
  to authenticated
  using (
    exists (
      select 1 from weeks w
      where w.id = week_id
      and w.is_locked = true
      and w.is_results_entered = true
    )
  );

-- Commissioner can read all picks at any time
create policy "picks: commissioner read"
  on picks for select
  to authenticated
  using (is_commissioner());

-- Active players can insert their own pick (server validates deadline)
create policy "picks: player insert"
  on picks for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and is_active_player()
  );

-- Players can update their own pick (server validates deadline)
create policy "picks: player update"
  on picks for update
  to authenticated
  using (user_id = auth.uid() and is_active_player())
  with check (user_id = auth.uid());

-- Commissioner can insert/update any pick (overrides)
create policy "picks: commissioner insert"
  on picks for insert
  to authenticated
  with check (is_commissioner());

create policy "picks: commissioner update"
  on picks for update
  to authenticated
  using (is_commissioner());

create policy "picks: commissioner delete"
  on picks for delete
  to authenticated
  using (is_commissioner());

-- ============================================================
-- invite_links
-- ============================================================

alter table invite_links enable row level security;

-- Commissioner can do everything with invite links
create policy "invite_links: commissioner all"
  on invite_links for all
  to authenticated
  using (is_commissioner())
  with check (is_commissioner());

-- Unauthenticated users need to validate a token — handled via service role
-- in the /join/[token] API route (not via RLS)

-- ============================================================
-- join_requests
-- ============================================================

alter table join_requests enable row level security;

-- Commissioner can read all join requests
create policy "join_requests: commissioner read"
  on join_requests for select
  to authenticated
  using (is_commissioner());

-- Commissioner can update join request status (approve/reject)
create policy "join_requests: commissioner update"
  on join_requests for update
  to authenticated
  using (is_commissioner());

-- Inserts are handled by service role in the API route (/api/join)
-- so that unauthenticated visitors can submit a join request
-- No client-side insert policy needed here

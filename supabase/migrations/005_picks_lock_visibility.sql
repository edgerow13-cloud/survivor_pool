-- Migration 005: Update picks read policy to use effective lock
-- A week's picks become visible once the episode_date has passed,
-- the week is manually locked, or results have been entered.
-- (The app uses the admin client which bypasses RLS, but this keeps
-- the policy correct for any direct Supabase access.)

-- Drop the old policy
drop policy if exists "picks: read locked weeks" on picks;

-- New policy: visible once week is effectively locked or results entered
create policy "picks: read locked weeks"
  on picks for select
  to authenticated
  using (
    exists (
      select 1 from weeks w
      where w.id = week_id
        and (
          w.is_locked = true
          or w.episode_date <= now()
          or w.is_results_entered = true
        )
    )
  );

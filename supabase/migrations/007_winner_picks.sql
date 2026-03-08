-- winner_picks: one row per user, tracks their season-winner prediction
-- Editable until Episode 3's episode_date; enforced server-side in /api/winner-pick

create table winner_picks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  contestant_id uuid not null references contestants(id) on delete cascade,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (user_id)
);

create index idx_winner_picks_user on winner_picks (user_id);

-- Security is enforced at the API layer via the service-role admin client.
-- No RLS policies are added here; all reads/writes go through server-side routes.

-- 1. Create junction table for multiple eliminations per week
create table week_eliminations (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references weeks(id) on delete cascade,
  contestant_id uuid not null references contestants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (week_id, contestant_id)
);

-- 2. Migrate existing data
insert into week_eliminations (week_id, contestant_id)
select id, eliminated_contestant_id
from weeks
where eliminated_contestant_id is not null;

-- 3. Drop old column
alter table weeks drop column eliminated_contestant_id;

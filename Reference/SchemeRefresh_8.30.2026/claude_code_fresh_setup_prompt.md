# Claude Code prompt — Fresh Supabase project setup + Season 51 seed

Use this after you've created a new Supabase project and run schema.sql
in the SQL editor yourself. Do this on a dedicated branch
(e.g. `rebuild/fresh-supabase`).

---

**Prompt:**

Read CLAUDE.md for full context on this app's data models, conventions,
and business rules before doing anything else.

My previous Supabase project was deleted (free-tier inactivity). I've
created a new Supabase project and run schema.sql against it directly —
the schema now includes a `seasons` table and `season_id` scoping on
contestants/tribes/weeks from the start (not a migration, a fresh build).
The old project and its connection details are gone and irrelevant.

Please:

1. Update `.env.local` and remind me which values I need to pull from
   the new Supabase project's dashboard (Settings > API) —
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   SUPABASE_SERVICE_ROLE_KEY. Do not fabricate placeholder values that
   look real — use obvious placeholders I'll replace.

2. Check whether any code assumes contestants/tribes/weeks are
   NOT season-scoped (leftover from before) and fix those queries to
   filter by the active season (`seasons.is_active = true`). List the
   files you plan to touch before editing.

3. Write a seed script (SQL or a one-off script under /scripts, your
   call) that:
   - Inserts a `seasons` row: season_number 51, name
     "Survivor 51: The Open Era", premiere_date '2026-09-23',
     is_active = true.
   - Inserts all 21 Season 51 contestants (list below) into
     `contestants`, scoped to that season_id.
   - Leaves tribe assignment out for now — tribes haven't been
     announced yet. Structure the script so tribes + week-1
     contestant_tribe_history rows can be appended easily once I have
     that info.
   - Inserts me as commissioner into `users` if not already done via
     the SQL editor.

4. Do NOT touch UI/component code in this pass — this is data layer and
   config only.

5. After changes, run `npm run typecheck` and `npm run build` and
   confirm the app boots against the new project (even with no weeks
   configured yet).

Stop and ask before doing anything beyond what's listed above.

---

## Season 51 cast (21 castaways, tribes TBD)

Aaliyah Puglia
Alexis Levine
An "Thien An" Nguyen
Ana Sani
Angelica "Jelly" Loblack
Brady Booker
Carter Krull
Cristian Chavez
Danny "Kilby" Kilby
Devin Way
Eric Macksoud
Jenna Doore
Kristin Flickinger
Lewis Kelly
Linnea Capobianco
Maggie Nestor
Mike Pinsky
Ori-Jean Charles
Patt Cannaday
Rob Antonson
Sharonda Cox

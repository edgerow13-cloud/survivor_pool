# Survivor 50 Pool App — Project Context

## Project Overview
A private web app for running a Survivor-style elimination pool based on
Survivor Season 50. Each week, active pool participants pick one Survivor
contestant. If that contestant is voted off (or otherwise leaves) that
episode, the pool participant is eliminated. Picks are one-and-done: you
cannot pick the same contestant twice across the season.

Survivor 50 premiered February 25, 2026 with a 24-person all-returnee cast
across 3 tribes (Cila, Kalo, Vatu). Episodes 1 and 2 have already aired.
3 contestants are already eliminated: Jenna Lewis-Dougherty (voted out Ep 1),
Kyle Fraser (medevac Ep 1), and Savannah Louie (voted out Ep 2). 21 remain.
The pool starts at Episode 3 (March 11, 2026). No pool picks exist for
Episodes 1 or 2 — the commissioner may backfill those results for reference.

Tribes change throughout the season (swaps, merges, dissolves). The
contestant's tribe at the time of each week's pick is what matters for
display — not their original tribe. The full tribe history for each
contestant must be tracked week by week.

---

## Tech Stack
- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Backend:** Next.js API routes (serverless)
- **Database:** Supabase (Postgres only — Supabase Auth is NOT used)
- **Hosting:** Vercel
- **Language:** TypeScript throughout

---

## Visual Design
- Light and modern UI
- Survivor color palette: **orange** (#F97316) and **green** (#16A34A) as primary accent colors
- Tribe colors used as indicators on contestant names in the grid
- No dark mode required
- Mobile-friendly and responsive

---

## Core Data Models

### `users`
Pool participants. Added directly by the commissioner — no self-signup.
- `id` (uuid, PK)
- `name` (text) — display name set by commissioner when adding the player; editable by the player via `/profile`
- `email` (text, unique) — used for identity lookup at login
- `role` (enum: `commissioner`, `player`)
- `status` (enum: `active`, `eliminated`)
- `eliminated_week` (int, nullable) — which week they were eliminated
- `avatar_url` (text, nullable) — path to uploaded photo in Supabase Storage
- `created_at`

### `contestants`
Survivor 50 cast. 24 total. Tribe info is NOT stored here — it lives in
`contestant_tribe_history` because tribes change during the season.
- `id` (uuid, PK)
- `name` (text)
- `is_eliminated` (boolean, default false)
- `eliminated_week` (int, nullable)
- `created_at`

### `tribes`
Master list of all tribes that exist or have existed this season.
Commissioner creates/edits these via `/admin/tribes`.
- `id` (uuid, PK)
- `name` (text) — e.g. "Cila", "Kalo", "merged"
- `color` (text) — hex color code for UI indicator, e.g. "#F97316"
- `is_merged` (boolean, default false) — true for the merged tribe
- `created_at`

### `contestant_tribe_history`
Tracks which tribe each contestant belongs to for each week. When a tribe
swap or merge occurs, the commissioner updates this by adding new rows for
the affected contestants. The app always uses the row with the highest
`week_number` ≤ current week to determine a contestant's current tribe.
- `id` (uuid, PK)
- `contestant_id` (uuid, FK → contestants)
- `tribe_id` (uuid, FK → tribes)
- `week_number` (int) — the episode week this tribe assignment takes effect
- `created_at`
- UNIQUE constraint on (contestant_id, week_number)

**How tribe lookups work:**
To find a contestant's tribe for a given week N, query:
```sql
SELECT tribe_id FROM contestant_tribe_history
WHERE contestant_id = $1 AND week_number <= $2
ORDER BY week_number DESC
LIMIT 1;
```
This means initial tribe assignments are seeded at week_number = 1 for all
contestants. When a swap happens in week 4, only the affected contestants
get new rows at week_number = 4.

### `weeks`
One row per episode.
- `id` (uuid, PK)
- `week_number` (int, unique)
- `episode_date` (timestamptz) — air date/time; also serves as pick deadline
- `is_locked` (boolean) — true once deadline passes; picks can no longer be submitted
- `is_results_entered` (boolean) — true after commissioner enters the boot
- `eliminated_contestant_id` (uuid, FK → contestants, nullable)
- `created_at`

### `picks`
One row per user per week.
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `week_id` (uuid, FK → weeks)
- `contestant_id` (uuid, FK → contestants, nullable) — null = no pick made
- `outcome` (enum: `safe`, `eliminated`, `no_pick`) — set after commissioner enters results
- `is_commissioner_override` (boolean, default false) — flagged if commissioner manually set/reset this pick
- `created_at`
- UNIQUE constraint on (user_id, week_id)

### `winner_picks`
Each player's pregame prediction for who will win Survivor 50. Can be
submitted or changed any number of times before the Episode 3 deadline,
after which it locks for players. Visible to all authenticated users
immediately upon submission — this is a public commitment, not a hidden
pick. Used as the tiebreaker if all remaining pool players are eliminated
in the same week.
- `id` (uuid, PK)
- `user_id` (uuid, FK → users, UNIQUE) — one winner pick per player
- `contestant_id` (uuid, FK → contestants)
- `created_at` — original submission timestamp
- `updated_at` — last changed timestamp; used as secondary tiebreaker if
  two players pick the same contestant and that contestant ties on
  elimination week (earlier `updated_at` wins)
- UNIQUE constraint on (user_id)

---

## Key Business Rules

1. **One pick per user per week.** A user can only submit one contestant pick per episode week.
2. **No repeat picks.** A user cannot pick the same contestant more than once across the entire season.
3. **Picks lock at episode air time.** The `episode_date` on the `weeks` table is the hard deadline. After this, picks are locked server-side — not just client-side.
4. **Hidden picks.** Picks are hidden from other players until the week is locked (deadline passed). After locking, all picks for that week are visible to everyone.
5. **No pick = eliminated.** If a user has no pick when the week locks, their outcome is `no_pick` and they are eliminated. Commissioner can override this.
6. **Contestant voted off → participant eliminated.** After commissioner enters the boot, any user who picked that contestant has their outcome set to `eliminated` and their `users.status` set to `eliminated`.
7. **Strict one-and-done.** No second chances unless commissioner manually resets.
8. **Eliminated users can still view** the pool (read-only). They cannot submit picks.
9. **Multiple users can pick the same contestant** in any given week.
10. **Pool ends naturally** when only one active player remains (or all remaining players are eliminated in the same week — tiebreaker resolves via winner picks, see rule 13).
11. **Pool starts at Episode 3.** Episodes 1 and 2 can be backfilled by commissioner but are not required. No pool picks exist before Episode 3.
12. **Tribe assignments are week-specific.** The tribe shown for a contestant in the picks grid reflects their tribe during that episode week, not their original or current tribe. Commissioner updates tribe assignments whenever a swap, merge, or dissolve occurs.
13. **Winner pick tiebreaker.** Before the Episode 3 deadline, every player must submit one pregame prediction for who will win Survivor 50. This pick is public and immediately visible to all players. It can be changed any number of times before the Episode 3 deadline, after which it locks permanently for players (commissioner can update any player's winner pick at any time with no deadline restriction). If all remaining active players are eliminated in the same week, the player whose winner pick contestant survives the longest in the game wins the pool. If two players picked the same contestant (or both picked contestants eliminated the same week), the player whose winner pick has the earlier `updated_at` timestamp wins. Players who have not submitted a winner pick before the Episode 3 deadline are ineligible to win via tiebreaker — commissioner discretion applies.

---

## Commissioner Capabilities
The commissioner has a dedicated admin dashboard (`/admin`) with the ability to:
- Add, edit, or deactivate players (name + email)
- Add/edit/remove weeks (set episode dates)
- Lock/unlock a week manually (in addition to auto-lock at deadline)
- Enter or update the eliminated contestant for any week
- Reset a player's pick for any week (e.g., if they forgot to pick)
- Manually set a player's pick for any week (backfill or override)
- Reinstate an eliminated player (reverse their elimination)
- Seed/edit contestant data (name, elimination status)
- Manage tribes: create tribes, set tribe colors, rename tribes
- Update tribe assignments when a swap, merge, or dissolve occurs (sets new `contestant_tribe_history` rows for affected contestants at the current week number)
- Backfill past weeks (Episodes 1–2) with historical results
- Update any player's winner pick at any point in the season (no deadline restriction for commissioner)
- Update any player's display name and avatar via `/admin/players`

---

## Pages & Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page with login CTA |
| `/login` | Public | Email lookup login page |
| `/pool` | Authenticated | Main view: current week pick submission + picks grid |
| `/pool/picks` | Authenticated | Full picks history grid (all weeks × all players); winner pick shown as first column after player name |
| `/profile` | Authenticated | Player profile: update display name, upload avatar photo, submit/change winner pick (before Episode 3 deadline) |
| `/admin` | Commissioner only | Admin dashboard |
| `/admin/weeks` | Commissioner only | Manage weeks and enter results |
| `/admin/players` | Commissioner only | Add/edit players, manage overrides, update any player's winner pick |
| `/admin/contestants` | Commissioner only | Manage contestant data and tribe assignments |
| `/admin/tribes` | Commissioner only | Manage tribes (create, rename, set colors) |

---

## Picks Grid (History View)
- **Rows:** Pool participants (active players on top, eliminated with strikethrough on their name). Each row shows the player's avatar (small circle, ~24px) alongside their name.
- **Columns:** Winner pick column first, then week numbers
- **Winner pick column:**
  - Header: "🏆 Winner Pick"
  - Shows each player's predicted winner with a tribe color dot (current tribe, not week-specific)
  - If the picked contestant is still active: normal display
  - If the picked contestant has been eliminated: name with a red "Out Wk N" badge
  - If no winner pick submitted yet: shows "—"
  - For the viewing user's own row only — before Episode 3 deadline: shows a "Change →" link to `/profile`; after deadline: read-only, no link
- **Weekly pick cells:** Contestant name with a colored dot indicating their tribe **that week** (looked up from `contestant_tribe_history` for that week number)
- **Cell color coding:**
  - Green background = that contestant survived (pick was safe)
  - Red background = that contestant was eliminated (fatal pick)
  - Gray background = week not yet resolved / results not entered
  - Empty/dash = no pick submitted
- **Tribe dot:** Always reflects the contestant's tribe during that specific week, not their current or original tribe. If tribes merged in week 6, week 5 cells still show pre-merge tribe colors.
- **Visibility rule:** Cells for the current (locked but not yet resolved) week show picks only after results are entered by commissioner
- **Pre-lock:** Current week cells show "Pick submitted ✓" or "No pick" for the viewing user only; other users' picks are completely hidden

---

## Player Profile Page (`/profile`)

Every authenticated player has a profile page for managing their personal
details and pregame winner prediction. Accessible via a nav link available
to all authenticated users.

### Fields

**Avatar Photo**
- Optional image upload (JPEG or PNG, max 2MB)
- Stored in Supabase Storage in a dedicated `avatars` bucket
- Displayed as a circular avatar throughout the app — in the picks grid
  player column and on the profile page itself
- If no avatar uploaded, show an initials placeholder (first + last initial
  on a colored background derived from the user's name)

**Display Name**
- Editable text input, pre-filled with current name
- Saved on submit; reflects immediately everywhere the name appears in the app

**Winner Pick**
- A searchable dropdown of all non-eliminated contestants, each showing a
  tribe color dot
- Can be submitted or changed freely before the Episode 3 deadline
- After the Episode 3 deadline: field is read-only with note
  "Winner picks locked at Episode 3 deadline"
- If the player hasn't submitted yet and deadline has not passed: show a
  prominent prompt encouraging them to pick before it locks

### Supabase Storage Setup (one-time, done manually in Supabase dashboard)
- Create an `avatars` bucket set to **public**
- RLS policy: authenticated users can upload/overwrite only their own file
  at path `avatars/{user_id}`; all authenticated users can read any avatar
- When a new avatar is uploaded, delete the old file from storage before
  writing the new one (no orphaned files)
- Store the resulting public URL in `users.avatar_url`

---

## Auth & Access Rules

### Login Method: Email Lookup (No Password, No Session)
- No passwords, no magic links, no OAuth, no Supabase Auth.
- User visits `/login` and enters their email address.
- The client POSTs to `/api/auth/login`.
- Server checks the `users` table for a row where `email` matches AND `status` is `active` OR `eliminated` (eliminated users can still view the pool).
- If not found: return an error — *"We don't recognize that email address. Contact Eddie to get access."*
- If found: return `{ userId, name, role }` and store in `sessionStorage`.
- No cookies, no JWT, no persistent session. Users re-enter their email each visit or when they open a new browser tab.
- `sessionStorage` naturally clears when the browser tab is closed — this is intentional.

### Player Management (Commissioner-only)
- There is no self-signup or invite link flow.
- The commissioner adds players directly via `/admin/players` by entering their name and email.
- Players are immediately set to `status = 'active'` when added.
- The commissioner notifies players out-of-band (text, group chat, etc.) that they can log in at pool.eddiegerow.com.
- To remove access, the commissioner sets a player's status to `inactive` (do not delete rows).

### Access Rules
- Any user not found in `sessionStorage` who tries to access a protected route is redirected to `/login`.
- `eliminated` users can view `/pool` and `/pool/picks` but the pick submission UI is hidden.
- Users with `role !== 'commissioner'` who try to access `/admin/*` are redirected to `/pool`.
- Commissioner identity is set manually: set your own user's `role` to `commissioner` directly in the Supabase dashboard (one-time setup).
- All pick submission and result entry must be validated server-side via API routes — never trust client-only state. The `userId` from `sessionStorage` must be passed in request bodies and validated server-side against the `users` table.
- Supabase Row Level Security (RLS) policies enforce that users cannot read other players' picks before the week is locked, even via direct API calls.

### Auth Context
A React context (`/lib/auth-context.tsx`) wraps the app and provides:
- `{ userId, name, role, avatarUrl, isLoading, logout }` to all components
- Reads from `sessionStorage` on mount
- `logout()` clears `sessionStorage` and redirects to `/login`
- All protected pages read from this context and redirect to `/login` if `userId` is null

---

## Commands
```bash
npm run dev        # Start local dev server (http://localhost:3000)
npm run build      # Production build
npm run typecheck  # Run TypeScript type checking
npm run lint       # ESLint
```

---

## Code Style & Conventions
- TypeScript everywhere — no `any` types
- `async/await` only — no `.then()` chains
- Server-side data fetching via Next.js Server Components where possible
- API routes in `/app/api/` for mutations (picks, admin actions)
- Keep components small and single-purpose
- Always handle loading states and error states in UI
- All deadline/lock enforcement must happen server-side — never rely on client clock
- Use Supabase Row Level Security (RLS) policies to enforce data access rules
- Contestant names and tribe data live in the DB — never hardcode in logic

---

## Contestant & Tribe Seed Data (Survivor 50 Cast)

### Season Overview
- **Season:** Survivor 50 — "In the Hands of the Fans"
- **Premiere:** February 25, 2026
- **Pool starts:** Episode 3 (airs March 11, 2026)
- **Total cast:** 24 contestants
- **Starting tribes:** 3 tribes of 8

### Step 1 — Seed `tribes` table (starting tribes)

| name | color (hex) | is_merged |
|---|---|---|
| Cila | #F97316 (orange) | false |
| Kalo | #16A34A (green) | false |
| Vatu | #BE185D (magenta/pink) | false |

Commissioner will add a merged tribe row and update tribe assignments when
the merge occurs mid-season.

### Step 2 — Seed `contestants` table (all 24)

Seed all 24 with `is_eliminated = false` and `eliminated_week = null`,
EXCEPT the three already gone (see eliminations below).

| name |
|---|
| Angelina Keeley |
| Aubry Bracco |
| Benjamin "Coach" Wade |
| Charlie Davis |
| Chrissy Hofbeck |
| Christian Hubicki |
| Cirie Fields |
| Colby Donaldson |
| Dee Valladares |
| Emily Flippen |
| Genevieve Mushaluk |
| Jenna Lewis-Dougherty |
| Joe Hunter |
| Jonathan Young |
| Kamilla Karthigesu |
| Kyle Fraser |
| Mike White |
| Ozzy Lusth |
| Q Burdette |
| Rick Devens |
| Rizo Velovic |
| Savannah Louie |
| Stephenie LaGrossa Kendrick |
| Tiffany Ervin |

### Step 3 — Seed `contestant_tribe_history` (week_number = 1 for all)

Starting tribe assignments as of Episode 1:

**Cila (orange):**
Joe Hunter, Savannah Louie, Christian Hubicki, Cirie Fields,
Ozzy Lusth, Emily Flippen, Rick Devens, Jenna Lewis-Dougherty

**Kalo (green):**
Jonathan Young, Dee Valladares, Mike White, Kamilla Karthigesu,
Charlie Davis, Tiffany Ervin, Benjamin "Coach" Wade, Chrissy Hofbeck

**Vatu (magenta):**
Colby Donaldson, Genevieve Mushaluk, Rizo Velovic, Angelina Keeley,
Q Burdette, Stephenie LaGrossa Kendrick, Kyle Fraser, Aubry Bracco

### Episodes 1 & 2 — Already Eliminated (backfill data)

These three contestants are out before the pool starts at Episode 3.
Set `is_eliminated = true` and `eliminated_week` as shown.
No pool picks exist for these weeks.

| contestant | week | how |
|---|---|---|
| Jenna Lewis-Dougherty | 1 | Voted out (Ep 1 Tribal Council) |
| Kyle Fraser | 1 | Medical evacuation (Achilles tendon injury, Ep 1) |
| Savannah Louie | 2 | Voted out (Ep 2 Tribal Council) |

**21 contestants remain active entering Episode 3.**

Commissioner manages all of this via `/admin/contestants` and `/admin/tribes`.
Tribe assignments will need to be updated when swaps or the merge occur.

---

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Server-side only, never exposed to client
NEXT_PUBLIC_APP_URL=         # e.g. https://pool.eddiegerow.com
```

No email provider is required. No Supabase Auth configuration is needed.

Supabase Storage is used for avatar uploads. Create an `avatars` bucket
manually in the Supabase dashboard before deploying the profile page feature.
See the Player Profile section for RLS policy details.

---

## What NOT To Do
- Do NOT use Supabase Auth (`supabase.auth.*`) anywhere in the codebase
- Do NOT enforce pick deadlines client-side only — always validate on the server
- Do NOT expose other users' picks before the week is locked
- Do NOT allow a user to pick a contestant they've already picked in a prior week
- Do NOT allow picks from eliminated users (they can view but not pick)
- Do NOT use class components
- Do NOT use `.then()` promise chains
- Do NOT hardcode contestant names or tribe names in application logic
- Do NOT store a contestant's "current tribe" as a single column on the `contestants` table — tribe is always resolved via `contestant_tribe_history`
- Do NOT display a contestant's current tribe in historical week cells — always look up the tribe they were in during that specific week
- Do NOT give the `SUPABASE_SERVICE_ROLE_KEY` to the client bundle
- Do NOT use `localStorage` for session data — use `sessionStorage` so sessions clear when the browser is closed
- Do NOT create invite links or join request flows — player management is commissioner-only via `/admin/players`
- Do NOT allow a player to change their winner pick after the Episode 3 deadline (commissioner override has no deadline restriction)
- Do NOT allow a winner pick of a contestant who is already eliminated at time of submission
- Do NOT allow a player to submit a winner pick after the Episode 3 deadline
- Do NOT store contestant "current tribe" as a single field on winner_picks display — resolve via contestant_tribe_history like all other tribe lookups

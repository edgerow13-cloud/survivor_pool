# Survivor 50 Pool App — Project Context

## Project Overview
A private, invite-only web app for running a Survivor-style elimination pool
based on Survivor Season 50. Each week, active pool participants pick one
Survivor contestant. If that contestant is voted off (or otherwise leaves)
that episode, the pool participant is eliminated. Picks are one-and-done:
you cannot pick the same contestant twice across the season.

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
- **Database & Auth:** Supabase (Postgres + Supabase Auth)
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
Pool participants.
- `id` (uuid, PK)
- `name` (text) — display name entered at join
- `email` (text, unique) — from Supabase Auth
- `role` (enum: `commissioner`, `player`)
- `status` (enum: `active`, `eliminated`, `pending_approval`)
- `eliminated_week` (int, nullable) — which week they were eliminated
- `created_at`

### `contestants`
Survivor 50 cast. 23 total. Tribe info is NOT stored here — it lives in
`contestant_tribe_history` because tribes change during the season.
- `id` (uuid, PK)
- `name` (text)
- `is_eliminated` (boolean, default false)
- `eliminated_week` (int, nullable)
- `created_at`

### `tribes`
Master list of all tribes that exist or have existed this season.
Commissioner creates/edits these via `/admin/contestants`.
- `id` (uuid, PK)
- `name` (text) — e.g. "Bikal", "Gota", "merged"
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

### `invite_links`
- `id` (uuid, PK)
- `token` (text, unique) — random URL-safe string
- `created_by` (uuid, FK → users) — must be commissioner
- `is_active` (boolean, default true)
- `created_at`

### `join_requests`
Users who used an invite link but are awaiting commissioner approval.
- `id` (uuid, PK)
- `name` (text)
- `email` (text)
- `invite_token` (text)
- `status` (enum: `pending`, `approved`, `rejected`)
- `created_at`

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
10. **Pool ends naturally** when only one active player remains (or all remaining players are eliminated in the same week — commissioner handles tiebreak manually).
11. **Pool starts at Episode 3.** Episodes 1 and 2 can be backfilled by commissioner but are not required. No pool picks exist before Episode 3.
12. **Tribe assignments are week-specific.** The tribe shown for a contestant in the picks grid reflects their tribe during that episode week, not their original or current tribe. Commissioner updates tribe assignments whenever a swap, merge, or dissolve occurs.

---

## Commissioner Capabilities
The commissioner has a dedicated admin dashboard (`/admin`) with the ability to:
- Create and revoke invite links
- View and approve/reject join requests
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

---

## Pages & Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page with join/login CTA |
| `/join/[token]` | Public | Invite link landing; collect name + email, submit join request |
| `/login` | Public | Supabase Auth login |
| `/pool` | Authenticated | Main view: current week pick submission + picks grid |
| `/pool/picks` | Authenticated | Full picks history grid (all weeks × all players) |
| `/admin` | Commissioner only | Admin dashboard |
| `/admin/weeks` | Commissioner only | Manage weeks and enter results |
| `/admin/players` | Commissioner only | Manage players, approvals, overrides |
| `/admin/contestants` | Commissioner only | Manage contestant data and tribe assignments |
| `/admin/tribes` | Commissioner only | Manage tribes (create, rename, set colors) |

---

## Picks Grid (History View)
- **Rows:** Pool participants (active players on top, eliminated with strikethrough on their name)
- **Columns:** Week numbers
- **Cell content:** Contestant name with a colored dot indicating their tribe **that week** (looked up from `contestant_tribe_history` for that week number)
- **Cell color coding:**
  - Green background = that contestant survived (pick was safe)
  - Red background = that contestant was eliminated (fatal pick)
  - Gray background = week not yet resolved / results not entered
  - Empty/dash = no pick submitted
- **Tribe dot:** Always reflects the contestant's tribe during that specific week, not their current or original tribe. If tribes merged in week 6, week 5 cells still show pre-merge tribe colors.
- **Visibility rule:** Cells for the current (locked but not yet resolved) week show picks only after results are entered by commissioner
- **Pre-lock:** Current week cells show "Pick submitted ✓" or "No pick" for the viewing user only; other users' picks are completely hidden

---

## Auth & Access Rules

### Login Method: Magic Link (passwordless)
- No passwords. Users enter their email and receive a one-time login link.
- Supabase Auth sends the magic link email automatically.
- On click, the user is authenticated and redirected to the app.
- Supabase requires an email provider for magic links:
  - Free default: Supabase's built-in email (limited to 2 emails/day — fine for dev/testing only)
  - Production: connect a free [Resend.com](https://resend.com) account (Supabase has a built-in Resend integration). Required before launch.
- The login page (`/login`) should be a single email input field with a
  "Send me a login link" button. After submission, show a confirmation:
  "Check your email for a login link."

### Join Flow (new player)
1. Commissioner generates an invite link from `/admin` — a unique token URL
2. Commissioner shares the link however they want (text, group chat, etc.)
3. New user visits `/join/[token]`, enters their name and email
4. A `join_requests` row is created with status `pending`
5. User sees: "Your request has been submitted. You'll get an email when you're approved."
6. Commissioner approves in `/admin/players`
7. On approval: user's `status` is set to `active`, a Supabase Auth account is
   created (or linked if they already have one), and the user receives a magic
   link email to log in for the first time
8. User clicks link → lands on `/pool`

### Access Rules
- `pending_approval` users who try to access `/pool` see a "waiting for approval" screen
- `eliminated` users can view `/pool` and `/pool/picks` but the pick submission UI is hidden
- Commissioner is set manually: after initial deployment, set your own user's `role` to `commissioner` directly in the Supabase dashboard (one-time setup)
- All pick submission and result entry must be validated server-side via API routes — never trust client-only state
- Supabase Row Level Security (RLS) policies enforce that users cannot read other players' picks before the week is locked, even via direct API calls

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
- **Total cast:** 24 contestants (NOTE: update the overview section count from 23 → 24)
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
NEXT_PUBLIC_APP_URL=         # e.g. https://your-app.vercel.app
```

### Email Setup (Required for Magic Links in Production)
Supabase's built-in email sender is limited to 2 emails/day — only usable
for local development. Before inviting real users:
1. Create a free account at resend.com
2. In Supabase dashboard → Authentication → SMTP Settings → connect Resend
3. No additional env vars needed — this is configured in the Supabase dashboard directly

---

## What NOT To Do
- Do NOT enforce pick deadlines client-side only — always validate on the server
- Do NOT expose other users' picks before the week is locked
- Do NOT allow a user to pick a contestant they've already picked in a prior week
- Do NOT allow picks from eliminated or pending users
- Do NOT use class components
- Do NOT use `.then()` promise chains
- Do NOT hardcode contestant names or tribe names in application logic
- Do NOT store a contestant's "current tribe" as a single column on the `contestants` table — tribe is always resolved via `contestant_tribe_history`
- Do NOT display a contestant's current tribe in historical week cells — always look up the tribe they were in during that specific week
- Do NOT give the `SUPABASE_SERVICE_ROLE_KEY` to the client bundle

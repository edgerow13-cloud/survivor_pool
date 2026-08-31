/**
 * The first week the pool actually collects picks for. Earlier weeks may
 * exist in the `weeks` table — the commissioner can backfill them for
 * historical reference (see CLAUDE.md) — but they're "pre-pool": players
 * never see them as pickable, and any player-facing "current week" logic
 * must skip them.
 *
 * Referenced by:
 *  - app/admin/weeks/WeeksTable.tsx — marks earlier weeks "(pre-pool)"
 *  - app/api/pool/data, app/pool/page.tsx, app/pool/picks/page.tsx —
 *    which week is currently pickable
 *  - app/admin/page.tsx, app/api/admin/send-pick-reminder,
 *    app/admin/email/page.tsx — which week needs a pick reminder
 *  - app/api/winner-pick, app/api/profile, app/api/pool/picks-history —
 *    the winner-pick deadline (locks when this week airs)
 *
 * Update every one of these together if a future season's pool start
 * week changes.
 */
export const POOL_START_WEEK = 2

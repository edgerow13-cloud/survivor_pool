import 'server-only'
import { getAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof getAdminClient>

/**
 * Resolves the id of the currently active season (seasons.is_active = true).
 * `contestants`, `tribes`, and `weeks` are all scoped to a season — every
 * query against those tables must filter by this id.
 *
 * `users` is NOT season-scoped — the same friend group plays across seasons,
 * so no season filtering is needed there.
 */
export async function getActiveSeasonId(db: AdminClient): Promise<string> {
  const { data, error } = await db
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .single()

  if (error || !data) {
    throw new Error('No active season is configured (seasons.is_active = true)')
  }

  return data.id as string
}

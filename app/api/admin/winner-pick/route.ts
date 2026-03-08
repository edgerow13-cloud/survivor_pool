import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

/**
 * Commissioner-only winner pick upsert.
 * Identical to the player-facing /api/winner-pick route except:
 *   - Requires commissioner role (validated via requireCommissioner)
 *   - No Episode 3 deadline check — commissioner can update any player's pick at any time
 *   - Operates on targetUserId, not the commissioner's own userId
 *   - contestantId = null clears the pick (deletes the row)
 */
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    userId?: string
    targetUserId?: string
    contestantId?: string | null
  }

  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { targetUserId, contestantId } = body

  if (!targetUserId) {
    return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 })
  }

  const db = getAdminClient()

  // Validate the target player exists
  const { data: targetUser } = await db
    .from('users')
    .select('id')
    .eq('id', targetUserId)
    .single()

  if (!targetUser) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  // null contestantId = clear the pick
  if (!contestantId) {
    await db.from('winner_picks').delete().eq('user_id', targetUserId)
    return NextResponse.json({ ok: true })
  }

  // Validate contestant exists and is not eliminated
  const { data: contestant } = await db
    .from('contestants')
    .select('id, name, is_eliminated')
    .eq('id', contestantId)
    .single()

  if (!contestant) {
    return NextResponse.json({ error: 'Contestant not found' }, { status: 400 })
  }

  if (contestant.is_eliminated) {
    return NextResponse.json(
      { error: `${contestant.name as string} has already been eliminated from the game` },
      { status: 400 }
    )
  }

  const { error } = await db.from('winner_picks').upsert(
    {
      user_id: targetUserId,
      contestant_id: contestantId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

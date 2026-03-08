import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

// POST — load profile page data
export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string }
  const { userId } = body

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminClient()

  const { data: user } = await db
    .from('users')
    .select('id, name')
    .eq('id', userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  const [
    { data: contestantsRaw },
    { data: tribesRaw },
    { data: tribeHistoryRaw },
    { data: ep3Week },
    { data: winnerPick },
  ] = await Promise.all([
    db.from('contestants').select('id, name, is_eliminated').eq('is_eliminated', false).order('name'),
    db.from('tribes').select('id, name, color'),
    db.from('contestant_tribe_history').select('contestant_id, tribe_id, week_number'),
    db.from('weeks').select('episode_date').eq('week_number', 3).maybeSingle(),
    db.from('winner_picks').select('contestant_id').eq('user_id', userId).maybeSingle(),
  ])

  // Build latest tribe per contestant
  const latestTribe: Record<string, { tribe_id: string; week_number: number }> = {}
  for (const row of tribeHistoryRaw ?? []) {
    const existing = latestTribe[row.contestant_id]
    if (!existing || row.week_number > existing.week_number) {
      latestTribe[row.contestant_id] = { tribe_id: row.tribe_id, week_number: row.week_number }
    }
  }

  const tribeMap = Object.fromEntries((tribesRaw ?? []).map((t) => [t.id, t]))

  const contestants = (contestantsRaw ?? []).map((c) => {
    const assignment = latestTribe[c.id]
    const tribe = assignment ? (tribeMap[assignment.tribe_id] ?? null) : null
    return {
      id: c.id,
      name: c.name,
      tribe: tribe ? { id: tribe.id, name: tribe.name, color: tribe.color } : null,
    }
  })

  return NextResponse.json({
    user: { id: user.id, name: user.name },
    contestants,
    winnerPick: winnerPick ?? null,
    ep3Deadline: ep3Week?.episode_date ?? null,
  })
}

// PATCH — update display name
export async function PATCH(request: NextRequest) {
  const body = await request.json() as { userId?: string; name?: string }
  const { userId, name } = body

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
  }

  const trimmed = name.trim()

  const { data: user } = await getAdminClient()
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  const { error } = await getAdminClient()
    .from('users')
    .update({ name: trimmed })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: 'Failed to update name' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, name: trimmed })
}

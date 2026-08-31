import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getActiveSeasonId } from '@/lib/get-active-season'
import { POOL_START_WEEK } from '@/lib/pool-config'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string }
  const { userId } = body

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminClient()

  const { data: me } = await db
    .from('users')
    .select('id, status, role')
    .eq('id', userId)
    .single()

  if (!me || (me.status !== 'active' && me.status !== 'eliminated' && me.role !== 'commissioner')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let seasonId: string
  try {
    seasonId = await getActiveSeasonId(db)
  } catch {
    return NextResponse.json({ error: 'No active season is configured' }, { status: 500 })
  }

  const [
    { data: weeks },
    { data: allUsers },
    { data: allPicks },
    { data: contestants },
    { data: tribeHistory },
    { data: tribes },
    { data: weekEliminations },
    { data: winnerPicksRaw },
    { data: poolStartWeek },
  ] = await Promise.all([
    db.from('weeks').select('*').eq('season_id', seasonId).order('week_number', { ascending: true }),
    db.from('users').select('*').order('name'),
    db.from('picks').select('*'),
    db.from('contestants').select('*').eq('season_id', seasonId),
    db.from('contestant_tribe_history').select('*'),
    db.from('tribes').select('*').eq('season_id', seasonId),
    db.from('week_eliminations').select('*'),
    db.from('winner_picks').select('user_id, contestant_id').eq('season_id', seasonId),
    // Winner picks lock when the pool's first week (Episode 2) airs. Uses the shared POOL_START_WEEK constant (lib/pool-config.ts).
    db.from('weeks').select('episode_date').eq('season_id', seasonId).eq('week_number', POOL_START_WEEK).maybeSingle(),
  ])

  // Filter picks: show other players' picks once week is effectively locked
  // (deadline passed OR manually locked OR results entered)
  const now = new Date()
  const visibleWeekIds = new Set(
    (weeks ?? []).filter(
      (w) => w.is_results_entered || w.is_locked || new Date(w.episode_date) <= now
    ).map((w) => w.id)
  )
  const filteredPicks = (allPicks ?? []).filter(
    (p) => visibleWeekIds.has(p.week_id) || p.user_id === userId
  )

  // Filter winner picks: hide other players' picks until the winner-pick deadline has passed
  const winnerPickDeadlinePassed = poolStartWeek?.episode_date
    ? new Date() >= new Date(poolStartWeek.episode_date)
    : false
  const filteredWinnerPicks = winnerPickDeadlinePassed
    ? (winnerPicksRaw ?? [])
    : (winnerPicksRaw ?? []).filter((wp) => wp.user_id === userId)

  return NextResponse.json({
    weeks: weeks ?? [],
    allUsers: allUsers ?? [],
    allPicks: filteredPicks,
    contestants: contestants ?? [],
    tribeHistory: tribeHistory ?? [],
    tribes: tribes ?? [],
    currentUserId: userId,
    weekEliminations: weekEliminations ?? [],
    winnerPicks: filteredWinnerPicks,
    winnerPickDeadline: poolStartWeek?.episode_date ?? null,
  })
}

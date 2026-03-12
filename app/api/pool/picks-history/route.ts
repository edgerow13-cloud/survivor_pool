import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string }
  const { userId } = body

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: me } = await getAdminClient()
    .from('users')
    .select('id, status, role')
    .eq('id', userId)
    .single()

  if (!me || (me.status !== 'active' && me.status !== 'eliminated' && me.role !== 'commissioner')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    { data: ep3Week },
  ] = await Promise.all([
    getAdminClient().from('weeks').select('*').order('week_number', { ascending: true }),
    getAdminClient().from('users').select('*').order('name'),
    getAdminClient().from('picks').select('*'),
    getAdminClient().from('contestants').select('*'),
    getAdminClient().from('contestant_tribe_history').select('*'),
    getAdminClient().from('tribes').select('*'),
    getAdminClient().from('week_eliminations').select('*'),
    getAdminClient().from('winner_picks').select('user_id, contestant_id'),
    getAdminClient().from('weeks').select('episode_date').eq('week_number', 3).maybeSingle(),
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

  // Filter winner picks: hide other players' picks until the Ep3 deadline has passed
  const ep3DeadlinePassed = ep3Week?.episode_date
    ? new Date() >= new Date(ep3Week.episode_date)
    : false
  const filteredWinnerPicks = ep3DeadlinePassed
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
    ep3Deadline: ep3Week?.episode_date ?? null,
  })
}

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
    .select('*')
    .eq('id', userId)
    .single()

  if (!me || (me.status !== 'active' && me.status !== 'eliminated' && me.role !== 'commissioner')) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  const [
    { data: contestants },
    { data: tribes },
    { data: tribeHistory },
    { data: weeks },
    { data: allUsers },
    { data: weekEliminations },
  ] = await Promise.all([
    getAdminClient().from('contestants').select('*').order('name'),
    getAdminClient().from('tribes').select('*'),
    getAdminClient().from('contestant_tribe_history').select('*'),
    getAdminClient().from('weeks').select('*').order('week_number', { ascending: true }),
    getAdminClient().from('users').select('*').order('name'),
    getAdminClient().from('week_eliminations').select('*'),
  ])

  // Current week = first unresolved week (ascending order)
  const currentWeek = weeks ? (weeks.find((w) => !w.is_results_entered) ?? null) : null

  const [{ data: userPickData }, { data: usedPicksData }, { data: weekAllPicksData }, { data: winnerPickData }] =
    await Promise.all([
      currentWeek
        ? getAdminClient()
            .from('picks')
            .select('*')
            .eq('user_id', userId)
            .eq('week_id', currentWeek.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      currentWeek
        ? getAdminClient()
            .from('picks')
            .select('contestant_id, week_id')
            .eq('user_id', userId)
            .neq('week_id', currentWeek.id)
            .not('contestant_id', 'is', null)
        : Promise.resolve({ data: [], error: null }),
      currentWeek && (
        currentWeek.is_results_entered ||
        currentWeek.is_locked ||
        new Date(currentWeek.episode_date as string) <= new Date()
      )
        ? getAdminClient().from('picks').select('*').eq('week_id', currentWeek.id)
        : Promise.resolve({ data: [], error: null }),
      getAdminClient().from('winner_picks').select('*').eq('user_id', userId).maybeSingle(),
    ])

  const usedPicksTyped = (usedPicksData ?? []) as Array<{ contestant_id: string | null; week_id: string }>
  const usedContestantIds = usedPicksTyped
    .map((p) => p.contestant_id)
    .filter((id): id is string => id !== null)
  const usedPicks = usedPicksTyped
    .filter((p): p is { contestant_id: string; week_id: string } => p.contestant_id !== null)

  return NextResponse.json({
    me,
    contestants: contestants ?? [],
    tribes: tribes ?? [],
    tribeHistory: tribeHistory ?? [],
    weeks: weeks ?? [],
    userPick: userPickData ?? null,
    usedContestantIds,
    usedPicks,
    weekAllPicks: weekAllPicksData ?? [],
    allUsers: allUsers ?? [],
    weekEliminations: weekEliminations ?? [],
    winnerPick: winnerPickData ?? null,
  })
}

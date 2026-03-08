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
  ] = await Promise.all([
    getAdminClient().from('contestants').select('*').order('name'),
    getAdminClient().from('tribes').select('*'),
    getAdminClient().from('contestant_tribe_history').select('*'),
    getAdminClient().from('weeks').select('*').order('week_number', { ascending: false }),
    getAdminClient().from('users').select('*').order('name'),
  ])

  const currentWeek = weeks && weeks.length > 0 ? weeks[0] : null

  const [{ data: userPickData }, { data: usedPicksData }, { data: weekAllPicksData }] =
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
            .select('contestant_id')
            .eq('user_id', userId)
            .neq('week_id', currentWeek.id)
            .not('contestant_id', 'is', null)
        : Promise.resolve({ data: [], error: null }),
      currentWeek && currentWeek.is_results_entered
        ? getAdminClient().from('picks').select('*').eq('week_id', currentWeek.id)
        : Promise.resolve({ data: [], error: null }),
    ])

  const usedContestantIds = (
    (usedPicksData ?? []) as Array<{ contestant_id: string | null }>
  )
    .map((p) => p.contestant_id)
    .filter((id): id is string => id !== null)

  return NextResponse.json({
    me,
    contestants: contestants ?? [],
    tribes: tribes ?? [],
    tribeHistory: tribeHistory ?? [],
    weeks: weeks ?? [],
    userPick: userPickData ?? null,
    usedContestantIds,
    weekAllPicks: weekAllPicksData ?? [],
    allUsers: allUsers ?? [],
  })
}

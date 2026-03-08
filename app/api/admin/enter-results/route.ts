import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; week_id?: string; eliminated_contestant_ids?: string[] }
  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { week_id, eliminated_contestant_ids } = body
  if (!week_id) {
    return NextResponse.json({ error: 'Missing week_id' }, { status: 400 })
  }

  const elimIds = eliminated_contestant_ids ?? []

  const { data: week, error: weekError } = await getAdminClient()
    .from('weeks')
    .select('*')
    .eq('id', week_id)
    .single()

  if (weekError || !week) {
    return NextResponse.json({ error: 'Week not found' }, { status: 404 })
  }

  // If re-entering results, reverse previous eliminations for this week
  if (week.is_results_entered) {
    const { error: resetUsersError } = await getAdminClient()
      .from('users')
      .update({ status: 'active', eliminated_week: null })
      .eq('eliminated_week', week.week_number)
    if (resetUsersError) {
      return NextResponse.json({ error: resetUsersError.message }, { status: 500 })
    }

    const { error: resetPicksError } = await getAdminClient()
      .from('picks')
      .update({ outcome: null })
      .eq('week_id', week_id)
    if (resetPicksError) {
      return NextResponse.json({ error: resetPicksError.message }, { status: 500 })
    }

    // Clear previous week_eliminations rows for this week
    const { error: deleteElimError } = await getAdminClient()
      .from('week_eliminations')
      .delete()
      .eq('week_id', week_id)
    if (deleteElimError) {
      return NextResponse.json({ error: deleteElimError.message }, { status: 500 })
    }

    // Reset contestants that were marked eliminated this week
    const { error: resetContestantsError } = await getAdminClient()
      .from('contestants')
      .update({ is_eliminated: false, eliminated_week: null })
      .eq('eliminated_week', week.week_number)
    if (resetContestantsError) {
      return NextResponse.json({ error: resetContestantsError.message }, { status: 500 })
    }
  }

  // Lock week and mark results entered
  const { error: weekUpdateError } = await getAdminClient()
    .from('weeks')
    .update({
      is_results_entered: true,
      is_locked: true,
    })
    .eq('id', week_id)
  if (weekUpdateError) {
    return NextResponse.json({ error: weekUpdateError.message }, { status: 500 })
  }

  // Insert new week_eliminations rows
  if (elimIds.length > 0) {
    const { error: insertElimError } = await getAdminClient()
      .from('week_eliminations')
      .insert(elimIds.map((contestant_id) => ({ week_id, contestant_id })))
    if (insertElimError) {
      return NextResponse.json({ error: insertElimError.message }, { status: 500 })
    }

    // Mark contestants as eliminated
    const { error: contestantElimError } = await getAdminClient()
      .from('contestants')
      .update({ is_eliminated: true, eliminated_week: week.week_number })
      .in('id', elimIds)
    if (contestantElimError) {
      return NextResponse.json({ error: contestantElimError.message }, { status: 500 })
    }
  }

  // Get all picks for this week and all active users
  const [{ data: picks }, { data: activeUsers }] = await Promise.all([
    getAdminClient().from('picks').select('*').eq('week_id', week_id),
    getAdminClient().from('users').select('id').eq('status', 'active'),
  ])

  const elimSet = new Set(elimIds)
  const activeUserIds = new Set((activeUsers ?? []).map((u: { id: string }) => u.id))
  const pickedUserIds = new Set((picks ?? []).map((p: { user_id: string }) => p.user_id))
  const usersToEliminate: string[] = []

  const eliminatedPicks: string[] = []
  const safePicks: string[] = []
  const noPickIds: string[] = []

  for (const pick of picks ?? []) {
    if (pick.contestant_id && elimSet.has(pick.contestant_id)) {
      eliminatedPicks.push(pick.id)
      if (activeUserIds.has(pick.user_id)) usersToEliminate.push(pick.user_id)
    } else if (pick.contestant_id !== null) {
      safePicks.push(pick.id)
    } else {
      noPickIds.push(pick.id)
      if (activeUserIds.has(pick.user_id)) usersToEliminate.push(pick.user_id)
    }
  }

  const newNoPicks: Array<{
    user_id: string
    week_id: string
    contestant_id: null
    outcome: string
    is_commissioner_override: boolean
  }> = []
  for (const userId of activeUserIds) {
    if (!pickedUserIds.has(userId)) {
      newNoPicks.push({
        user_id: userId,
        week_id,
        contestant_id: null,
        outcome: 'no_pick',
        is_commissioner_override: false,
      })
      usersToEliminate.push(userId)
    }
  }

  const outcomeResults = await Promise.all([
    eliminatedPicks.length > 0
      ? getAdminClient().from('picks').update({ outcome: 'eliminated' }).in('id', eliminatedPicks)
      : Promise.resolve({ error: null }),
    safePicks.length > 0
      ? getAdminClient().from('picks').update({ outcome: 'safe' }).in('id', safePicks)
      : Promise.resolve({ error: null }),
    noPickIds.length > 0
      ? getAdminClient().from('picks').update({ outcome: 'no_pick' }).in('id', noPickIds)
      : Promise.resolve({ error: null }),
    newNoPicks.length > 0
      ? getAdminClient().from('picks').insert(newNoPicks)
      : Promise.resolve({ error: null }),
  ])
  const outcomeError = outcomeResults.find((r) => r.error)?.error
  if (outcomeError) {
    return NextResponse.json({ error: outcomeError.message }, { status: 500 })
  }

  if (usersToEliminate.length > 0) {
    const { error: eliminateError } = await getAdminClient()
      .from('users')
      .update({ status: 'eliminated', eliminated_week: week.week_number })
      .in('id', usersToEliminate)
    if (eliminateError) {
      return NextResponse.json({ error: eliminateError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

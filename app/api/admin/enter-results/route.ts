import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await requireCommissioner(request)
  if (auth instanceof NextResponse) return auth

  const { week_id, eliminated_contestant_id } = await request.json()
  if (!week_id) {
    return NextResponse.json({ error: 'Missing week_id' }, { status: 400 })
  }

  const { data: week, error: weekError } = await adminClient
    .from('weeks')
    .select('*')
    .eq('id', week_id)
    .single()

  if (weekError || !week) {
    return NextResponse.json({ error: 'Week not found' }, { status: 404 })
  }

  // If re-entering results, reverse previous eliminations for this week
  if (week.is_results_entered) {
    await adminClient
      .from('users')
      .update({ status: 'active', eliminated_week: null })
      .eq('eliminated_week', week.week_number)

    await adminClient.from('picks').update({ outcome: null }).eq('week_id', week_id)
  }

  // Lock week and record the boot
  await adminClient
    .from('weeks')
    .update({
      eliminated_contestant_id: eliminated_contestant_id ?? null,
      is_results_entered: true,
      is_locked: true,
    })
    .eq('id', week_id)

  // Get all picks for this week and all active users
  const [{ data: picks }, { data: activeUsers }] = await Promise.all([
    adminClient.from('picks').select('*').eq('week_id', week_id),
    adminClient.from('users').select('id').eq('status', 'active'),
  ])

  const activeUserIds = new Set((activeUsers ?? []).map((u: { id: string }) => u.id))
  const pickedUserIds = new Set((picks ?? []).map((p: { user_id: string }) => p.user_id))
  const usersToEliminate: string[] = []

  // Determine outcome for each existing pick
  const eliminatedPicks: string[] = []
  const safePicks: string[] = []
  const noPickIds: string[] = []

  for (const pick of picks ?? []) {
    if (pick.contestant_id === eliminated_contestant_id && eliminated_contestant_id) {
      eliminatedPicks.push(pick.id)
      if (activeUserIds.has(pick.user_id)) usersToEliminate.push(pick.user_id)
    } else if (pick.contestant_id !== null) {
      safePicks.push(pick.id)
    } else {
      noPickIds.push(pick.id)
      if (activeUserIds.has(pick.user_id)) usersToEliminate.push(pick.user_id)
    }
  }

  // Build no_pick inserts for active users who have no pick row at all
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

  // Apply outcome updates in parallel
  await Promise.all([
    eliminatedPicks.length > 0
      ? adminClient.from('picks').update({ outcome: 'eliminated' }).in('id', eliminatedPicks)
      : Promise.resolve(),
    safePicks.length > 0
      ? adminClient.from('picks').update({ outcome: 'safe' }).in('id', safePicks)
      : Promise.resolve(),
    noPickIds.length > 0
      ? adminClient.from('picks').update({ outcome: 'no_pick' }).in('id', noPickIds)
      : Promise.resolve(),
    newNoPicks.length > 0 ? adminClient.from('picks').insert(newNoPicks) : Promise.resolve(),
  ])

  // Eliminate users
  if (usersToEliminate.length > 0) {
    await adminClient
      .from('users')
      .update({ status: 'eliminated', eliminated_week: week.week_number })
      .in('id', usersToEliminate)
  }

  return NextResponse.json({ ok: true })
}

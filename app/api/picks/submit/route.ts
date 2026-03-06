import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: me, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError || !me) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  if (me.status !== 'active' && me.role !== 'commissioner') {
    return NextResponse.json({ error: 'You are not eligible to pick' }, { status: 403 })
  }

  const body = await request.json() as { week_id?: string; contestant_id?: string }
  const { week_id, contestant_id } = body

  if (!week_id || !contestant_id) {
    return NextResponse.json({ error: 'Missing week_id or contestant_id' }, { status: 400 })
  }

  // Load the week
  const { data: week, error: weekError } = await supabase
    .from('weeks')
    .select('*')
    .eq('id', week_id)
    .single()

  if (weekError || !week) {
    return NextResponse.json({ error: 'Week not found' }, { status: 404 })
  }

  // Server-side deadline enforcement
  const now = new Date()
  const deadline = new Date(week.episode_date as string)
  if (week.is_locked || now >= deadline) {
    return NextResponse.json({ error: 'Picks are locked for this week' }, { status: 403 })
  }

  // Validate contestant exists and is not eliminated
  const { data: contestant, error: contestantError } = await supabase
    .from('contestants')
    .select('id, is_eliminated')
    .eq('id', contestant_id)
    .single()

  if (contestantError || !contestant) {
    return NextResponse.json({ error: 'Contestant not found' }, { status: 400 })
  }

  if (contestant.is_eliminated) {
    return NextResponse.json({ error: 'This contestant has already been eliminated' }, { status: 400 })
  }

  // No-repeat check: has this user already picked this contestant in a different week?
  const { data: priorPick } = await supabase
    .from('picks')
    .select('id')
    .eq('user_id', user.id)
    .eq('contestant_id', contestant_id)
    .neq('week_id', week_id)
    .limit(1)
    .maybeSingle()

  if (priorPick) {
    return NextResponse.json({ error: 'You have already picked this contestant in a prior week' }, { status: 400 })
  }

  // Upsert the pick
  const { error: upsertError } = await supabase
    .from('picks')
    .upsert(
      {
        user_id: user.id,
        week_id,
        contestant_id,
        outcome: null,
        is_commissioner_override: false,
      },
      { onConflict: 'user_id,week_id' }
    )

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to save pick' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

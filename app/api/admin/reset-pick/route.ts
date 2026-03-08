import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; user_id?: string; week_id?: string }
  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { user_id, week_id } = body
  if (!user_id || !week_id) {
    return NextResponse.json({ error: 'Missing user_id or week_id' }, { status: 400 })
  }

  const { data: week, error: weekError } = await getAdminClient()
    .from('weeks')
    .select('is_results_entered')
    .eq('id', week_id)
    .single()

  if (weekError || !week) {
    return NextResponse.json({ error: 'Week not found' }, { status: 404 })
  }

  if (week.is_results_entered) {
    // Results entered: set pick to null with no_pick outcome
    const { error } = await getAdminClient()
      .from('picks')
      .update({ contestant_id: null, outcome: 'no_pick' })
      .eq('user_id', user_id)
      .eq('week_id', week_id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    // Results not yet entered: delete the pick row entirely
    const { error } = await getAdminClient()
      .from('picks')
      .delete()
      .eq('user_id', user_id)
      .eq('week_id', week_id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

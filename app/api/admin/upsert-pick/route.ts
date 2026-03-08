import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'
import type { PickOutcome } from '@/types/database'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; user_id?: string; week_id?: string; contestant_id?: string | null }
  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { user_id, week_id, contestant_id } = body
  if (!user_id || !week_id) {
    return NextResponse.json({ error: 'Missing user_id or week_id' }, { status: 400 })
  }

  // Fetch the week to determine if results are already entered so we can set outcome correctly
  const { data: week } = await getAdminClient()
    .from('weeks')
    .select('is_results_entered, eliminated_contestant_id')
    .eq('id', week_id)
    .single()

  // Compute outcome if results have been entered for this week
  let outcome: PickOutcome | null = null
  if (week?.is_results_entered) {
    if (!contestant_id) {
      outcome = 'no_pick'
    } else if (contestant_id === week.eliminated_contestant_id) {
      outcome = 'eliminated'
    } else {
      outcome = 'safe'
    }
  }

  const { error } = await getAdminClient().from('picks').upsert(
    {
      user_id,
      week_id,
      contestant_id: contestant_id ?? null,
      outcome,
      is_commissioner_override: true,
    },
    { onConflict: 'user_id,week_id' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

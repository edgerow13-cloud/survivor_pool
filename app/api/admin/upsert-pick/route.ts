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

  // Fetch the week and its eliminations to determine outcome
  const [{ data: week }, { data: eliminations }] = await Promise.all([
    getAdminClient()
      .from('weeks')
      .select('is_results_entered')
      .eq('id', week_id)
      .single(),
    getAdminClient()
      .from('week_eliminations')
      .select('contestant_id')
      .eq('week_id', week_id),
  ])

  // Compute outcome if results have been entered for this week
  let outcome: PickOutcome | null = null
  if (week?.is_results_entered) {
    if (!contestant_id) {
      outcome = 'no_pick'
    } else {
      const elimSet = new Set((eliminations ?? []).map((e: { contestant_id: string }) => e.contestant_id))
      outcome = elimSet.has(contestant_id) ? 'eliminated' : 'safe'
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

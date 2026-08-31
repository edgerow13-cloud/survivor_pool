import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'
import { getActiveSeasonId } from '@/lib/get-active-season'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; week_number?: number; episode_date?: string }
  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { week_number, episode_date } = body

  if (!week_number || week_number < 1) {
    return NextResponse.json({ error: 'Invalid week_number' }, { status: 400 })
  }
  if (!episode_date || isNaN(Date.parse(episode_date))) {
    return NextResponse.json({ error: 'Invalid episode_date' }, { status: 400 })
  }

  const db = getAdminClient()
  let seasonId: string
  try {
    seasonId = await getActiveSeasonId(db)
  } catch {
    return NextResponse.json({ error: 'No active season is configured' }, { status: 500 })
  }

  const { error } = await db.from('weeks').insert({
    season_id: seasonId,
    week_number,
    episode_date,
    is_locked: false,
    is_results_entered: false,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: `Week ${week_number} already exists` }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

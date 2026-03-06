import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await requireCommissioner(request)
  if (auth instanceof NextResponse) return auth

  const { week_number, episode_date } = await request.json()

  if (!week_number || week_number < 1) {
    return NextResponse.json({ error: 'Invalid week_number' }, { status: 400 })
  }
  if (!episode_date || isNaN(Date.parse(episode_date))) {
    return NextResponse.json({ error: 'Invalid episode_date' }, { status: 400 })
  }

  const { error } = await adminClient.from('weeks').insert({
    week_number,
    episode_date: new Date(episode_date).toISOString(),
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

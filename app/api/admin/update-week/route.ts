import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await requireCommissioner(request)
  if (auth instanceof NextResponse) return auth

  const { week_id, episode_date, is_locked } = await request.json()

  if (!week_id) {
    return NextResponse.json({ error: 'Missing week_id' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (episode_date !== undefined) updates.episode_date = new Date(episode_date).toISOString()
  if (is_locked !== undefined) updates.is_locked = is_locked

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await getAdminClient().from('weeks').update(updates).eq('id', week_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

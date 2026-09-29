import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'
import { getActiveSeasonId } from '@/lib/get-active-season'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; user_id?: string; paid?: boolean }
  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { user_id, paid } = body
  if (!user_id || typeof paid !== 'boolean') {
    return NextResponse.json({ error: 'Missing user_id or paid' }, { status: 400 })
  }

  const db = getAdminClient()
  const seasonId = await getActiveSeasonId(db)

  const { error } = paid
    ? await db
        .from('season_payments')
        .upsert({ user_id, season_id: seasonId }, { onConflict: 'user_id,season_id', ignoreDuplicates: true })
    : await db
        .from('season_payments')
        .delete()
        .eq('user_id', user_id)
        .eq('season_id', seasonId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

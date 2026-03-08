import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; contestant_id?: string; tribe_id?: string; week_number?: number }
  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { contestant_id, tribe_id, week_number } = body
  if (!contestant_id || !tribe_id || !week_number) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await getAdminClient()
    .from('contestant_tribe_history')
    .upsert(
      { contestant_id, tribe_id, week_number },
      { onConflict: 'contestant_id,week_number' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

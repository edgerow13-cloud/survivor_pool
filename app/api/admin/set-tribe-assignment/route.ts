import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await requireCommissioner(request)
  if (auth instanceof NextResponse) return auth

  const { contestant_id, tribe_id, week_number } = await request.json()
  if (!contestant_id || !tribe_id || !week_number) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await adminClient
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

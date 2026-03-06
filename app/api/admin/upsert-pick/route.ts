import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await requireCommissioner(request)
  if (auth instanceof NextResponse) return auth

  const { user_id, week_id, contestant_id } = await request.json()
  if (!user_id || !week_id) {
    return NextResponse.json({ error: 'Missing user_id or week_id' }, { status: 400 })
  }

  const { error } = await getAdminClient().from('picks').upsert(
    {
      user_id,
      week_id,
      contestant_id: contestant_id ?? null,
      outcome: null,
      is_commissioner_override: true,
    },
    { onConflict: 'user_id,week_id' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

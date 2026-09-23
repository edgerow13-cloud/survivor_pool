import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; user_id?: string; has_paid?: boolean }
  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { user_id, has_paid } = body
  if (!user_id || typeof has_paid !== 'boolean') {
    return NextResponse.json({ error: 'Missing user_id or has_paid' }, { status: 400 })
  }

  const { error } = await getAdminClient()
    .from('users')
    .update({ has_paid })
    .eq('id', user_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

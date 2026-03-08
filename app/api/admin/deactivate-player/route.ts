import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; playerId?: string }
  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { playerId } = body

  if (!playerId) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  const { error } = await getAdminClient()
    .from('users')
    .update({ status: 'inactive' })
    .eq('id', playerId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await requireCommissioner(request)
  if (auth instanceof NextResponse) return auth

  const { join_request_id } = await request.json()
  if (!join_request_id) {
    return NextResponse.json({ error: 'Missing join_request_id' }, { status: 400 })
  }

  const { error } = await getAdminClient()
    .from('join_requests')
    .update({ status: 'rejected' })
    .eq('id', join_request_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

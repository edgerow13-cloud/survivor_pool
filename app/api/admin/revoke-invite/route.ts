import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await requireCommissioner(request)
  if (auth instanceof NextResponse) return auth

  const { invite_link_id } = await request.json()
  if (!invite_link_id) {
    return NextResponse.json({ error: 'Missing invite_link_id' }, { status: 400 })
  }

  const { error } = await getAdminClient()
    .from('invite_links')
    .update({ is_active: false })
    .eq('id', invite_link_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

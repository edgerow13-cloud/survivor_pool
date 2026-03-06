import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { adminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  const auth = await requireCommissioner(request)
  if (auth instanceof NextResponse) return auth

  const token = randomBytes(16).toString('hex')

  const { error } = await adminClient.from('invite_links').insert({
    token,
    created_by: auth.userId,
    is_active: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ token })
}

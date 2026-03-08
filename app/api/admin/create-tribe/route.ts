import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; name?: string; color?: string; is_merged?: boolean }
  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { name, color, is_merged } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return NextResponse.json(
      { error: 'Invalid color — must be hex like #F97316' },
      { status: 400 }
    )
  }

  const { error } = await getAdminClient().from('tribes').insert({
    name: name.trim(),
    color,
    is_merged: is_merged ?? false,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await requireCommissioner(request)
  if (auth instanceof NextResponse) return auth

  const { tribe_id, name, color, is_merged } = await request.json()
  if (!tribe_id) {
    return NextResponse.json({ error: 'Missing tribe_id' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name.trim()
  if (color !== undefined) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ error: 'Invalid color' }, { status: 400 })
    }
    updates.color = color
  }
  if (is_merged !== undefined) updates.is_merged = is_merged

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await getAdminClient().from('tribes').update(updates).eq('id', tribe_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

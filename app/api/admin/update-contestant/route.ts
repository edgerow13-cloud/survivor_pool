import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; contestant_id?: string; name?: string; is_eliminated?: boolean; eliminated_week?: number | null }
  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { contestant_id, name, is_eliminated, eliminated_week } = body
  if (!contestant_id) {
    return NextResponse.json({ error: 'Missing contestant_id' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (is_eliminated !== undefined) updates.is_eliminated = is_eliminated
  if (eliminated_week !== undefined) updates.eliminated_week = eliminated_week

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await getAdminClient()
    .from('contestants')
    .update(updates)
    .eq('id', contestant_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

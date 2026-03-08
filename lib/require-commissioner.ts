import 'server-only'
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function requireCommissioner(
  userId: string | undefined
): Promise<{ userId: string } | NextResponse> {
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await getAdminClient()
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (!data || data.role !== 'commissioner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { userId }
}

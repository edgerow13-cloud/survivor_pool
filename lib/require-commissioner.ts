import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function requireCommissioner(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!data || data.role !== 'commissioner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { userId: user.id }
}

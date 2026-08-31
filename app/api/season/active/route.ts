import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

// GET — the active season's number + name. Public, read-only, no PII —
// used for branding (nav logo subtext) so it's fetchable without a userId.
export async function GET() {
  const db = getAdminClient()

  const { data, error } = await db
    .from('seasons')
    .select('season_number, name')
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'No active season is configured' }, { status: 500 })
  }

  return NextResponse.json({ seasonNumber: data.season_number, name: data.name })
}

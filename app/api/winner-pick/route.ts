import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

// POST — upsert the authenticated user's season winner prediction
export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; contestantId?: string }
  const { userId, contestantId } = body

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!contestantId) {
    return NextResponse.json({ error: 'Missing contestantId' }, { status: 400 })
  }

  const db = getAdminClient()

  // Validate the user exists
  const { data: user } = await db
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  // Server-side deadline enforcement: look up Episode 3's air date
  const { data: ep3 } = await db
    .from('weeks')
    .select('episode_date')
    .eq('week_number', 3)
    .maybeSingle()

  if (ep3) {
    const now = new Date()
    const deadline = new Date(ep3.episode_date as string)
    if (now >= deadline) {
      return NextResponse.json(
        { error: 'The winner pick deadline has passed — your prediction is locked' },
        { status: 403 }
      )
    }
  }

  // Validate the contestant exists and is not eliminated
  const { data: contestant } = await db
    .from('contestants')
    .select('id, name, is_eliminated')
    .eq('id', contestantId)
    .single()

  if (!contestant) {
    return NextResponse.json({ error: 'Contestant not found' }, { status: 400 })
  }

  if (contestant.is_eliminated) {
    return NextResponse.json(
      { error: `${contestant.name as string} has already been eliminated from the game` },
      { status: 400 }
    )
  }

  // Upsert: insert or update on user_id conflict
  const { error } = await db.from('winner_picks').upsert(
    {
      user_id: userId,
      contestant_id: contestantId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    return NextResponse.json({ error: 'Failed to save winner pick' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

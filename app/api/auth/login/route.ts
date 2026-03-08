import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { email?: string }
  const email = body.email

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const { data: user } = await getAdminClient()
    .from('users')
    .select('id, name, role, status')
    .eq('email', email.toLowerCase().trim())
    .in('status', ['active', 'eliminated'])
    .single()

  if (!user) {
    return NextResponse.json(
      { error: "We don't recognize that email address. Contact Eddie to get access." },
      { status: 401 }
    )
  }

  return NextResponse.json({
    userId: user.id,
    name: user.name,
    role: user.role,
  })
}

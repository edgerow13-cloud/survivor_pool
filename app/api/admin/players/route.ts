import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string; name?: string; email?: string }
  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { name, email } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Check for existing user with that email
  const { data: existing } = await getAdminClient()
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 })
  }

  const { error } = await getAdminClient().from('users').insert({
    name: name.trim(),
    email: normalizedEmail,
    role: 'player',
    status: 'active',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

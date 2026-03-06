import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('name' in body) ||
    !('email' in body) ||
    !('token' in body)
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { name, email, token } = body as { name: unknown; email: unknown; token: unknown }

  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  if (typeof token !== 'string' || token.trim().length === 0) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase()
  const trimmedName = name.trim()

  // Check invite link is valid and active
  const { data: inviteLink } = await adminClient
    .from('invite_links')
    .select('id')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (!inviteLink) {
    return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 400 })
  }

  // Check if user already exists
  const { data: existingUser } = await adminClient
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .single()

  if (existingUser) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  // Check if pending request already exists
  const { data: existingRequest } = await adminClient
    .from('join_requests')
    .select('id, status')
    .eq('email', normalizedEmail)
    .eq('status', 'pending')
    .single()

  if (existingRequest) {
    return NextResponse.json({ error: 'A request with this email is already pending' }, { status: 409 })
  }

  // Insert join request
  const { error: insertError } = await adminClient
    .from('join_requests')
    .insert({ name: trimmedName, email: normalizedEmail, invite_token: token })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

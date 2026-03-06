import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await requireCommissioner(request)
  if (auth instanceof NextResponse) return auth

  const { join_request_id } = await request.json()
  if (!join_request_id) {
    return NextResponse.json({ error: 'Missing join_request_id' }, { status: 400 })
  }

  const { data: joinRequest, error: jrError } = await getAdminClient()
    .from('join_requests')
    .select('*')
    .eq('id', join_request_id)
    .single()

  if (jrError || !joinRequest) {
    return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
  }
  if (joinRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Join request is not pending' }, { status: 400 })
  }

  const { data: existingUser } = await getAdminClient()
    .from('users')
    .select('id')
    .eq('email', joinRequest.email)
    .single()

  if (existingUser) {
    return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const { data: authData, error: authError } = await getAdminClient().auth.admin.inviteUserByEmail(
    joinRequest.email,
    {
      data: { name: joinRequest.name },
      redirectTo: `${appUrl}/auth/callback?next=/pool`,
    }
  )

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Failed to create auth user' },
      { status: 500 }
    )
  }

  const { error: insertError } = await getAdminClient().from('users').insert({
    id: authData.user.id,
    name: joinRequest.name,
    email: joinRequest.email,
    role: 'player',
    status: 'active',
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const { error: updateError } = await getAdminClient()
    .from('join_requests')
    .update({ status: 'approved' })
    .eq('id', join_request_id)
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

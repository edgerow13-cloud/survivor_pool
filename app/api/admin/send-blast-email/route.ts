import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    userId?: string
    subject?: string
    body?: string
    userIds?: unknown
  }

  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const { subject, body: emailBody, userIds } = body

  if (!subject || typeof subject !== 'string' || subject.trim() === '') {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  }
  if (!emailBody || typeof emailBody !== 'string' || emailBody.trim() === '') {
    return NextResponse.json({ error: 'Body is required' }, { status: 400 })
  }
  if (!Array.isArray(userIds) || userIds.length === 0 || !userIds.every((id) => typeof id === 'string')) {
    return NextResponse.json({ error: 'userIds must be a non-empty array of strings' }, { status: 400 })
  }

  const db = getAdminClient()
  const { data: users, error } = await db
    .from('users')
    .select('email, name')
    .in('id', userIds)
    .neq('status', 'inactive')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const emails = (users ?? []).map((u: { email: string }) => u.email)

  if (emails.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Convert plain text body to HTML paragraphs
  const html = emailBody
    .split('\n\n')
    .map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`)
    .join('')

  const { error: sendError } = await sendEmail(emails, subject.trim(), html)

  if (sendError) {
    const msg = sendError instanceof Error ? sendError.message : (sendError as { message?: string }).message ?? JSON.stringify(sendError)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ sent: emails.length })
}

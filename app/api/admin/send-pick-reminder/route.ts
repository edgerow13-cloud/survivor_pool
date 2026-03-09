import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

function formatDeadline(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: 'America/New_York',
  })
}

function buildReminderHtml(name: string, weekNumber: number, deadline: string): string {
  const deadlineStr = formatDeadline(deadline)
  const poolUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pool.eddiegerow.com'
  return `
<p>Hey ${name},</p>
<p>Don't forget to submit your Survivor 50 pool pick for <strong>Week ${weekNumber}</strong>!</p>
<p><strong>Deadline:</strong> ${deadlineStr}</p>
<p><a href="${poolUrl}/pool">👉 ${poolUrl}/pool</a></p>
<p>Good luck,<br />Eddie</p>
`.trim()
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { userId?: string }

  const auth = await requireCommissioner(body.userId)
  if (auth instanceof NextResponse) return auth

  const db = getAdminClient()

  // Find current open week (earliest not-yet-resolved week)
  const { data: openWeek, error: weekError } = await db
    .from('weeks')
    .select('id, week_number, episode_date')
    .eq('is_results_entered', false)
    .order('week_number', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (weekError) {
    return NextResponse.json({ error: weekError.message }, { status: 500 })
  }
  if (!openWeek) {
    return NextResponse.json({ error: 'No open week to send reminders for' }, { status: 400 })
  }

  // Get all active users
  const { data: activeUsers, error: usersError } = await db
    .from('users')
    .select('id, name, email')
    .eq('status', 'active')

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  if (!activeUsers || activeUsers.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 })
  }

  // Get picks already submitted for this week
  const { data: picks, error: picksError } = await db
    .from('picks')
    .select('user_id')
    .eq('week_id', openWeek.id)
    .not('contestant_id', 'is', null)

  if (picksError) {
    return NextResponse.json({ error: picksError.message }, { status: 500 })
  }

  const pickedUserIds = new Set((picks ?? []).map((p: { user_id: string }) => p.user_id))

  const unpickedUsers = activeUsers.filter(
    (u: { id: string }) => !pickedUserIds.has(u.id)
  )

  let sent = 0
  for (const user of unpickedUsers) {
    const html = buildReminderHtml(user.name, openWeek.week_number, openWeek.episode_date)
    const subject = `⏰ Week ${openWeek.week_number} pick reminder — don't forget to pick!`
    await sendEmail([user.email], subject, html)
    sent++
  }

  return NextResponse.json({ sent, skipped: activeUsers.length - sent })
}

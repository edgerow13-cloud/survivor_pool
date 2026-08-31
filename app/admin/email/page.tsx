import { getAdminClient } from '@/lib/supabase/admin'
import { getActiveSeasonId } from '@/lib/get-active-season'
import { POOL_START_WEEK } from '@/lib/pool-config'
import { BlastEmailForm } from './BlastEmailForm'
import { PickReminderCard } from './PickReminderCard'

export const dynamic = 'force-dynamic'

export default async function EmailPage() {
  const db = getAdminClient()
  const seasonId = await getActiveSeasonId(db)

  const [{ data: users }, { data: openWeek }] = await Promise.all([
    db.from('users').select('id, name, email, status').in('status', ['active', 'eliminated']).order('name', { ascending: true }),
    // Mirrors app/api/admin/send-pick-reminder's "open week" lookup so this
    // card always names the same week the reminder button actually targets.
    db
      .from('weeks')
      .select('id, week_number')
      .eq('season_id', seasonId)
      .eq('is_results_entered', false)
      .gte('week_number', POOL_START_WEEK)
      .order('week_number', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const allUsers = users ?? []
  const activeCount = allUsers.filter((u) => u.status === 'active').length

  let unpickedCount = 0
  let weekNumber: number | null = null
  const hasOpenWeek = !!openWeek

  if (openWeek) {
    weekNumber = openWeek.week_number

    // Re-fetch picks for just this week
    const { data: weekPicks } = await db
      .from('picks')
      .select('user_id')
      .eq('week_id', openWeek.id)
      .not('contestant_id', 'is', null)

    const pickedIds = new Set((weekPicks ?? []).map((p) => p.user_id))
    unpickedCount = allUsers.filter((u) => u.status === 'active' && !pickedIds.has(u.id)).length
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send messages to pool participants directly from the dashboard.
        </p>
      </div>

      <PickReminderCard
        unpickedCount={unpickedCount}
        activeCount={activeCount}
        weekNumber={weekNumber}
        hasOpenWeek={hasOpenWeek}
      />

      <BlastEmailForm users={allUsers} activeCount={activeCount} />
    </div>
  )
}

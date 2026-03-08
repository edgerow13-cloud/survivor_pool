import { getAdminClient } from '@/lib/supabase/admin'
import WeekForm from './WeekForm'
import CurrentWeekCard from './CurrentWeekCard'
import WeeksTable from './WeeksTable'
import type { Week, Contestant } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function WeeksPage() {
  const [{ data: weeksRaw }, { data: contestantsRaw }, { count: activePlayerCount }] =
    await Promise.all([
      getAdminClient().from('weeks').select('*').order('week_number', { ascending: true }),
      getAdminClient().from('contestants').select('*').order('name'),
      getAdminClient()
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
    ])

  const weeks = (weeksRaw ?? []) as Week[]
  const contestants = (contestantsRaw ?? []) as Contestant[]

  // Current week = first unresolved week by week_number
  const currentWeek = weeks.find((w) => !w.is_results_entered) ?? null

  const nextWeekNumber =
    weeks.length > 0 ? Math.max(...weeks.map((w) => w.week_number)) + 1 : 1

  const totalActivePlayers = activePlayerCount ?? 0

  // Fetch pick count for the current week
  let picksSubmitted = 0
  if (currentWeek) {
    const { count } = await getAdminClient()
      .from('picks')
      .select('*', { count: 'exact', head: true })
      .eq('week_id', currentWeek.id)
      .not('contestant_id', 'is', null)
    picksSubmitted = count ?? 0
  }

  // For the CurrentWeekCard elimination select: non-eliminated + the current eliminated one
  const currentWeekContestants = contestants.filter(
    (c) => !c.is_eliminated || c.id === currentWeek?.eliminated_contestant_id,
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Weeks &amp; Results</h1>

      <WeekForm nextWeekNumber={nextWeekNumber} />

      {currentWeek && (
        <CurrentWeekCard
          week={currentWeek}
          contestants={currentWeekContestants}
          picksSubmitted={picksSubmitted}
          totalActivePlayers={totalActivePlayers}
        />
      )}

      <WeeksTable
        weeks={weeks}
        contestants={contestants}
        currentWeekId={currentWeek?.id ?? null}
        currentWeekPicksSubmitted={picksSubmitted}
        totalActivePlayers={totalActivePlayers}
      />
    </div>
  )
}

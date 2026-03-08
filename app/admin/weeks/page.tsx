import { getAdminClient } from '@/lib/supabase/admin'
import WeekForm from './WeekForm'
import CurrentWeekCard from './CurrentWeekCard'
import WeeksTable from './WeeksTable'
import type { Week, Contestant, WeekElimination, User } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function WeeksPage() {
  const [
    { data: weeksRaw },
    { data: contestantsRaw },
    { count: activePlayerCount },
    { data: weekEliminationsRaw },
    { data: allUsersRaw },
  ] = await Promise.all([
    getAdminClient().from('weeks').select('*').order('week_number', { ascending: true }),
    getAdminClient().from('contestants').select('*').order('name'),
    getAdminClient()
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    getAdminClient().from('week_eliminations').select('*'),
    getAdminClient().from('users').select('*').order('name'),
  ])

  const weeks = (weeksRaw ?? []) as Week[]
  const contestants = (contestantsRaw ?? []) as Contestant[]
  const weekEliminations = (weekEliminationsRaw ?? []) as WeekElimination[]
  const allUsers = (allUsersRaw ?? []) as User[]

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

  // Current week's eliminations (for filtering contestants)
  const currentWeekElimIds = new Set(
    weekEliminations
      .filter((e) => e.week_id === currentWeek?.id)
      .map((e) => e.contestant_id)
  )

  // For the CurrentWeekCard elimination select: non-eliminated + already eliminated for this week
  const currentWeekContestants = contestants.filter(
    (c) => !c.is_eliminated || currentWeekElimIds.has(c.id),
  )

  const currentWeekEliminations = weekEliminations.filter((e) => e.week_id === currentWeek?.id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Weeks &amp; Results</h1>

      <WeekForm nextWeekNumber={nextWeekNumber} />

      {currentWeek && (
        <CurrentWeekCard
          key={currentWeek.id}
          week={currentWeek}
          contestants={currentWeekContestants}
          weekEliminations={currentWeekEliminations}
          picksSubmitted={picksSubmitted}
          totalActivePlayers={totalActivePlayers}
        />
      )}

      <WeeksTable
        weeks={weeks}
        contestants={contestants}
        weekEliminations={weekEliminations}
        allUsers={allUsers}
        currentWeekId={currentWeek?.id ?? null}
        currentWeekPicksSubmitted={picksSubmitted}
        totalActivePlayers={totalActivePlayers}
      />
    </div>
  )
}

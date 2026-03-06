import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Contestant, Tribe, ContestantTribeHistory, Week, Pick, User } from '@/types/database'

function formatShortDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TribeDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0 mr-1"
      style={{ backgroundColor: color }}
    />
  )
}

function getTribeAtWeek(
  contestantId: string,
  weekNumber: number,
  historyByContestant: Record<string, ContestantTribeHistory[]>,
  tribeMap: Record<string, Tribe>
): Tribe | null {
  const history = historyByContestant[contestantId] ?? []
  let result: ContestantTribeHistory | null = null
  for (const h of history) {
    if (h.week_number <= weekNumber) result = h
  }
  return result ? (tribeMap[result.tribe_id] ?? null) : null
}

export default async function PicksHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: meData } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!meData) redirect('/login')
  const me = meData as User

  if (me.status === 'pending_approval') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8 text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Request Pending</h1>
          <p className="text-gray-500 text-sm">
            Your request to join the pool is awaiting commissioner approval. You&apos;ll receive an email once approved.
          </p>
        </div>
      </div>
    )
  }

  const [
    { data: weeksData },
    { data: allUsersData },
    { data: allPicksData },
    { data: contestantsData },
    { data: tribeHistoryData },
    { data: tribesData },
  ] = await Promise.all([
    supabase.from('weeks').select('*').order('week_number', { ascending: true }),
    supabase.from('users').select('*').order('name'),
    supabase.from('picks').select('*'),
    supabase.from('contestants').select('*'),
    supabase.from('contestant_tribe_history').select('*'),
    supabase.from('tribes').select('*'),
  ])

  const weeks = (weeksData ?? []) as Week[]
  const allUsers = (allUsersData ?? []) as User[]
  const allPicks = (allPicksData ?? []) as Pick[]
  const contestants = (contestantsData ?? []) as Contestant[]
  const tribeHistory = (tribeHistoryData ?? []) as ContestantTribeHistory[]
  const tribes = (tribesData ?? []) as Tribe[]

  // Build lookup maps
  const tribeMap: Record<string, Tribe> = Object.fromEntries(tribes.map((t) => [t.id, t]))
  const contestantMap: Record<string, Contestant> = Object.fromEntries(contestants.map((c) => [c.id, c]))
  const weekMap: Record<string, Week> = Object.fromEntries(weeks.map((w) => [w.id, w]))

  // picks indexed by [user_id][week_id]
  const pickMap: Record<string, Record<string, Pick>> = {}
  for (const pick of allPicks) {
    if (!pickMap[pick.user_id]) pickMap[pick.user_id] = {}
    pickMap[pick.user_id][pick.week_id] = pick
  }

  // tribe history grouped by contestant, sorted ASC so last match <= weekNumber wins
  const historyByContestant: Record<string, ContestantTribeHistory[]> = {}
  for (const h of tribeHistory) {
    if (!historyByContestant[h.contestant_id]) historyByContestant[h.contestant_id] = []
    historyByContestant[h.contestant_id].push(h)
  }
  for (const arr of Object.values(historyByContestant)) {
    arr.sort((a, b) => a.week_number - b.week_number)
  }

  // Sort users: active first (alpha), then eliminated (by eliminated_week asc, then name)
  const sortedUsers = [...allUsers]
    .filter((u) => u.status !== 'pending_approval')
    .sort((a, b) => {
      if (a.status === 'eliminated' && b.status !== 'eliminated') return 1
      if (a.status !== 'eliminated' && b.status === 'eliminated') return -1
      if (a.status === 'eliminated' && b.status === 'eliminated') {
        const weekDiff = (a.eliminated_week ?? 99) - (b.eliminated_week ?? 99)
        return weekDiff !== 0 ? weekDiff : a.name.localeCompare(b.name)
      }
      return a.name.localeCompare(b.name)
    })

  // Check if any currently-open week exists (to show note)
  const hasUnresolvedWeek = weeks.some((w) => !w.is_results_entered)

  // suppress unused variable warning — weekMap used below in header
  void weekMap

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-full mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-500">Pick History</h1>
          <Link href="/pool" className="text-sm text-orange-500 hover:underline">
            ← Back to pool
          </Link>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300" />
            Safe
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300" />
            Eliminated
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-300" />
            No pick
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-medium text-gray-400">—</span>
            Not revealed
          </span>
        </div>

        {/* Grid */}
        {weeks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No weeks scheduled yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="border-collapse text-sm min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="sticky left-0 z-20 bg-white text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-3 min-w-[150px] border-r border-gray-100">
                    Player
                  </th>
                  {weeks.map((week) => {
                    const elimContestant = week.eliminated_contestant_id
                      ? contestantMap[week.eliminated_contestant_id]
                      : null
                    return (
                      <th
                        key={week.id}
                        className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-2 min-w-[110px]"
                      >
                        <div className="font-bold text-gray-700">Wk {week.week_number}</div>
                        <div className="font-normal normal-case text-gray-400 mt-0.5">
                          {formatShortDate(week.episode_date)}
                        </div>
                        {week.is_results_entered && (
                          <div className="font-normal normal-case text-red-400 mt-0.5 leading-tight">
                            {elimContestant ? elimContestant.name : 'No elim.'}
                          </div>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={weeks.length + 1} className="py-8 text-center text-gray-400 text-sm">
                      No players yet.
                    </td>
                  </tr>
                ) : sortedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="sticky left-0 z-10 bg-white py-2 px-3 border-r border-gray-100">
                      <span
                        className={
                          u.status === 'eliminated'
                            ? 'line-through text-gray-400'
                            : 'text-gray-800 font-medium'
                        }
                      >
                        {u.name}
                      </span>
                    </td>
                    {weeks.map((week) => {
                      const pick = pickMap[u.id]?.[week.id]
                      const isOwnRow = u.id === me.id

                      if (!pick) {
                        // Not returned by RLS — week not yet revealed for this user
                        return (
                          <td key={week.id} className="py-2 px-2 text-center text-gray-300">
                            —
                          </td>
                        )
                      }

                      const outcome = pick.outcome as Pick['outcome'] | null
                      const contestant = pick.contestant_id
                        ? contestantMap[pick.contestant_id]
                        : null
                      const tribe = contestant
                        ? getTribeAtWeek(contestant.id, week.week_number, historyByContestant, tribeMap)
                        : null

                      if (outcome === null) {
                        // Own pick, week not yet resolved
                        return (
                          <td key={week.id} className="py-2 px-2">
                            <div className="flex items-center gap-0.5 min-w-0">
                              {tribe && <TribeDot color={tribe.color} />}
                              <span className="text-gray-700 text-xs leading-tight truncate" title={contestant?.name ?? '?'}>
                                {contestant?.name ?? '?'}
                              </span>
                              {isOwnRow && (
                                <span className="text-gray-400 text-xs ml-0.5 shrink-0">✓</span>
                              )}
                            </div>
                          </td>
                        )
                      }

                      // Resolved pick
                      const bgClass =
                        outcome === 'safe'
                          ? 'bg-green-50'
                          : outcome === 'eliminated'
                          ? 'bg-red-50'
                          : 'bg-gray-50'
                      const textClass =
                        outcome === 'safe'
                          ? 'text-green-800'
                          : outcome === 'eliminated'
                          ? 'text-red-800'
                          : 'text-gray-400'

                      return (
                        <td key={week.id} className={`py-2 px-2 ${bgClass}`}>
                          {contestant ? (
                            <div className="flex items-center gap-0.5 min-w-0">
                              {tribe && <TribeDot color={tribe.color} />}
                              <span className={`text-xs leading-tight truncate ${textClass}`} title={contestant.name}>
                                {contestant.name}
                              </span>
                            </div>
                          ) : (
                            <div className="text-center text-gray-300 text-xs">—</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Note for unresolved weeks */}
        {hasUnresolvedWeek && (
          <p className="text-xs text-gray-400 text-center">
            Current week picks are hidden until results are entered.
          </p>
        )}

      </div>
    </div>
  )
}

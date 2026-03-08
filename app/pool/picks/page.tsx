'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import type { Contestant, Tribe, ContestantTribeHistory, Week, Pick, User } from '@/types/database'

interface PicksHistoryData {
  weeks: Week[]
  allUsers: User[]
  allPicks: Pick[]
  contestants: Contestant[]
  tribeHistory: ContestantTribeHistory[]
  tribes: Tribe[]
  currentUserId: string
}

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

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function PicksHistoryPage() {
  const { userId, isLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<PicksHistoryData | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!userId) {
      router.push('/login')
      return
    }
    setFetching(true)
    fetch('/api/pool/picks-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then((res) => res.json() as Promise<PicksHistoryData & { error?: string }>)
      .then((json) => {
        if (json.error) {
          setFetchError(json.error)
        } else {
          setData(json)
        }
      })
      .catch(() => setFetchError('Failed to load pick history.'))
      .finally(() => setFetching(false))
  }, [isLoading, userId, router])

  if (isLoading || fetching) return <Spinner />

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8 text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-500 text-sm">{fetchError}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { weeks, allUsers, allPicks, contestants, tribeHistory, tribes, currentUserId } = data

  const tribeMap: Record<string, Tribe> = Object.fromEntries(tribes.map((t) => [t.id, t]))
  const contestantMap: Record<string, Contestant> = Object.fromEntries(contestants.map((c) => [c.id, c]))

  const pickMap: Record<string, Record<string, Pick>> = {}
  for (const pick of allPicks) {
    if (!pickMap[pick.user_id]) pickMap[pick.user_id] = {}
    pickMap[pick.user_id][pick.week_id] = pick
  }

  const historyByContestant: Record<string, ContestantTribeHistory[]> = {}
  for (const h of tribeHistory) {
    if (!historyByContestant[h.contestant_id]) historyByContestant[h.contestant_id] = []
    historyByContestant[h.contestant_id].push(h)
  }
  for (const arr of Object.values(historyByContestant)) {
    arr.sort((a, b) => a.week_number - b.week_number)
  }

  const sortedUsers = [...allUsers]
    .filter((u) => u.status !== 'pending_approval' && u.status !== 'inactive')
    .sort((a, b) => {
      if (a.status === 'eliminated' && b.status !== 'eliminated') return 1
      if (a.status !== 'eliminated' && b.status === 'eliminated') return -1
      if (a.status === 'eliminated' && b.status === 'eliminated') {
        const weekDiff = (a.eliminated_week ?? 99) - (b.eliminated_week ?? 99)
        return weekDiff !== 0 ? weekDiff : a.name.localeCompare(b.name)
      }
      return a.name.localeCompare(b.name)
    })

  const hasUnresolvedWeek = weeks.some((w) => !w.is_results_entered)

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-full mx-auto space-y-4">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-500">Pick History</h1>
          <Link href="/pool" className="text-sm text-orange-500 hover:underline">
            ← Back to pool
          </Link>
        </div>

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
                      const isOwnRow = u.id === currentUserId

                      if (!pick) {
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

        {hasUnresolvedWeek && (
          <p className="text-xs text-gray-400 text-center">
            Current week picks are hidden until results are entered.
          </p>
        )}

      </div>
    </div>
  )
}

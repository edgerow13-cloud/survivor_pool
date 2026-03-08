'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Check, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/Header'
import type { Contestant, Tribe, ContestantTribeHistory, Week, Pick, User } from '@/types/database'

const TOTAL_WEEKS = 13

interface PicksHistoryData {
  weeks: Week[]
  allUsers: User[]
  allPicks: Pick[]
  contestants: Contestant[]
  tribeHistory: ContestantTribeHistory[]
  tribes: Tribe[]
  currentUserId: string
}

function formatMonDay(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** "Jenna Lewis-Dougherty" → "Jenna L." */
function shortName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return name
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

function getTribeAtWeek(
  contestantId: string,
  weekNumber: number,
  historyByContestant: Record<string, ContestantTribeHistory[]>,
  tribeMap: Record<string, Tribe>,
): Tribe | null {
  const history = historyByContestant[contestantId] ?? []
  let result: ContestantTribeHistory | null = null
  for (const h of history) {
    if (h.week_number <= weekNumber) result = h
  }
  return result ? (tribeMap[result.tribe_id] ?? null) : null
}

function TribeDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  )
}

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── Cell renderer ────────────────────────────────────────────────────────────

interface CellProps {
  week: Week
  pick: Pick | undefined
  isOwnRow: boolean
  isCurrentWeek: boolean
  isFutureWeek: boolean
  contestantMap: Record<string, Contestant>
  historyByContestant: Record<string, ContestantTribeHistory[]>
  tribeMap: Record<string, Tribe>
}

function PickCell({
  week,
  pick,
  isOwnRow,
  isCurrentWeek,
  isFutureWeek,
  contestantMap,
  historyByContestant,
  tribeMap,
}: CellProps) {
  const cellBase = 'px-3 py-3 min-w-[140px] border-r border-gray-200'

  // Future week — dashed empty cell
  if (isFutureWeek) {
    return (
      <td className={cellBase}>
        <div className="h-10 border-2 border-dashed border-gray-200 rounded-md" />
      </td>
    )
  }

  // Current week — other players' picks are hidden
  if (isCurrentWeek) {
    if (isOwnRow) {
      if (!pick?.contestant_id) {
        // Own row, no pick yet
        return (
          <td className={`${cellBase} bg-[#F3F4F6]`}>
            <div className="flex items-center justify-center text-gray-400">—</div>
          </td>
        )
      }
      const contestant = contestantMap[pick.contestant_id]
      const tribe = getTribeAtWeek(pick.contestant_id, week.week_number, historyByContestant, tribeMap)
      return (
        <td className={cellBase}>
          <div className="flex flex-col gap-1 p-2 rounded-md border-2 border-[#F97316] bg-orange-50">
            <div className="flex items-center gap-1.5 min-w-0">
              {tribe && <TribeDot color={tribe.color} />}
              <span className="text-sm font-medium text-gray-900 truncate">
                {contestant?.name ?? '?'}
              </span>
            </div>
            <span className="text-xs text-[#F97316] font-medium">Your pick</span>
          </div>
        </td>
      )
    }
    // Other player's current week — always show lock
    return (
      <td className={`${cellBase} bg-[#F3F4F6]`}>
        <div className="flex items-center justify-center text-gray-400 gap-1.5">
          <Lock className="w-4 h-4" />
        </div>
      </td>
    )
  }

  // Past week (results entered)

  // No pick row
  if (!pick || !pick.contestant_id) {
    return (
      <td className={`${cellBase} bg-[#F3F4F6]`}>
        <div className="flex items-center justify-center text-gray-400">—</div>
      </td>
    )
  }

  const contestant = contestantMap[pick.contestant_id]
  const tribe = getTribeAtWeek(pick.contestant_id, week.week_number, historyByContestant, tribeMap)

  if (pick.outcome === 'safe') {
    return (
      <td className={cellBase}>
        <div className="flex items-center gap-1.5 p-2 rounded-md bg-[#DCFCE7] min-w-0">
          {tribe && <TribeDot color={tribe.color} />}
          <span className="text-sm font-medium text-[#16A34A] truncate flex-1">
            {contestant?.name ?? '?'}
          </span>
          <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
        </div>
      </td>
    )
  }

  if (pick.outcome === 'eliminated') {
    return (
      <td className={cellBase}>
        <div className="flex items-center gap-1.5 p-2 rounded-md bg-[#FEE2E2] min-w-0">
          {tribe && <TribeDot color={tribe.color} />}
          <span className="text-sm font-medium text-[#DC2626] truncate flex-1">
            {contestant?.name ?? '?'}
          </span>
          <X className="w-4 h-4 text-[#DC2626] shrink-0" />
        </div>
      </td>
    )
  }

  // no_pick outcome or null outcome on a resolved week
  return (
    <td className={`${cellBase} bg-[#F3F4F6]`}>
      <div className="flex items-center justify-center text-gray-400">—</div>
    </td>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const contestantMap: Record<string, Contestant> = Object.fromEntries(
    contestants.map((c) => [c.id, c]),
  )

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

  // The "current" week is the first unresolved week (weeks are sorted ascending)
  const currentWeekEntry = weeks.find((w) => !w.is_results_entered)
  const currentWeekNumber = currentWeekEntry?.week_number ?? null
  // Displayed current week number for the subtitle (latest week with any data)
  const latestWeekNumber = weeks.length > 0 ? weeks[weeks.length - 1].week_number : 0

  const frozenHeaderClass =
    'sticky left-0 z-20 bg-gray-50 shadow-[2px_0_4px_rgba(0,0,0,0.08)]'
  const frozenCellClass = (isElim: boolean) =>
    `sticky left-0 z-10 ${isElim ? 'bg-gray-100' : 'bg-white'} shadow-[2px_0_4px_rgba(0,0,0,0.08)]`

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <Header navLink={{ href: '/pool', label: 'Player Selection', shortLabel: 'Pick' }} />

      <main className="flex-1">
        <div className="max-w-full mx-auto px-4 py-6">
          {/* Page title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Pick History</h1>
            <p className="text-gray-500 mt-1">
              Week {latestWeekNumber} of ~{TOTAL_WEEKS}
            </p>
          </div>

          {weeks.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              No weeks scheduled yet.
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {/* Frozen player column header */}
                        <th
                          className={`${frozenHeaderClass} px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 min-w-[150px]`}
                        >
                          Player
                        </th>
                        {weeks.map((week) => {
                          const isCurrent = week.id === currentWeekEntry?.id
                          const isFuture =
                            currentWeekNumber !== null &&
                            week.week_number > currentWeekNumber
                          const elimContestant = week.eliminated_contestant_id
                            ? contestantMap[week.eliminated_contestant_id]
                            : null

                          return (
                            <th
                              key={week.id}
                              className={`px-3 py-3 text-center text-sm font-semibold min-w-[140px] border-r border-gray-200 ${
                                isCurrent
                                  ? 'bg-[#F97316] text-white'
                                  : isFuture
                                    ? 'text-gray-400 bg-gray-50'
                                    : 'text-gray-900 bg-gray-50'
                              }`}
                            >
                              <div>Wk {week.week_number}</div>
                              <div className={`text-xs font-normal mt-0.5 ${isCurrent ? 'text-orange-100' : 'text-gray-400'}`}>
                                {formatMonDay(week.episode_date)}
                              </div>
                              {elimContestant && (
                                <div
                                  className={`text-xs font-normal mt-0.5 ${isCurrent ? 'text-orange-100' : 'text-gray-500'}`}
                                >
                                  {shortName(elimContestant.name)}
                                </div>
                              )}
                              {isCurrent && !elimContestant && (
                                <div className="text-xs font-normal mt-0.5 text-orange-100">
                                  In progress
                                </div>
                              )}
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={weeks.length + 1}
                            className="py-8 text-center text-gray-400 text-sm"
                          >
                            No players yet.
                          </td>
                        </tr>
                      ) : (
                        sortedUsers.map((u) => {
                          const isElim = u.status === 'eliminated'
                          return (
                            <tr
                              key={u.id}
                              className={`border-b border-gray-200 last:border-b-0 ${isElim ? 'bg-gray-50' : ''}`}
                            >
                              {/* Frozen player name cell */}
                              <td
                                className={`${frozenCellClass(isElim)} px-4 py-3 border-r border-gray-200 min-w-[150px]`}
                              >
                                <div className="flex flex-col">
                                  <span
                                    className={`font-medium ${isElim ? 'line-through text-gray-400' : 'text-gray-900'}`}
                                  >
                                    {u.name}
                                  </span>
                                  {isElim && u.eliminated_week && (
                                    <span className="text-xs text-[#DC2626] mt-0.5">
                                      Out Wk {u.eliminated_week}
                                    </span>
                                  )}
                                </div>
                              </td>
                              {/* Pick cells */}
                              {weeks.map((week) => {
                                const isCurrent = week.id === currentWeekEntry?.id
                                const isFuture =
                                  currentWeekNumber !== null &&
                                  week.week_number > currentWeekNumber
                                const pick = pickMap[u.id]?.[week.id]
                                return (
                                  <PickCell
                                    key={week.id}
                                    week={week}
                                    pick={pick}
                                    isOwnRow={u.id === currentUserId}
                                    isCurrentWeek={isCurrent}
                                    isFutureWeek={isFuture}
                                    contestantMap={contestantMap}
                                    historyByContestant={historyByContestant}
                                    tribeMap={tribeMap}
                                  />
                                )
                              })}
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#DCFCE7] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#16A34A]" />
                    </div>
                    <span className="text-gray-600">Safe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#FEE2E2] flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-[#DC2626]" />
                    </div>
                    <span className="text-gray-600">Eliminated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#F3F4F6] flex items-center justify-center shrink-0">
                      <span className="text-gray-400 text-xs font-bold">—</span>
                    </div>
                    <span className="text-gray-600">No pick</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#F3F4F6] flex items-center justify-center shrink-0">
                      <Lock className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-gray-600">Pending reveal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border-2 border-[#F97316] bg-orange-50 shrink-0" />
                    <span className="text-gray-600">Your pick</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/Header'
import { CountdownTimer } from '@/components/survivor/CountdownTimer'
import PickForm from './PickForm'
import type { Contestant, Tribe, ContestantTribeHistory, Week, Pick, User } from '@/types/database'

interface PoolData {
  me: User
  contestants: Contestant[]
  tribes: Tribe[]
  tribeHistory: ContestantTribeHistory[]
  weeks: Week[]
  userPick: Pick | null
  usedContestantIds: string[]
  weekAllPicks: Pick[]
  allUsers: User[]
}

function formatDeadline(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function OutcomeBadge({ outcome }: { outcome: Pick['outcome'] | null }) {
  if (!outcome) return <span className="text-xs text-gray-400">—</span>
  if (outcome === 'safe')
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Safe
      </span>
    )
  if (outcome === 'eliminated')
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Eliminated
      </span>
    )
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      No Pick
    </span>
  )
}

function TribeDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
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

export default function PoolPage() {
  const { userId, isLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<PoolData | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!userId) {
      router.push('/login')
      return
    }
    setFetching(true)
    fetch('/api/pool/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then((res) => res.json() as Promise<PoolData & { error?: string }>)
      .then((json) => {
        if (json.error) {
          setFetchError(json.error)
        } else {
          setData(json)
        }
      })
      .catch(() => setFetchError('Failed to load pool data.'))
      .finally(() => setFetching(false))
  }, [isLoading, userId, router])

  function refreshData() {
    if (!userId) return
    fetch('/api/pool/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then((res) => res.json() as Promise<PoolData>)
      .then((json) => setData(json))
      .catch(() => {})
  }

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

  const { me, contestants, tribes, tribeHistory, weeks, userPick, usedContestantIds, weekAllPicks, allUsers } = data

  // First unresolved week
  const currentWeek = weeks.find((w: Week) => !w.is_results_entered) ?? null

  // Build tribe lookup
  const tribeMap = Object.fromEntries(tribes.map((t: Tribe) => [t.id, t]))
  const weekNum = currentWeek?.week_number ?? 1

  const latestTribeHistoryByContestant: Record<string, ContestantTribeHistory> = {}
  for (const h of tribeHistory) {
    if (h.week_number <= weekNum) {
      const current = latestTribeHistoryByContestant[h.contestant_id]
      if (!current || h.week_number > current.week_number) {
        latestTribeHistoryByContestant[h.contestant_id] = h
      }
    }
  }

  function getTribe(contestantId: string): Tribe | null {
    const h = latestTribeHistoryByContestant[contestantId]
    if (!h) return null
    return tribeMap[h.tribe_id] ?? null
  }

  const contestantMap = Object.fromEntries(contestants.map((c: Contestant) => [c.id, c]))

  const formContestants = contestants.map((c: Contestant) => ({
    id: c.id,
    name: c.name,
    is_eliminated: c.is_eliminated,
    eliminated_week: c.eliminated_week,
    tribe: getTribe(c.id),
  }))

  const eliminatedContestant = currentWeek?.eliminated_contestant_id
    ? contestantMap[currentWeek.eliminated_contestant_id] ?? null
    : null

  const sortedUsers = [...allUsers].sort((a: User, b: User) => {
    if (a.status === 'eliminated' && b.status !== 'eliminated') return 1
    if (a.status !== 'eliminated' && b.status === 'eliminated') return -1
    return a.name.localeCompare(b.name)
  })

  const pickByUserId = Object.fromEntries(weekAllPicks.map((p: Pick) => [p.user_id, p]))
  const isEliminated = me.status === 'eliminated'

  if (!currentWeek) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 max-w-md w-full">
            No week scheduled yet. Check back soon.
          </div>
        </div>
      </div>
    )
  }

  const deadline = new Date(currentWeek.episode_date)
  const isDeadlinePassed = Date.now() >= deadline.getTime()

  // ── Results entered ──────────────────────────────────────────────────────────
  if (currentWeek.is_results_entered) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Week {currentWeek.week_number} — Results
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {eliminatedContestant ? (
                  <>
                    <span className="font-medium text-red-600">{eliminatedContestant.name}</span>{' '}
                    was eliminated
                  </>
                ) : (
                  'No elimination this week'
                )}
              </p>
            </div>

            {userPick ? (
              <div
                className={`rounded-lg p-4 ${
                  userPick.outcome === 'safe'
                    ? 'bg-green-50 border border-green-200'
                    : userPick.outcome === 'eliminated'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {userPick.contestant_id && getTribe(userPick.contestant_id) && (
                    <TribeDot color={getTribe(userPick.contestant_id)!.color} />
                  )}
                  <span className="font-medium text-gray-800">
                    {userPick.contestant_id
                      ? (contestantMap[userPick.contestant_id]?.name ?? '—')
                      : 'No pick'}
                  </span>
                  <span className="ml-auto">
                    <OutcomeBadge outcome={userPick.outcome ?? null} />
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
                <span className="text-gray-500 text-sm">No pick submitted</span>
                <span className="ml-2">
                  <OutcomeBadge outcome="no_pick" />
                </span>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">All Picks</h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {sortedUsers
                  .filter(
                    (u: User) => u.status !== 'pending_approval' && u.status !== 'inactive',
                  )
                  .map((u: User) => {
                    const pick = pickByUserId[u.id]
                    const pickContestant = pick?.contestant_id
                      ? contestantMap[pick.contestant_id]
                      : null
                    const tribe = pick?.contestant_id ? getTribe(pick.contestant_id) : null
                    return (
                      <div key={u.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                        <span
                          className={`flex-1 font-medium ${u.status === 'eliminated' ? 'line-through text-gray-400' : 'text-gray-800'}`}
                        >
                          {u.name}
                        </span>
                        <div className="flex items-center gap-1.5 flex-1">
                          {tribe && <TribeDot color={tribe.color} />}
                          <span className="text-gray-600">{pickContestant?.name ?? '—'}</span>
                        </div>
                        <OutcomeBadge outcome={pick?.outcome ?? null} />
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Locked (deadline passed, awaiting results) ────────────────────────────────
  if (currentWeek.is_locked || isDeadlinePassed) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Week {currentWeek.week_number} — Picks are locked
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Results will be revealed after the episode airs.
              </p>
            </div>
            {userPick?.contestant_id ? (
              <div className="rounded-lg p-4 bg-gray-50 border border-gray-200 flex items-center gap-2">
                {getTribe(userPick.contestant_id) && (
                  <TribeDot color={getTribe(userPick.contestant_id)!.color} />
                )}
                <span className="font-medium text-gray-800">
                  You picked {contestantMap[userPick.contestant_id]?.name ?? '—'}
                </span>
              </div>
            ) : (
              <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
                <span className="text-gray-500 text-sm">No pick submitted</span>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  // ── Active pick window ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <Header />

      <main className="flex-1 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Title & countdown */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Week {currentWeek.week_number} — Pick Your Survivor
            </h1>
            <p className="text-gray-600 mb-4">Locks {formatDeadline(currentWeek.episode_date)}</p>
            <CountdownTimer targetDate={deadline} />
          </div>

          {isEliminated ? (
            <div className="rounded-lg p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center max-w-md mx-auto">
              You&apos;ve been eliminated from the pool. Better luck next season!
            </div>
          ) : (
            <PickForm
              weekId={currentWeek.id}
              weekNumber={currentWeek.week_number}
              userId={userId!}
              currentContestantId={userPick?.contestant_id ?? null}
              contestants={formContestants}
              usedContestantIds={usedContestantIds}
              onPickSaved={refreshData}
            />
          )}
        </div>
      </main>
    </div>
  )
}

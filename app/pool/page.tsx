'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useActiveSeason } from '@/hooks/use-active-season'
import { Header } from '@/components/Header'
import { CountdownTimer } from '@/components/survivor/CountdownTimer'
import PickForm from './PickForm'
import type { Contestant, Tribe, ContestantTribeHistory, Week, Pick, User, WeekElimination, WinnerPick } from '@/types/database'

interface PoolData {
  me: User
  contestants: Contestant[]
  tribes: Tribe[]
  tribeHistory: ContestantTribeHistory[]
  weeks: Week[]
  userPick: Pick | null
  usedContestantIds: string[]
  usedPicks: Array<{ contestant_id: string; week_id: string }>
  weekAllPicks: Pick[]
  allUsers: User[]
  weekEliminations: WeekElimination[]
  winnerPick: WinnerPick | null
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
  if (!outcome) return <span className="text-xs text-muted-foreground">—</span>
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
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function PoolPage() {
  const { userId, isLoading } = useAuth()
  const season = useActiveSeason()
  const seasonLabel = season ? `Season ${season.seasonNumber}` : 'the season'
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-sm border border-border w-full max-w-sm p-8 text-center">
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Error</h1>
          <p className="text-muted-foreground text-sm">{fetchError}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { me, contestants, tribes, tribeHistory, weeks, userPick, usedContestantIds, usedPicks, weekAllPicks, allUsers, weekEliminations, winnerPick } = data

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

  // Show winner pick banner if: active player, no winner pick submitted, Ep3 deadline not yet passed
  const ep3Week = weeks.find((w: Week) => w.week_number === 3) ?? null
  const ep3DeadlinePassed = ep3Week ? Date.now() >= new Date(ep3Week.episode_date).getTime() : false
  const showWinnerPickBanner = me.status === 'active' && !winnerPick && !ep3DeadlinePassed

  // Map contestant ID → week number it was previously picked (for "Used Wk N" display)
  const weekIdToNumber = Object.fromEntries(weeks.map((w: Week) => [w.id, w.week_number]))
  const usedContestantWeekMap: Record<string, number> = {}
  for (const p of usedPicks) {
    const weekNumber = weekIdToNumber[p.week_id]
    if (weekNumber !== undefined) usedContestantWeekMap[p.contestant_id] = weekNumber
  }

  const formContestants = contestants.map((c: Contestant) => ({
    id: c.id,
    name: c.name,
    is_eliminated: c.is_eliminated,
    eliminated_week: c.eliminated_week,
    tribe: getTribe(c.id),
    photo_url: c.photo_url,
  }))

  const currentWeekElimIds = weekEliminations
    .filter((e) => e.week_id === currentWeek?.id)
    .map((e) => e.contestant_id)
  const eliminatedContestants: Contestant[] = currentWeekElimIds
    .map((id) => contestantMap[id])
    .filter((c): c is Contestant => c !== undefined)

  const sortedUsers = [...allUsers].sort((a: User, b: User) => {
    if (a.status === 'eliminated' && b.status !== 'eliminated') return 1
    if (a.status !== 'eliminated' && b.status === 'eliminated') return -1
    return a.name.localeCompare(b.name)
  })

  const pickByUserId = Object.fromEntries(weekAllPicks.map((p: Pick) => [p.user_id, p]))
  const isEliminated = me.status === 'eliminated'

  if (!currentWeek) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground max-w-md w-full">
            No week scheduled yet. Check back soon.
          </div>
        </div>
      </div>
    )
  }

  const deadline = new Date(currentWeek.episode_date)
  const isDeadlinePassed = Date.now() >= deadline.getTime()

  const winnerPickBanner = showWinnerPickBanner ? (
    <div className="bg-primary/10 border border-primary/25 rounded-lg px-4 py-3 flex items-start gap-3">
      <span className="text-primary text-lg leading-none mt-0.5">!</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Submit your winner pick before Episode 3</p>
        <p className="text-sm text-foreground/80 mt-0.5">
          Every player must predict who will win {seasonLabel}. This locks at the Episode 3
          deadline and is used as a tiebreaker.{' '}
          <a href="/profile" className="underline font-medium text-primary hover:text-primary/80">
            Go to your profile to submit →
          </a>
        </p>
      </div>
    </div>
  ) : null

  // ── Results entered ──────────────────────────────────────────────────────────
  if (currentWeek.is_results_entered) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            {winnerPickBanner}
            <div>
              <span className="eyebrow">Week {currentWeek.week_number}</span>
              <h1 className="font-display text-2xl font-bold text-foreground mt-1">
                Results
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {eliminatedContestants.length > 0 ? (
                  <>
                    {eliminatedContestants.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && ' and '}
                        <span className="font-medium text-red-600">{c.name}</span>
                      </span>
                    ))}{' '}
                    {eliminatedContestants.length === 1 ? 'was' : 'were'} eliminated
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
                      : 'bg-muted border border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  {userPick.contestant_id && getTribe(userPick.contestant_id) && (
                    <TribeDot color={getTribe(userPick.contestant_id)!.color} />
                  )}
                  <span className="font-medium text-foreground">
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
              <div className="rounded-lg p-4 bg-muted border border-border">
                <span className="text-muted-foreground text-sm">No pick submitted</span>
                <span className="ml-2">
                  <OutcomeBadge outcome="no_pick" />
                </span>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">All Picks</h2>
              <div className="bg-card rounded-xl border border-border divide-y divide-border">
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
                          className={`flex-1 font-medium ${u.status === 'eliminated' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                        >
                          {u.name}
                        </span>
                        <div className="flex items-center gap-1.5 flex-1">
                          {tribe && <TribeDot color={tribe.color} />}
                          <span className="text-muted-foreground">{pickContestant?.name ?? '—'}</span>
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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
            {winnerPickBanner}
            <div>
              <span className="eyebrow">Week {currentWeek.week_number}</span>
              <h1 className="font-display text-2xl font-bold text-foreground mt-1">
                Picks are locked
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Results will be revealed after the episode airs.
              </p>
            </div>
            {userPick?.contestant_id ? (
              <div className="rounded-lg p-4 bg-card border border-border flex items-center gap-2">
                {getTribe(userPick.contestant_id) && (
                  <TribeDot color={getTribe(userPick.contestant_id)!.color} />
                )}
                <span className="font-medium text-foreground">
                  You picked {contestantMap[userPick.contestant_id]?.name ?? '—'}
                </span>
              </div>
            ) : (
              <div className="rounded-lg p-4 bg-card border border-border">
                <span className="text-muted-foreground text-sm">No pick submitted</span>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  // ── Active pick window ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-36 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {winnerPickBanner && <div className="mb-6">{winnerPickBanner}</div>}

          {/* Title & countdown */}
          <div className="flex flex-col items-center gap-5 mb-8">
            <div className="text-center">
              <span className="eyebrow">Week {currentWeek.week_number}</span>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-1">
                Pick Your Survivor
              </h1>
            </div>
            <div className="ink-panel rounded-2xl px-6 py-4 flex flex-col items-center gap-2 w-full max-w-sm">
              <p className="eyebrow text-ink-foreground/60 relative">Locks {formatDeadline(currentWeek.episode_date)}</p>
              <div className="relative">
                <CountdownTimer targetDate={deadline} />
              </div>
            </div>
          </div>

          {isEliminated ? (
            <div className="rounded-lg p-4 bg-destructive/10 border border-destructive/25 text-destructive text-sm font-medium text-center max-w-md mx-auto">
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
              usedContestantWeekMap={usedContestantWeekMap}
              onPickSaved={refreshData}
            />
          )}
        </div>
      </main>
    </div>
  )
}

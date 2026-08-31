'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Check, X, Settings } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useActiveSeason } from '@/hooks/use-active-season'
import { Header } from '@/components/Header'
import { UserAvatar } from '@/components/UserAvatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Contestant, Tribe, ContestantTribeHistory, Week, Pick, User, WeekElimination } from '@/types/database'

const TOTAL_WEEKS = 13

interface WinnerPickRow {
  user_id: string
  contestant_id: string
}

interface PicksHistoryData {
  weeks: Week[]
  allUsers: User[]
  allPicks: Pick[]
  contestants: Contestant[]
  tribeHistory: ContestantTribeHistory[]
  tribes: Tribe[]
  currentUserId: string
  weekEliminations: WeekElimination[]
  winnerPicks: WinnerPickRow[]
  ep3Deadline: string | null
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

interface WinnerPickCellProps {
  contestantId: string | null
  isOwnRow: boolean
  isPickLocked: boolean
  contestantMap: Record<string, Contestant>
  latestTribeByContestant: Record<string, Tribe>
}

function WinnerPickCell({
  contestantId,
  isOwnRow,
  isPickLocked,
  contestantMap,
  latestTribeByContestant,
}: WinnerPickCellProps) {
  const cellBase = 'px-3 py-3 min-w-[150px] border-r border-border'
  const showChangeLink = isOwnRow && !isPickLocked

  // Before Ep3 deadline: hide other players' picks entirely
  if (!isPickLocked && !isOwnRow) {
    return (
      <td className={`${cellBase} bg-muted`}>
        <div className="flex items-center justify-center text-muted-foreground gap-1.5">
          <Lock className="w-4 h-4" />
        </div>
      </td>
    )
  }

  if (!contestantId) {
    return (
      <td className={`${cellBase} bg-muted`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">—</span>
          {showChangeLink && (
            <Link href="/profile" className="text-xs text-primary hover:underline whitespace-nowrap">
              Pick →
            </Link>
          )}
        </div>
      </td>
    )
  }

  const contestant = contestantMap[contestantId]
  const tribe = latestTribeByContestant[contestantId] ?? null
  const isElim = contestant?.is_eliminated ?? false
  const elimWeek = contestant?.eliminated_week ?? null
  const hasBottomRow = (isElim && elimWeek !== null) || showChangeLink

  return (
    <td className={cellBase}>
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {tribe && <TribeDot color={tribe.color} />}
          <span className={`text-sm font-medium truncate ${isElim ? 'text-muted-foreground' : 'text-foreground'}`}>
            {contestant?.name ?? '?'}
          </span>
        </div>
        {hasBottomRow && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#DC2626]">
              {isElim && elimWeek !== null ? `Out Wk ${elimWeek}` : ''}
            </span>
            {showChangeLink && (
              <Link href="/profile" className="text-xs text-primary hover:underline whitespace-nowrap">
                Change →
              </Link>
            )}
          </div>
        )}
      </div>
    </td>
  )
}

function Spinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── Locked cell with hover popover ───────────────────────────────────────────

interface LockedPickCellProps {
  userName: string
  availableContestants: Contestant[]
  currentWeekNumber: number
  historyByContestant: Record<string, ContestantTribeHistory[]>
  tribeMap: Record<string, Tribe>
}

function LockedPickCell({
  userName,
  availableContestants,
  currentWeekNumber,
  historyByContestant,
  tribeMap,
}: LockedPickCellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const cellBase = 'px-3 py-3 min-w-[90px] border-r border-border'

  return (
    <td
      className={`${cellBase} bg-muted`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center justify-center text-muted-foreground gap-1.5 cursor-default">
            <Lock className="w-4 h-4" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 p-3"
          side="top"
          align="center"
          // Prevent the popover from stealing focus / causing flickering on hover
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <p className="text-xs font-semibold text-foreground mb-2">
            {userName}&apos;s available picks
          </p>
          {availableContestants.length === 0 ? (
            <p className="text-xs text-muted-foreground">No contestants available</p>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {availableContestants.map((c) => {
                const tribe = getTribeAtWeek(
                  c.id,
                  currentWeekNumber,
                  historyByContestant,
                  tribeMap,
                )
                return (
                  <li key={c.id} className="flex items-center gap-2 text-xs text-foreground">
                    {tribe && <TribeDot color={tribe.color} />}
                    <span>{c.name}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </td>
  )
}

// ─── Standard pick cell ────────────────────────────────────────────────────────

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
  const cellBase = 'px-3 py-3 min-w-[90px] border-r border-border'

  // Future week — dashed empty cell
  if (isFutureWeek) {
    return (
      <td className={cellBase}>
        <div className="h-10 border-2 border-dashed border-border rounded-md" />
      </td>
    )
  }

  // Current week — own row
  if (isCurrentWeek && isOwnRow) {
    if (!pick?.contestant_id) {
      return (
        <td className={`${cellBase} bg-muted`}>
          <div className="flex items-center justify-center text-muted-foreground">—</div>
        </td>
      )
    }
    const contestant = contestantMap[pick.contestant_id]
    const tribe = getTribeAtWeek(pick.contestant_id, week.week_number, historyByContestant, tribeMap)
    return (
      <td className={cellBase}>
        <div className="flex flex-col gap-1 p-2 rounded-md border-2 border-primary bg-primary/10">
          <div className="flex items-center gap-1.5 min-w-0">
            {tribe && <TribeDot color={tribe.color} />}
            <span className="text-sm font-medium text-foreground truncate">
              {contestant?.name ?? '?'}
            </span>
          </div>
          <span className="text-xs text-primary font-medium">Your pick</span>
        </div>
      </td>
    )
  }

  // Past week (results entered)

  // No pick row
  if (!pick || !pick.contestant_id) {
    return (
      <td className={`${cellBase} bg-muted`}>
        <div className="flex items-center justify-center text-muted-foreground">—</div>
      </td>
    )
  }

  const contestant = contestantMap[pick.contestant_id]
  const tribe = getTribeAtWeek(pick.contestant_id, week.week_number, historyByContestant, tribeMap)
  const isOverride = pick.is_commissioner_override

  if (pick.outcome === 'safe') {
    return (
      <td className={cellBase}>
        <div className="flex items-center gap-1.5 p-2 rounded-md bg-[#DCFCE7] min-w-0">
          {contestant?.photo_url ? (
            <Image
              src={contestant.photo_url}
              alt={contestant.name}
              width={24}
              height={24}
              className="rounded-full object-cover shrink-0"
            />
          ) : tribe ? (
            <TribeDot color={tribe.color} />
          ) : null}
          <span className="text-sm font-medium text-[#16A34A] truncate flex-1">
            {contestant?.name ?? '?'}
          </span>
          {isOverride
            ? <Settings className="w-3.5 h-3.5 text-[#16A34A] opacity-60 shrink-0" />
            : <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
          }
        </div>
      </td>
    )
  }

  if (pick.outcome === 'eliminated') {
    return (
      <td className={cellBase}>
        <div className="flex items-center gap-1.5 p-2 rounded-md bg-[#FEE2E2] min-w-0">
          {contestant?.photo_url ? (
            <Image
              src={contestant.photo_url}
              alt={contestant.name}
              width={24}
              height={24}
              className="rounded-full object-cover shrink-0"
            />
          ) : tribe ? (
            <TribeDot color={tribe.color} />
          ) : null}
          <span className="text-sm font-medium text-[#DC2626] truncate flex-1">
            {contestant?.name ?? '?'}
          </span>
          {isOverride
            ? <Settings className="w-3.5 h-3.5 text-[#DC2626] opacity-60 shrink-0" />
            : <X className="w-4 h-4 text-[#DC2626] shrink-0" />
          }
        </div>
      </td>
    )
  }

  // no_pick outcome
  if (pick.outcome === 'no_pick') {
    return (
      <td className={`${cellBase} bg-muted`}>
        <div className="flex items-center justify-center text-muted-foreground">—</div>
      </td>
    )
  }

  // null outcome + contestant_id set: results not yet entered for this week
  // (edge case: commissioner override on an unresolved week that the filter let through)
  return (
    <td className={cellBase}>
      <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted min-w-0">
        {tribe && <TribeDot color={tribe.color} />}
        <span className="text-sm font-medium text-muted-foreground truncate flex-1">
          {contestant?.name ?? '?'}
        </span>
        {isOverride && <Settings className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </div>
    </td>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PicksHistoryPage() {
  const { userId, isLoading } = useAuth()
  const season = useActiveSeason()
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-sm border border-border w-full max-w-sm p-8 text-center">
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Error</h1>
          <p className="text-muted-foreground text-sm">{fetchError}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { weeks, allUsers, allPicks, contestants, tribeHistory, tribes, currentUserId, weekEliminations, winnerPicks, ep3Deadline } = data

  const tribeMap: Record<string, Tribe> = Object.fromEntries(tribes.map((t) => [t.id, t]))
  const contestantMap: Record<string, Contestant> = Object.fromEntries(
    contestants.map((c) => [c.id, c]),
  )

  // Build weekId → eliminated contestant IDs
  const elimsByWeekId: Record<string, string[]> = {}
  for (const e of weekEliminations) {
    if (!elimsByWeekId[e.week_id]) elimsByWeekId[e.week_id] = []
    elimsByWeekId[e.week_id].push(e.contestant_id)
  }

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

  function isWeekEffectivelyLocked(week: Week): boolean {
    return week.is_locked || new Date() >= new Date(week.episode_date)
  }
  // Displayed current week number for the subtitle (latest week with any data)
  const latestWeekNumber = weeks.length > 0 ? weeks[weeks.length - 1].week_number : 0

  // ── Compute available contestants per user (for locked cell popovers) ──────
  // allPicks contains resolved-week picks for other users (server-filtered), so
  // usedByUserId accurately reflects what each player has already spent.
  const usedByUserId: Record<string, Set<string>> = {}
  for (const pick of allPicks) {
    if (pick.contestant_id) {
      if (!usedByUserId[pick.user_id]) usedByUserId[pick.user_id] = new Set()
      usedByUserId[pick.user_id].add(pick.contestant_id)
    }
  }
  const activeContestants = contestants
    .filter((c) => !c.is_eliminated)
    .sort((a, b) => a.name.localeCompare(b.name))

  const availableByUserId: Record<string, Contestant[]> = {}
  for (const user of sortedUsers) {
    const used = usedByUserId[user.id] ?? new Set<string>()
    availableByUserId[user.id] = activeContestants.filter((c) => !used.has(c.id))
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Winner picks lookup: userId → contestantId
  const winnerPickByUserId: Record<string, string> = {}
  for (const wp of winnerPicks) {
    winnerPickByUserId[wp.user_id] = wp.contestant_id
  }

  // Latest tribe per contestant (for the winner pick column — current tribe, not week-specific)
  const latestTribeByContestant: Record<string, Tribe> = {}
  for (const [contestantId, history] of Object.entries(historyByContestant)) {
    const latest = history[history.length - 1]
    if (latest) {
      const tribe = tribeMap[latest.tribe_id]
      if (tribe) latestTribeByContestant[contestantId] = tribe
    }
  }

  // Episode 3 deadline determines whether winner pick is editable
  const isPickLocked = ep3Deadline !== null && new Date() >= new Date(ep3Deadline)

  const frozenHeaderClass =
    "sticky left-0 z-20 bg-muted relative after:content-[''] after:absolute after:inset-y-0 after:right-0 after:w-5 after:bg-gradient-to-r after:from-muted after:to-[rgba(255,255,255,0)] after:pointer-events-none"
  const frozenCellClass = (isElim: boolean) =>
    `sticky left-0 z-10 relative ${isElim ? 'bg-muted' : 'bg-card'} after:content-[''] after:absolute after:inset-y-0 after:right-0 after:w-5 after:bg-gradient-to-r ${isElim ? 'after:from-muted' : 'after:from-card'} after:to-[rgba(255,255,255,0)] after:pointer-events-none`

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      <Header navLink={{ href: '/pool', label: 'Player Selection', shortLabel: 'Pick' }} />

      <main className="flex-1">
        <div className="max-w-full mx-auto px-4 py-6">
          {/* Page title */}
          <div className="mb-6">
            <span className="eyebrow">
              {season ? `Season ${season.seasonNumber} · Live board` : 'Live board'}
            </span>
            <h1 className="font-display text-2xl font-bold text-foreground mt-1">Pick History</h1>
            <p className="text-muted-foreground mt-1">
              Week {latestWeekNumber} of ~{TOTAL_WEEKS}
            </p>
          </div>

          {weeks.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
              No weeks scheduled yet.
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="bg-card rounded-2xl border border-border shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        {/* Frozen player column header */}
                        <th
                          className={`${frozenHeaderClass} px-4 py-3 text-left text-sm font-semibold text-foreground border-r border-border min-w-[150px]`}
                        >
                          Player
                        </th>
                        {/* Winner pick column header */}
                        <th className="px-3 py-3 text-center text-sm font-semibold min-w-[150px] border-r border-border text-foreground bg-muted">
                          🏆 Winner Pick
                        </th>
                        {weeks.map((week) => {
                          const isCurrent = week.id === currentWeekEntry?.id
                          const isFuture =
                            currentWeekNumber !== null &&
                            week.week_number > currentWeekNumber
                          const elimIds = elimsByWeekId[week.id] ?? []
                          const elimNames = elimIds
                            .map((id) => contestantMap[id]?.name)
                            .filter(Boolean) as string[]

                          return (
                            <th
                              key={week.id}
                              className={`px-3 py-3 text-center text-sm font-semibold min-w-[90px] border-r border-border ${
                                isCurrent
                                  ? 'bg-primary text-primary-foreground'
                                  : isFuture
                                    ? 'text-muted-foreground bg-muted'
                                    : 'text-foreground bg-muted'
                              }`}
                            >
                              <div>Wk {week.week_number}</div>
                              <div className={`text-xs font-normal mt-0.5 ${isCurrent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                {formatMonDay(week.episode_date)}
                              </div>
                              {elimNames.length > 0 && (
                                <div
                                  className={`text-xs font-normal mt-0.5 ${isCurrent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                                >
                                  {elimNames.map((n) => shortName(n)).join(' + ')}
                                </div>
                              )}
                              {isCurrent && elimNames.length === 0 && (
                                <div className="text-xs font-normal mt-0.5 text-primary-foreground/80">
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
                            colSpan={weeks.length + 2}
                            className="py-8 text-center text-muted-foreground text-sm"
                          >
                            No players yet.
                          </td>
                        </tr>
                      ) : (
                        sortedUsers.map((u) => {
                          const isElim = u.status === 'eliminated'
                          const isOwnRow = u.id === currentUserId
                          return (
                            <tr
                              key={u.id}
                              className={`border-b border-border last:border-b-0 ${isElim ? 'bg-muted' : ''}`}
                            >
                              {/* Frozen player name cell */}
                              <td
                                className={`${frozenCellClass(isElim)} px-4 py-3 border-r border-border min-w-[150px]`}
                              >
                                <div className="flex items-center gap-2">
                                  <UserAvatar
                                    name={u.name}
                                    avatarUrl={u.avatar_url ?? null}
                                    size={24}
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span
                                      className={`font-medium truncate ${isElim ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                                    >
                                      {u.name}
                                    </span>
                                    {isElim && u.eliminated_week && (
                                      <span className="text-xs text-[#DC2626] mt-0.5">
                                        Out Wk {u.eliminated_week}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {/* Winner pick cell */}
                              <WinnerPickCell
                                contestantId={winnerPickByUserId[u.id] ?? null}
                                isOwnRow={isOwnRow}
                                isPickLocked={isPickLocked}
                                contestantMap={contestantMap}
                                latestTribeByContestant={latestTribeByContestant}
                              />
                              {/* Pick cells */}
                              {weeks.map((week) => {
                                const isCurrent = week.id === currentWeekEntry?.id
                                const isFuture =
                                  currentWeekNumber !== null &&
                                  week.week_number > currentWeekNumber
                                const pick = pickMap[u.id]?.[week.id]

                                // Locked cell: current week not yet locked, other player → show popover on hover
                                if (isCurrent && !isOwnRow && !isWeekEffectivelyLocked(week)) {
                                  return (
                                    <LockedPickCell
                                      key={week.id}
                                      userName={u.name}
                                      availableContestants={availableByUserId[u.id] ?? []}
                                      currentWeekNumber={currentWeekEntry?.week_number ?? 0}
                                      historyByContestant={historyByContestant}
                                      tribeMap={tribeMap}
                                    />
                                  )
                                }

                                return (
                                  <PickCell
                                    key={week.id}
                                    week={week}
                                    pick={pick}
                                    isOwnRow={isOwnRow}
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
              <div className="mt-4 p-4 bg-card rounded-2xl border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Legend</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#DCFCE7] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#16A34A]" />
                    </div>
                    <span className="text-muted-foreground">Safe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#FEE2E2] flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-[#DC2626]" />
                    </div>
                    <span className="text-muted-foreground">Eliminated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center shrink-0">
                      <span className="text-muted-foreground text-xs font-bold">—</span>
                    </div>
                    <span className="text-muted-foreground">No pick</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center shrink-0">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">Pending reveal (hover to see available picks)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border-2 border-primary bg-primary/10 shrink-0" />
                    <span className="text-muted-foreground">Your pick</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#DCFCE7] flex items-center justify-center shrink-0">
                      <Settings className="w-3 h-3 text-[#16A34A] opacity-60" />
                    </div>
                    <span className="text-muted-foreground">Commissioner override</span>
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

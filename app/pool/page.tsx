import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Contestant, Tribe, ContestantTribeHistory, Week, Pick, User } from '@/types/database'
import PickForm from './PickForm'
import Link from 'next/link'

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function OutcomeBadge({ outcome }: { outcome: Pick['outcome'] | null }) {
  if (!outcome) return <span className="text-xs text-gray-400">—</span>
  if (outcome === 'safe') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Safe</span>
  if (outcome === 'eliminated') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Eliminated</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">No Pick</span>
}

function TribeDot({ color }: { color: string }) {
  return <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0 mr-1.5" style={{ backgroundColor: color }} />
}

export default async function PoolPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!me) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8 text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Account Not Found</h1>
          <p className="text-gray-500 text-sm">
            Your account hasn&apos;t been set up yet. Contact the commissioner.
          </p>
        </div>
      </div>
    )
  }

  // Pending approval screen
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

  // Load all data in parallel
  const [
    { data: contestants },
    { data: tribes },
    { data: tribeHistory },
    { data: weeks },
    { data: allUsers },
  ] = await Promise.all([
    supabase.from('contestants').select('*').order('name'),
    supabase.from('tribes').select('*'),
    supabase.from('contestant_tribe_history').select('*'),
    supabase.from('weeks').select('*').order('week_number', { ascending: false }),
    supabase.from('users').select('*').order('name'),
  ])

  const currentWeek = weeks && weeks.length > 0 ? weeks[0] as Week : null

  // Per-user picks for this week and prior weeks
  const [{ data: userPickData }, { data: usedPicksData }, { data: weekAllPicksData }] = await Promise.all([
    currentWeek
      ? supabase.from('picks').select('*').eq('user_id', me.id).eq('week_id', currentWeek.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    currentWeek
      ? supabase.from('picks').select('contestant_id').eq('user_id', me.id).neq('week_id', currentWeek.id).not('contestant_id', 'is', null)
      : Promise.resolve({ data: [], error: null }),
    currentWeek && currentWeek.is_results_entered
      ? supabase.from('picks').select('*').eq('week_id', currentWeek.id)
      : Promise.resolve({ data: [], error: null }),
  ])

  const userPick = userPickData as Pick | null
  const usedContestantIds = ((usedPicksData ?? []) as Array<{ contestant_id: string | null }>)
    .map((p) => p.contestant_id)
    .filter((id): id is string => id !== null)
  const weekAllPicks = (weekAllPicksData ?? []) as Pick[]

  // Build tribe lookup: for each contestant, find their tribe at or before currentWeek.week_number
  const tribeMap = Object.fromEntries((tribes ?? []).map((t: Tribe) => [t.id, t]))
  const history = (tribeHistory ?? []) as ContestantTribeHistory[]
  const weekNum = currentWeek?.week_number ?? 1

  const latestTribeHistoryByContestant: Record<string, ContestantTribeHistory> = {}
  for (const h of history) {
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

  const allContestants = (contestants ?? []) as Contestant[]
  const allUsersList = (allUsers ?? []) as User[]

  // Build contestant lookup map
  const contestantMap = Object.fromEntries(allContestants.map((c) => [c.id, c]))

  // Form contestant data (non-eliminated for pick form display)
  const formContestants = allContestants.map((c) => ({
    id: c.id,
    name: c.name,
    is_eliminated: c.is_eliminated,
    tribe: getTribe(c.id),
  }))

  // Find the eliminated contestant for this week (if results entered)
  const eliminatedContestant = currentWeek?.eliminated_contestant_id
    ? contestantMap[currentWeek.eliminated_contestant_id] ?? null
    : null

  // Sort users: active first (by name), then eliminated
  const sortedUsers = [...allUsersList].sort((a, b) => {
    if (a.status === 'eliminated' && b.status !== 'eliminated') return 1
    if (a.status !== 'eliminated' && b.status === 'eliminated') return -1
    return a.name.localeCompare(b.name)
  })

  // Build pick map for results table
  const pickByUserId = Object.fromEntries(weekAllPicks.map((p) => [p.user_id, p]))

  const isEliminated = me.status === 'eliminated'

  // ── No week state ──
  if (!currentWeek) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-orange-500 mb-6">Survivor Pool</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No week scheduled yet. Check back soon.
          </div>
        </div>
      </div>
    )
  }

  const now = new Date()
  const deadline = new Date(currentWeek.episode_date)
  const isDeadlinePassed = now >= deadline

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-500">Survivor Pool</h1>
          <span className="text-sm text-gray-500">{me.name}</span>
        </div>

        {/* ── Week header card ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {currentWeek.is_results_entered ? (
            // State: results entered
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Week {currentWeek.week_number} — Results
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {eliminatedContestant
                  ? <>
                      <span className="font-medium text-red-600">{eliminatedContestant.name}</span> was eliminated
                    </>
                  : 'No elimination this week'}
              </p>

              {/* Own pick result */}
              {userPick ? (
                <div className={`rounded-lg p-4 mb-4 ${
                  userPick.outcome === 'safe' ? 'bg-green-50 border border-green-200' :
                  userPick.outcome === 'eliminated' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {userPick.contestant_id && getTribe(userPick.contestant_id) && (
                      <TribeDot color={getTribe(userPick.contestant_id)!.color} />
                    )}
                    <span className="font-medium text-gray-800">
                      {userPick.contestant_id ? contestantMap[userPick.contestant_id]?.name ?? '—' : 'No pick'}
                    </span>
                    <span className="ml-auto"><OutcomeBadge outcome={userPick.outcome ?? null} /></span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg p-4 mb-4 bg-gray-50 border border-gray-200">
                  <span className="text-gray-500 text-sm">No pick submitted</span>
                  <span className="ml-2"><OutcomeBadge outcome="no_pick" /></span>
                </div>
              )}

              {/* All picks table */}
              <h3 className="text-sm font-semibold text-gray-700 mb-2">All Picks</h3>
              <div className="divide-y divide-gray-100">
                {sortedUsers.filter(u => u.status !== 'pending_approval').map((u) => {
                  const pick = pickByUserId[u.id]
                  const pickContestant = pick?.contestant_id ? contestantMap[pick.contestant_id] : null
                  const tribe = pick?.contestant_id ? getTribe(pick.contestant_id) : null
                  return (
                    <div key={u.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className={`flex-1 font-medium ${u.status === 'eliminated' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
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
            </>
          ) : currentWeek.is_locked || isDeadlinePassed ? (
            // State: locked, no results yet
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Week {currentWeek.week_number} — Picks are locked
              </h2>
              <p className="text-sm text-gray-500 mb-4">Results will be revealed after the episode airs.</p>
              {userPick?.contestant_id ? (
                <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2">
                    {getTribe(userPick.contestant_id) && (
                      <TribeDot color={getTribe(userPick.contestant_id)!.color} />
                    )}
                    <span className="font-medium text-gray-800">
                      You picked {contestantMap[userPick.contestant_id]?.name ?? '—'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
                  <span className="text-gray-500 text-sm">No pick submitted</span>
                </div>
              )}
            </>
          ) : (
            // State: open week
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Week {currentWeek.week_number}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Pick deadline: {formatDate(currentWeek.episode_date)}
              </p>

              {isEliminated ? (
                <div className="rounded-lg p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  You&apos;ve been eliminated from the pool. Better luck next season!
                </div>
              ) : userPick?.contestant_id ? (
                <PickForm
                  weekId={currentWeek.id}
                  currentContestantId={userPick.contestant_id}
                  contestants={formContestants}
                  usedContestantIds={usedContestantIds}
                  initiallyShowForm={false}
                />
              ) : (
                <PickForm
                  weekId={currentWeek.id}
                  currentContestantId={null}
                  contestants={formContestants}
                  usedContestantIds={usedContestantIds}
                  initiallyShowForm={true}
                />
              )}
            </>
          )}
        </div>

        <div className="text-center">
          <Link href="/pool/picks" className="text-sm text-orange-500 hover:underline">
            View full history →
          </Link>
        </div>
      </div>
    </div>
  )
}

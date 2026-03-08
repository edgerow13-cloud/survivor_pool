import { getAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { WeekStatusCard, type PlayerPickStatus } from '@/components/admin/WeekStatusCard'
import { QuickActionsCard } from '@/components/admin/QuickActionsCard'
import type { ContestantTribeHistory, Tribe } from '@/types/database'

export const dynamic = 'force-dynamic'

function formatShortDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export default async function AdminOverviewPage() {
  const [
    { count: activeCount },
    { count: eliminatedCount },
    { count: remainingCount },
    { data: weeksData },
  ] = await Promise.all([
    getAdminClient()
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    getAdminClient()
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'eliminated'),
    getAdminClient()
      .from('contestants')
      .select('*', { count: 'exact', head: true })
      .eq('is_eliminated', false),
    getAdminClient()
      .from('weeks')
      .select('*')
      .order('week_number', { ascending: false })
      .limit(1),
  ])

  const currentWeek = weeksData?.[0] ?? null

  // Fetch per-player pick status for the WeekStatusCard
  let playerPicks: PlayerPickStatus[] = []
  let picksSubmittedCount = 0

  if (currentWeek) {
    const [
      { data: activeUsers },
      { data: weekPicks },
      { data: allContestants },
      { data: tribeHistoryRows },
      { data: tribes },
    ] = await Promise.all([
      getAdminClient()
        .from('users')
        .select('id, name')
        .eq('status', 'active')
        .order('name'),
      getAdminClient()
        .from('picks')
        .select('*')
        .eq('week_id', currentWeek.id),
      getAdminClient().from('contestants').select('id, name'),
      getAdminClient().from('contestant_tribe_history').select('*'),
      getAdminClient().from('tribes').select('id, name, color'),
    ])

    const contestantMap = Object.fromEntries(
      (allContestants ?? []).map((c) => [c.id, c]),
    )
    const tribeMap: Record<string, Tribe> = Object.fromEntries(
      (tribes ?? []).map((t) => [t.id, t]),
    )

    const historyByContestant: Record<string, ContestantTribeHistory[]> = {}
    for (const h of tribeHistoryRows ?? []) {
      if (!historyByContestant[h.contestant_id]) historyByContestant[h.contestant_id] = []
      historyByContestant[h.contestant_id].push(h)
    }

    function getTribeAtWeek(contestantId: string, weekNum: number): Tribe | null {
      const history = (historyByContestant[contestantId] ?? []).slice().sort(
        (a, b) => a.week_number - b.week_number,
      )
      let result: ContestantTribeHistory | null = null
      for (const h of history) {
        if (h.week_number <= weekNum) result = h
      }
      return result ? (tribeMap[result.tribe_id] ?? null) : null
    }

    const pickByUserId = Object.fromEntries(
      (weekPicks ?? []).map((p) => [p.user_id, p]),
    )

    picksSubmittedCount = (weekPicks ?? []).filter((p) => p.contestant_id !== null).length

    playerPicks = (activeUsers ?? []).map((u) => {
      const pick = pickByUserId[u.id]
      const contestant = pick?.contestant_id ? contestantMap[pick.contestant_id] : null
      const tribe = contestant
        ? getTribeAtWeek(contestant.id, currentWeek.week_number)
        : null
      return {
        userId: u.id,
        name: u.name,
        contestantName: (contestant as { name: string } | null)?.name ?? null,
        tribeName: tribe?.name ?? null,
      }
    })
  }

  // Stat card data
  const active = activeCount ?? 0
  const eliminated = eliminatedCount ?? 0
  const remaining = remainingCount ?? 0
  const unpicked = active - picksSubmittedCount

  const stats = [
    {
      title: 'Active Players',
      value: String(active),
      subtitle: `${eliminated} eliminated`,
    },
    {
      title: 'Current Week',
      value: currentWeek ? `Week ${currentWeek.week_number}` : '—',
      subtitle: currentWeek ? `Locks ${formatShortDate(currentWeek.episode_date)}` : 'No week set',
    },
    {
      title: 'Contestants Remaining',
      value: String(remaining),
      subtitle: `${24 - remaining} eliminated from show`,
    },
    {
      title: 'Picks Submitted',
      value: `${picksSubmittedCount} / ${active}`,
      subtitle:
        unpicked > 0
          ? `${unpicked} player${unpicked === 1 ? '' : 's'} hasn't picked yet`
          : active > 0
            ? 'Everyone has picked!'
            : 'No active players',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="gap-2 py-4">
            <CardContent className="pb-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Week status */}
        {currentWeek ? (
          <WeekStatusCard week={currentWeek} playerPicks={playerPicks} />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No weeks created yet. Go to{' '}
              <a href="/admin/weeks" className="text-[#F97316] hover:underline">
                Weeks & Results
              </a>{' '}
              to add one.
            </CardContent>
          </Card>
        )}

        {/* Right: Quick actions + activity placeholder */}
        <div className="space-y-6">
          <QuickActionsCard />
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Activity log coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

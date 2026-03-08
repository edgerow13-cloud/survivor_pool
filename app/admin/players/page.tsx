import { getAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import AddPlayerForm from './AddPlayerForm'
import DeactivateButton from './DeactivateButton'
import ReinstateButton from './ReinstateButton'
import WinnerPickCell, { type ContestantOption } from './WinnerPickCell'
import {
  CommissionerOverridesCard,
  type OverridePlayer,
  type OverrideWeek,
  type OverrideContestant,
} from '@/components/admin/CommissionerOverridesCard'
import type { User } from '@/types/database'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: User['status'] }) {
  if (status === 'active') {
    return <Badge className="bg-[#16A34A] text-white hover:bg-[#16A34A]">Active</Badge>
  }
  if (status === 'eliminated') {
    return <Badge className="bg-[#DC2626] text-white hover:bg-[#DC2626]">Eliminated</Badge>
  }
  return <Badge className="bg-gray-400 text-white hover:bg-gray-400">Inactive</Badge>
}

function RoleBadge({ role }: { role: User['role'] }) {
  if (role === 'commissioner') {
    return <Badge className="bg-[#F97316] text-white hover:bg-[#F97316]">Commissioner</Badge>
  }
  return <span className="text-sm text-muted-foreground">Player</span>
}

export default async function PlayersPage() {
  const [
    { data: users },
    { data: weeksData },
    { data: allContestantsData },
    { data: winnerPicksData },
  ] = await Promise.all([
    getAdminClient().from('users').select('*').order('status').order('name'),
    getAdminClient()
      .from('weeks')
      .select('id, week_number')
      .order('week_number', { ascending: true }),
    getAdminClient()
      .from('contestants')
      .select('id, name, is_eliminated, eliminated_week')
      .order('name'),
    getAdminClient().from('winner_picks').select('user_id, contestant_id'),
  ])

  const typedUsers = (users ?? []) as User[]

  // Winner pick lookups
  const winnerPickByUserId: Record<string, string> = {}
  for (const wp of winnerPicksData ?? []) {
    winnerPickByUserId[wp.user_id as string] = wp.contestant_id as string
  }

  type ContestantRow = { id: string; name: string; is_eliminated: boolean; eliminated_week: number | null }
  const contestantRows = (allContestantsData ?? []) as ContestantRow[]
  const contestantById = Object.fromEntries(contestantRows.map((c) => [c.id, c]))

  // Non-eliminated contestants for the edit dropdown
  const nonEliminatedContestants: ContestantOption[] = contestantRows
    .filter((c) => !c.is_eliminated)
    .map((c) => ({ id: c.id, name: c.name }))

  const overridePlayers: OverridePlayer[] = typedUsers
    .filter((u) => u.status !== 'inactive')
    .map((u) => ({ id: u.id, name: u.name }))

  const overrideWeeks: OverrideWeek[] = (weeksData ?? []).map((w) => ({
    id: w.id as string,
    week_number: w.week_number as number,
  }))

  const overrideContestants: OverrideContestant[] = nonEliminatedContestants.map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Players</h1>

      {/* Add Player */}
      <Card>
        <CardHeader>
          <CardTitle>Add Player</CardTitle>
        </CardHeader>
        <CardContent>
          <AddPlayerForm />
        </CardContent>
      </Card>

      {/* Player Table */}
      <Card>
        <CardHeader>
          <CardTitle>Player List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {typedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-6">No players yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Elim. Week</TableHead>
                  <TableHead>Winner Pick</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className={cn(
                      user.status === 'eliminated' && 'bg-red-50 hover:bg-red-100',
                    )}
                  >
                    <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.eliminated_week ? `Week ${user.eliminated_week}` : '—'}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const pickedId = winnerPickByUserId[user.id] ?? null
                        const picked = pickedId ? (contestantById[pickedId] ?? null) : null
                        return (
                          <WinnerPickCell
                            playerId={user.id}
                            contestantId={pickedId}
                            contestantName={picked?.name ?? null}
                            isEliminated={picked?.is_eliminated ?? false}
                            eliminatedWeek={picked?.eliminated_week ?? null}
                            contestants={nonEliminatedContestants}
                          />
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      {user.status === 'active' && user.role !== 'commissioner' && (
                        <DeactivateButton playerId={user.id} />
                      )}
                      {user.status === 'eliminated' && (
                        <ReinstateButton playerId={user.id} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Commissioner Overrides */}
      <CommissionerOverridesCard
        players={overridePlayers}
        weeks={overrideWeeks}
        contestants={overrideContestants}
      />
    </div>
  )
}

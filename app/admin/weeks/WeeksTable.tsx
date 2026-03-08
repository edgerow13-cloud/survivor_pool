'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Week, Contestant, WeekElimination, User } from '@/types/database'

const POOL_START_WEEK = 3

interface Props {
  weeks: Week[]
  contestants: Contestant[]
  weekEliminations: WeekElimination[]
  allUsers: User[]
  currentWeekId: string | null
  currentWeekPicksSubmitted: number
  totalActivePlayers: number
}

function weekStatus(week: Week, currentWeekId: string | null) {
  if (week.is_results_entered) return 'complete'
  if (week.id === currentWeekId) return 'in_progress'
  return 'upcoming'
}

function formatShortDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function WeeksTable({
  weeks,
  contestants,
  weekEliminations,
  allUsers,
  currentWeekId,
  currentWeekPicksSubmitted,
  totalActivePlayers,
}: Props) {
  const { userId } = useAuth()
  const router = useRouter()

  // Edit elimination dialog
  const [editingWeek, setEditingWeek] = useState<Week | null>(null)
  const [editContestants, setEditContestants] = useState<string[]>([''])
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Reset pick dialog
  const [resetWeek, setResetWeek] = useState<Week | null>(null)
  const [resetUserId, setResetUserId] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const contestantMap = Object.fromEntries(contestants.map((c) => [c.id, c.name]))

  // Build weekId → contestant names for the Eliminated column
  const elimNamesByWeek: Record<string, string[]> = {}
  for (const e of weekEliminations) {
    if (!elimNamesByWeek[e.week_id]) elimNamesByWeek[e.week_id] = []
    const name = contestantMap[e.contestant_id]
    if (name) elimNamesByWeek[e.week_id].push(name)
  }

  // Eligible users for reset pick dialog (non-inactive)
  const eligibleUsers = allUsers.filter((u) => u.status !== 'inactive' && u.status !== 'pending_approval')

  // ── Edit elimination dialog helpers ──────────────────────────────────────────

  function openEditDialog(week: Week) {
    const weekElims = weekEliminations
      .filter((e) => e.week_id === week.id)
      .map((e) => e.contestant_id)
    setEditingWeek(week)
    setEditContestants(weekElims.length > 0 ? weekElims : [''])
    setEditError(null)
  }

  function editOtherSelected(index: number): Set<string> {
    return new Set(editContestants.filter((v, i) => i !== index && v !== ''))
  }

  const allEditRowsFilled = editContestants.length > 0 && editContestants.every((v) => v !== '')

  // Contestants available in the edit dialog: all non-eliminated + the ones already eliminated for this week
  const editWeekElimIds = new Set(
    weekEliminations
      .filter((e) => e.week_id === editingWeek?.id)
      .map((e) => e.contestant_id)
  )
  const editableContestants = contestants
    .filter((c) => !c.is_eliminated || editWeekElimIds.has(c.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  async function handleSaveEdit() {
    if (!editingWeek || !userId) return
    setEditLoading(true)
    setEditError(null)
    try {
      const elimIds = editContestants.filter((id) => id !== '')
      const res = await fetch('/api/admin/enter-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          week_id: editingWeek.id,
          eliminated_contestant_ids: elimIds,
        }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setEditError(body.error ?? 'Failed to save.')
      } else {
        setEditingWeek(null)
        router.refresh()
      }
    } catch {
      setEditError('Network error.')
    } finally {
      setEditLoading(false)
    }
  }

  // ── Reset pick dialog helpers ─────────────────────────────────────────────────

  function openResetDialog(week: Week) {
    setResetWeek(week)
    setResetUserId('')
    setResetError(null)
  }

  async function handleResetPick() {
    if (!resetWeek || !resetUserId || !userId) return
    setResetLoading(true)
    setResetError(null)
    try {
      const res = await fetch('/api/admin/reset-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, user_id: resetUserId, week_id: resetWeek.id }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setResetError(body.error ?? 'Failed to reset pick.')
      } else {
        setResetWeek(null)
        router.refresh()
      }
    } catch {
      setResetError('Network error.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Weeks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {weeks.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-6">No weeks created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Week</TableHead>
                  <TableHead>Episode Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Eliminated</TableHead>
                  <TableHead>Picks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeks.map((week) => {
                  const status = weekStatus(week, currentWeekId)
                  const isPrePool = week.week_number < POOL_START_WEEK
                  const elimNames = elimNamesByWeek[week.id] ?? []

                  return (
                    <TableRow
                      key={week.id}
                      className={cn(
                        status === 'in_progress' && 'bg-orange-50 hover:bg-orange-100',
                      )}
                    >
                      <TableCell
                        className={cn(
                          'font-medium',
                          status === 'in_progress' && 'font-bold',
                          status === 'upcoming' && 'text-muted-foreground',
                        )}
                      >
                        Week {week.week_number}
                      </TableCell>
                      <TableCell
                        className={cn(status === 'upcoming' && 'text-muted-foreground')}
                      >
                        {formatShortDate(week.episode_date)}
                      </TableCell>
                      <TableCell>
                        {status === 'complete' && (
                          <Badge className="bg-[#16A34A] text-white hover:bg-[#16A34A]">
                            Complete
                          </Badge>
                        )}
                        {status === 'in_progress' && (
                          <Badge className="bg-[#F97316] text-white hover:bg-[#F97316]">
                            In Progress
                          </Badge>
                        )}
                        {status === 'upcoming' && (
                          <Badge variant="secondary" className="text-muted-foreground">
                            Upcoming
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={cn(status === 'upcoming' && 'text-muted-foreground')}>
                        {status === 'complete'
                          ? elimNames.length > 0
                            ? elimNames.join(', ')
                            : '—'
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {isPrePool ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-muted-foreground inline-flex items-center gap-1 cursor-help text-sm">
                                (pre-pool)
                                <Info className="size-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Pool started Week {POOL_START_WEEK} — no picks collected for this
                              week
                            </TooltipContent>
                          </Tooltip>
                        ) : status === 'in_progress' ? (
                          <span className="text-sm">
                            {currentWeekPicksSubmitted}/{totalActivePlayers}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {week.id === currentWeekId ? (
                            <span className="text-muted-foreground text-sm">(managed above)</span>
                          ) : status === 'complete' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(week)}
                            >
                              Edit
                            </Button>
                          ) : null}
                          {(status === 'in_progress' || status === 'complete') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openResetDialog(week)}
                            >
                              Reset Pick
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit elimination dialog */}
      <Dialog open={editingWeek !== null} onOpenChange={(open) => !open && setEditingWeek(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Week {editingWeek?.week_number} Result</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Change the eliminated contestant(s) for this week. This will re-calculate all pick
              outcomes and player eliminations.
            </p>
            <div className="space-y-2">
              {editContestants.map((selected, index) => {
                const excluded = editOtherSelected(index)
                const available = editableContestants.filter(
                  (c) => !excluded.has(c.id) || c.id === selected,
                )
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={selected}
                      onValueChange={(id) =>
                        setEditContestants((prev) => prev.map((v, i) => (i === index ? id : v)))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="— No elimination —" />
                      </SelectTrigger>
                      <SelectContent>
                        {available.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editContestants.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditContestants((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-muted-foreground hover:text-red-600 shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditContestants((prev) => [...prev, ''])}
              disabled={!allEditRowsFilled}
            >
              <Plus className="size-3.5 mr-1" />
              Add another
            </Button>
            {editError && <p className="text-xs text-red-600">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWeek(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editLoading}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white disabled:opacity-50"
            >
              {editLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset pick dialog */}
      <Dialog open={resetWeek !== null} onOpenChange={(open) => !open && setResetWeek(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Pick — Week {resetWeek?.week_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Clear a player&apos;s pick for this week. If results are already entered, the pick
              will be set to &quot;no pick&quot;. Otherwise the pick row is deleted.
            </p>
            <div className="space-y-1">
              <Label htmlFor="reset-player-select">Player</Label>
              <Select value={resetUserId} onValueChange={setResetUserId}>
                <SelectTrigger id="reset-player-select">
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {resetError && <p className="text-xs text-red-600">{resetError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetWeek(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPick}
              disabled={resetLoading || !resetUserId}
              className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white disabled:opacity-50"
            >
              {resetLoading ? 'Resetting…' : 'Reset Pick'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

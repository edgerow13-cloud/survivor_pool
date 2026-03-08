'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Week, Contestant } from '@/types/database'

const POOL_START_WEEK = 3

interface Props {
  weeks: Week[]
  contestants: Contestant[]
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
  currentWeekId,
  currentWeekPicksSubmitted,
  totalActivePlayers,
}: Props) {
  const { userId } = useAuth()
  const router = useRouter()

  const [editingWeek, setEditingWeek] = useState<Week | null>(null)
  const [editContestant, setEditContestant] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const contestantMap = Object.fromEntries(contestants.map((c) => [c.id, c.name]))

  function openEditDialog(week: Week) {
    setEditingWeek(week)
    setEditContestant(week.eliminated_contestant_id ?? '')
    setEditError(null)
  }

  async function handleSaveEdit() {
    if (!editingWeek || !userId) return
    setEditLoading(true)
    setEditError(null)
    try {
      const res = await fetch('/api/admin/enter-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          week_id: editingWeek.id,
          eliminated_contestant_id: editContestant || null,
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

  // Contestants available for the edit dialog: all non-eliminated + the current eliminated one
  const editableContestants = contestants
    .filter((c) => !c.is_eliminated || c.id === editingWeek?.eliminated_contestant_id)
    .sort((a, b) => a.name.localeCompare(b.name))

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
                  const elimName = week.eliminated_contestant_id
                    ? (contestantMap[week.eliminated_contestant_id] ?? '—')
                    : '—'

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
                        {status === 'complete' ? elimName : '—'}
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
              Change the eliminated contestant for this week. This will re-calculate all pick
              outcomes and player eliminations.
            </p>
            <Select value={editContestant} onValueChange={setEditContestant}>
              <SelectTrigger>
                <SelectValue placeholder="— No elimination —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— No elimination —</SelectItem>
                {editableContestants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
    </>
  )
}

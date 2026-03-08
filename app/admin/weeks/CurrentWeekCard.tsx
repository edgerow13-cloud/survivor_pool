'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Check, ExternalLink, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Week, Contestant, WeekElimination } from '@/types/database'

interface Props {
  week: Week
  /** Non-eliminated contestants + the already-eliminated ones for this week (for re-entering) */
  contestants: Contestant[]
  weekEliminations: WeekElimination[]
  picksSubmitted: number
  totalActivePlayers: number
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export default function CurrentWeekCard({
  week,
  contestants,
  weekEliminations,
  picksSubmitted,
  totalActivePlayers,
}: Props) {
  const { userId } = useAuth()
  const router = useRouter()

  // Derive initial lock state from props; updated optimistically after lock action
  const [weekState, setWeekState] = useState<'unlocked' | 'locked'>(
    week.is_locked ? 'locked' : 'unlocked',
  )

  // Results flow state (only active once locked)
  const [resultsStep, setResultsStep] = useState<null | 1 | 2>(null)
  // Multi-elimination: array of contestant IDs (init from existing eliminations)
  const [selectedContestants, setSelectedContestants] = useState<string[]>(
    weekEliminations.length > 0 ? weekEliminations.map((e) => e.contestant_id) : [''],
  )
  const [eliminationConfirmed, setEliminationConfirmed] = useState(false)
  const [tribeChange, setTribeChange] = useState('no-changes')

  const [lockLoading, setLockLoading] = useState(false)
  const [lockError, setLockError] = useState<string | null>(null)
  const [completeLoading, setCompleteLoading] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  const sortedContestants = [...contestants].sort((a, b) => a.name.localeCompare(b.name))

  const playersWithNoPick = Math.max(0, totalActivePlayers - picksSubmitted)

  function handleAddRow() {
    setSelectedContestants((prev) => [...prev, ''])
  }

  function handleRemoveRow(index: number) {
    setSelectedContestants((prev) => prev.filter((_, i) => i !== index))
  }

  function handleChangeRow(index: number, id: string) {
    setSelectedContestants((prev) => prev.map((v, i) => (i === index ? id : v)))
  }

  // IDs selected in other slots (for excluding from each slot's dropdown)
  function otherSelected(index: number): Set<string> {
    return new Set(selectedContestants.filter((v, i) => i !== index && v !== ''))
  }

  const allRowsFilled = selectedContestants.length > 0 && selectedContestants.every((v) => v !== '')

  // Names for success message
  const selectedNames = selectedContestants
    .map((id) => sortedContestants.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[]

  function confirmationText(): string {
    if (selectedNames.length === 0) return 'No elimination this week'
    if (selectedNames.length === 1) return `${selectedNames[0]} marked as eliminated`
    const last = selectedNames[selectedNames.length - 1]
    const rest = selectedNames.slice(0, -1).join(', ')
    return `${rest} and ${last} marked as eliminated`
  }

  async function handleLockWeek() {
    if (!userId) return
    setLockLoading(true)
    setLockError(null)
    try {
      const res = await fetch('/api/admin/update-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, week_id: week.id, is_locked: true }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setLockError(body.error ?? 'Failed to lock week.')
      } else {
        setWeekState('locked')
        router.refresh()
      }
    } catch {
      setLockError('Network error.')
    } finally {
      setLockLoading(false)
    }
  }

  async function handleCompleteWeek() {
    if (!userId) return
    setCompleteLoading(true)
    setCompleteError(null)
    try {
      const elimIds = selectedContestants.filter((id) => id !== '')
      const res = await fetch('/api/admin/enter-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          week_id: week.id,
          eliminated_contestant_ids: elimIds,
        }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setCompleteError(body.error ?? 'Failed to complete week.')
      } else {
        router.refresh()
      }
    } catch {
      setCompleteError('Network error.')
    } finally {
      setCompleteLoading(false)
    }
  }

  return (
    <Card className="border-l-4 border-l-[#F97316]">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg">
            Week {week.week_number} —{' '}
            {weekState === 'unlocked' ? (
              'Accepting Picks'
            ) : (
              <span className="inline-flex items-center gap-2">
                Locked
                <Badge variant="secondary" className="bg-[#F97316]/10 text-[#F97316] border-0">
                  <Lock className="size-3 mr-1" />
                  Enter Results
                </Badge>
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {formatDate(week.episode_date)} at {formatTime(week.episode_date)}
        </p>

        {/* ── Unlocked state ── */}
        {weekState === 'unlocked' && (
          <>
            <p className="text-sm text-foreground">
              {picksSubmitted} of {totalActivePlayers} active player
              {totalActivePlayers !== 1 ? 's' : ''} have submitted picks
            </p>
            <div className="space-y-2">
              <Button
                onClick={handleLockWeek}
                disabled={lockLoading}
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white disabled:opacity-50"
              >
                {lockLoading ? 'Locking…' : 'Lock Week'}
              </Button>
              {lockError && <p className="text-xs text-red-600">{lockError}</p>}
              <p className="text-xs text-muted-foreground">
                Locking prevents further submissions. You&apos;ll enter results in the next step.
              </p>
            </div>
          </>
        )}

        {/* ── Locked state ── */}
        {weekState === 'locked' && (
          <>
            {playersWithNoPick > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  {playersWithNoPick} player{playersWithNoPick > 1 ? 's have' : ' has'} no pick —
                  they will be eliminated when you confirm results
                </p>
              </div>
            )}

            {resultsStep === null && (
              <Button
                onClick={() => setResultsStep(1)}
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
              >
                Enter Results
              </Button>
            )}

            {resultsStep !== null && (
              <div className="space-y-6 border rounded-lg p-4 bg-muted/30">
                {/* Step 1 — Elimination */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        eliminationConfirmed ? 'bg-[#16A34A] text-white' : 'bg-[#F97316] text-white'
                      }`}
                    >
                      {eliminationConfirmed ? <Check className="size-4" /> : '1'}
                    </div>
                    <Label className="text-sm font-medium">
                      Who was eliminated this episode?
                    </Label>
                  </div>

                  {!eliminationConfirmed ? (
                    <>
                      <div className="space-y-2">
                        {selectedContestants.map((selected, index) => {
                          const excluded = otherSelected(index)
                          const available = sortedContestants.filter(
                            (c) => !excluded.has(c.id) || c.id === selected,
                          )
                          return (
                            <div key={index} className="flex items-center gap-2">
                              <Select
                                value={selected}
                                onValueChange={(id) => handleChangeRow(index, id)}
                              >
                                <SelectTrigger className="flex-1 max-w-sm">
                                  <SelectValue placeholder="Select eliminated contestant" />
                                </SelectTrigger>
                                <SelectContent>
                                  {available.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedContestants.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveRow(index)}
                                  className="text-muted-foreground hover:text-red-600 shrink-0"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddRow}
                          disabled={!allRowsFilled}
                          className="text-sm"
                        >
                          <Plus className="size-3.5 mr-1" />
                          Add another elimination
                        </Button>
                      </div>
                      <Button
                        onClick={() => {
                          setEliminationConfirmed(true)
                          setResultsStep(2)
                        }}
                        disabled={!allRowsFilled}
                        className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white disabled:opacity-50"
                      >
                        Confirm Elimination{selectedContestants.length > 1 ? 's' : ''}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Players who picked eliminated contestant(s) will be marked eliminated.
                        Players with no pick this week will also be eliminated.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[#16A34A] flex items-center gap-2">
                      <Check className="size-4" />
                      {confirmationText()}
                    </p>
                  )}
                </div>

                {/* Step 2 — Tribe changes */}
                {resultsStep === 2 && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-[#F97316] text-white flex items-center justify-center text-xs font-medium">
                        2
                      </div>
                      <Label className="text-sm font-medium">
                        Did any tribe changes occur this episode?
                      </Label>
                    </div>

                    <RadioGroup
                      value={tribeChange}
                      onValueChange={setTribeChange}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no-changes" id="cwc-no-changes" />
                        <Label htmlFor="cwc-no-changes" className="font-normal cursor-pointer">
                          No changes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tribe-swap" id="cwc-tribe-swap" />
                        <Label htmlFor="cwc-tribe-swap" className="font-normal cursor-pointer">
                          Tribe swap occurred
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="merge" id="cwc-merge" />
                        <Label htmlFor="cwc-merge" className="font-normal cursor-pointer">
                          Tribes merged
                        </Label>
                      </div>
                    </RadioGroup>

                    {(tribeChange === 'tribe-swap' || tribeChange === 'merge') && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Update tribe assignments first:</span>
                        <Link
                          href="/admin/contestants"
                          className="text-[#F97316] hover:underline inline-flex items-center gap-1"
                        >
                          Contestants &amp; Tribes <ExternalLink className="size-3" />
                        </Link>
                      </div>
                    )}

                    {completeError && <p className="text-xs text-red-600">{completeError}</p>}

                    {tribeChange === 'no-changes' ? (
                      <Button
                        onClick={handleCompleteWeek}
                        disabled={completeLoading}
                        className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white disabled:opacity-50"
                      >
                        <Check className="size-4 mr-1" />
                        {completeLoading ? 'Completing…' : 'Complete Week'}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCompleteWeek}
                        disabled={completeLoading}
                        variant="outline"
                        className="border-muted-foreground/30 disabled:opacity-50"
                      >
                        {completeLoading ? 'Completing…' : 'Complete Week Anyway'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

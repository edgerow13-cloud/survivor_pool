'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Tribe } from '@/types/database'

export interface ContestantForPanel {
  id: string
  name: string
  tribe: { id: string; name: string; color: string } | null
  is_eliminated: boolean
}

interface Props {
  tribes: Tribe[]
  contestants: ContestantForPanel[]
  selectedContestants: Set<string>
  weekNumber: number
  userId: string
  onWeekNumberChange: (n: number) => void
  onContestantToggle: (id: string) => void
  onSelectAllInTribe: (tribeId: string) => void
  onCreateNewTribe: () => void
  onSuccess: () => void
}

export function TribeAssignmentPanel({
  tribes,
  contestants,
  selectedContestants,
  weekNumber,
  userId,
  onWeekNumberChange,
  onContestantToggle,
  onSelectAllInTribe,
  onCreateNewTribe,
  onSuccess,
}: Props) {
  const router = useRouter()
  const [selectedDestinationTribeId, setSelectedDestinationTribeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeContestants = contestants.filter((c) => !c.is_eliminated)
  const contestantsByTribe: Record<string, ContestantForPanel[]> = {}
  for (const tribe of tribes) {
    contestantsByTribe[tribe.id] = activeContestants.filter((c) => c.tribe?.id === tribe.id)
  }
  // Also group any with no tribe
  const noTribe = activeContestants.filter((c) => !c.tribe)

  const selectedNames = Array.from(selectedContestants)
    .map((id) => contestants.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[]

  const destinationTribe = tribes.find((t) => t.id === selectedDestinationTribeId)
  const canConfirm = selectedContestants.size > 0 && selectedDestinationTribeId

  async function handleConfirm() {
    if (!canConfirm || !selectedDestinationTribeId) return
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.all(
        Array.from(selectedContestants).map((contestantId) =>
          fetch('/api/admin/set-tribe-assignment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              contestant_id: contestantId,
              tribe_id: selectedDestinationTribeId,
              week_number: weekNumber,
            }),
          })
        )
      )
      const failed = results.find((r) => !r.ok)
      if (failed) {
        const body = await failed.json() as { error?: string }
        setError(body.error ?? 'Failed to update tribe assignments')
      } else {
        setSelectedDestinationTribeId(null)
        onSuccess()
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-l-4 border-l-[#F97316] py-0">
      <CardHeader className="pt-6">
        <CardTitle className="text-lg">Update Tribe Assignments</CardTitle>
        <CardDescription>Use this after a tribe swap, dissolve, or merge</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        {/* Week Number Input */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="tap-week-number" className="whitespace-nowrap">
              Week Number
            </Label>
            <Input
              id="tap-week-number"
              type="number"
              min={1}
              value={weekNumber}
              onChange={(e) => onWeekNumberChange(parseInt(e.target.value) || 1)}
              className="w-20"
            />
          </div>
          <p className="text-sm text-gray-500">
            Assignments take effect starting this week — past weeks are unchanged
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left — Select Contestants */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Select contestants to move</h4>
            <ScrollArea className="h-[280px] rounded-md border p-4">
              <div className="space-y-6">
                {tribes.map((tribe) => (
                  <div key={tribe.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tribe.color }} />
                        <span className="font-medium text-sm text-gray-900">{tribe.name}</span>
                      </div>
                      <button
                        onClick={() => onSelectAllInTribe(tribe.id)}
                        className="text-xs text-[#F97316] hover:underline"
                      >
                        Select all in tribe
                      </button>
                    </div>
                    <div className="space-y-1 pl-5">
                      {contestantsByTribe[tribe.id]?.map((contestant) => (
                        <div key={contestant.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`tap-${contestant.id}`}
                            checked={selectedContestants.has(contestant.id)}
                            onCheckedChange={() => onContestantToggle(contestant.id)}
                          />
                          <Label
                            htmlFor={`tap-${contestant.id}`}
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            {contestant.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {noTribe.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium text-sm text-gray-500">No tribe</span>
                    <div className="space-y-1 pl-5">
                      {noTribe.map((contestant) => (
                        <div key={contestant.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`tap-${contestant.id}`}
                            checked={selectedContestants.has(contestant.id)}
                            onCheckedChange={() => onContestantToggle(contestant.id)}
                          />
                          <Label
                            htmlFor={`tap-${contestant.id}`}
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            {contestant.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right — Destination Tribe */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Move selected to:</h4>
            <div className="space-y-2">
              {tribes.map((tribe) => (
                <button
                  key={tribe.id}
                  onClick={() => setSelectedDestinationTribeId(tribe.id)}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                    selectedDestinationTribeId === tribe.id
                      ? 'border-[#F97316] bg-[#F97316]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tribe.color }} />
                  <span className="font-medium text-gray-900">{tribe.name}</span>
                </button>
              ))}
              <button
                onClick={onCreateNewTribe}
                className="w-full flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-3 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Create and move to new tribe</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {selectedContestants.size > 0 && selectedDestinationTribeId && (
          <div className="rounded-lg bg-gray-50 p-4 border">
            <p className="text-sm font-medium text-gray-700">
              Moving {selectedContestants.size} contestant{selectedContestants.size !== 1 ? 's' : ''} to{' '}
              <span className="text-[#F97316]">{destinationTribe?.name}</span>:
            </p>
            <p className="text-sm text-gray-600 mt-1">{selectedNames.join(', ')}</p>
          </div>
        )}

        <p className="text-sm text-gray-500">Only select contestants who are CHANGING tribes.</p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          onClick={handleConfirm}
          disabled={!canConfirm || loading}
          className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-white disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Confirm Tribe Update'}
        </Button>
      </CardContent>
    </Card>
  )
}

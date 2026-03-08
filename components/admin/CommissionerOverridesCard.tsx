'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface OverridePlayer {
  id: string
  name: string
}

export interface OverrideWeek {
  id: string
  week_number: number
}

export interface OverrideContestant {
  id: string
  name: string
}

interface Props {
  players: OverridePlayer[]
  weeks: OverrideWeek[]
  contestants: OverrideContestant[]
}

function useAutoClear(value: string | null, delay = 3500) {
  const [displayed, setDisplayed] = useState<string | null>(null)
  useEffect(() => {
    if (value) {
      setDisplayed(value)
      const id = setTimeout(() => setDisplayed(null), delay)
      return () => clearTimeout(id)
    }
  }, [value, delay])
  return displayed
}

export function CommissionerOverridesCard({ players, weeks, contestants }: Props) {
  const { userId } = useAuth()
  const router = useRouter()

  // Set Pick state
  const [setPlayer, setSetPlayer] = useState('')
  const [setWeek, setSetWeek] = useState('')
  const [setContestant, setSetContestant] = useState('')
  const [setLoading, setSetLoading] = useState(false)
  const [setError, setSetError] = useState<string | null>(null)
  const [setSuccess, setSetSuccess] = useState<string | null>(null)

  // Reset Pick state
  const [resetPlayer, setResetPlayer] = useState('')
  const [resetWeek, setResetWeek] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)

  const displayedSetSuccess = useAutoClear(setSuccess)
  const displayedResetSuccess = useAutoClear(resetSuccess)

  async function handleSetPick() {
    if (!setPlayer || !setWeek || !setContestant || !userId) return
    setSetLoading(true)
    setSetError(null)
    setSetSuccess(null)
    try {
      const res = await fetch('/api/admin/upsert-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          user_id: setPlayer,
          week_id: setWeek,
          contestant_id: setContestant,
        }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setSetError(body.error ?? 'Failed to set pick.')
      } else {
        const playerName = players.find((p) => p.id === setPlayer)?.name ?? 'Player'
        const weekNum = weeks.find((w) => w.id === setWeek)?.week_number ?? '?'
        const contestantName = contestants.find((c) => c.id === setContestant)?.name ?? 'Contestant'
        setSetSuccess(`Pick set: ${playerName} → ${contestantName} (Wk ${weekNum})`)
        setSetPlayer('')
        setSetWeek('')
        setSetContestant('')
        router.refresh()
      }
    } catch {
      setSetError('Network error.')
    } finally {
      setSetLoading(false)
    }
  }

  async function handleResetPick() {
    if (!resetPlayer || !resetWeek || !userId) return
    setResetLoading(true)
    setResetError(null)
    setResetSuccess(null)
    try {
      const res = await fetch('/api/admin/upsert-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          user_id: resetPlayer,
          week_id: resetWeek,
          contestant_id: null,
        }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setResetError(body.error ?? 'Failed to reset pick.')
      } else {
        const playerName = players.find((p) => p.id === resetPlayer)?.name ?? 'Player'
        const weekNum = weeks.find((w) => w.id === resetWeek)?.week_number ?? '?'
        setResetSuccess(`Pick reset for ${playerName} — Week ${weekNum}`)
        setResetPlayer('')
        setResetWeek('')
        router.refresh()
      }
    } catch {
      setResetError('Network error.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commissioner Overrides</CardTitle>
        <CardDescription>Manually set or reset a player&apos;s pick for any week.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Set Pick */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Set Pick</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Player</label>
              <Select value={setPlayer} onValueChange={setSetPlayer}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Week</label>
              <Select value={setWeek} onValueChange={setSetWeek}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      Week {w.week_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Contestant</label>
              <Select value={setContestant} onValueChange={setSetContestant}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select contestant" />
                </SelectTrigger>
                <SelectContent>
                  {contestants.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSetPick}
              disabled={!setPlayer || !setWeek || !setContestant || setLoading}
              className="bg-[#F97316] text-white hover:bg-[#EA580C] disabled:opacity-50 shrink-0"
            >
              {setLoading ? 'Setting…' : 'Set Pick'}
            </Button>
          </div>
          {displayedSetSuccess && (
            <p className="text-xs text-green-600">{displayedSetSuccess}</p>
          )}
          {setError && <p className="text-xs text-red-600">{setError}</p>}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Reset Pick */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Reset Pick</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Player</label>
              <Select value={resetPlayer} onValueChange={setResetPlayer}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Week</label>
              <Select value={resetWeek} onValueChange={setResetWeek}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      Week {w.week_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleResetPick}
              disabled={!resetPlayer || !resetWeek || resetLoading}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 shrink-0"
            >
              {resetLoading ? 'Resetting…' : 'Reset Pick'}
            </Button>
          </div>
          {displayedResetSuccess && (
            <p className="text-xs text-green-600">{displayedResetSuccess}</p>
          )}
          {resetError && <p className="text-xs text-red-600">{resetError}</p>}
        </div>

        {/* Amber warning */}
        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-700">
            Overridden picks are flagged with ⚙️ in the picks grid.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

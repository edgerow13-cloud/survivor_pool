'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface PlayerPickStatus {
  userId: string
  name: string
  contestantName: string | null
  tribeName: string | null
}

export interface WeekStatusCardProps {
  week: {
    id: string
    week_number: number
    episode_date: string
    is_locked: boolean
    is_results_entered: boolean
  }
  playerPicks: PlayerPickStatus[]
}

function formatEpisodeDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function WeekStatusCard({ week, playerPicks }: WeekStatusCardProps) {
  const { userId } = useAuth()
  const router = useRouter()
  const [locking, setLocking] = useState(false)
  const [lockError, setLockError] = useState<string | null>(null)

  async function handleLock() {
    if (!userId) return
    setLocking(true)
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
        router.refresh()
      }
    } catch {
      setLockError('Network error.')
    } finally {
      setLocking(false)
    }
  }

  const statusBadge = week.is_results_entered ? (
    <Badge className="bg-[#16A34A] text-white">Results Entered</Badge>
  ) : week.is_locked ? (
    <Badge variant="secondary">Locked</Badge>
  ) : (
    <Badge className="bg-[#F97316] text-white">In Progress</Badge>
  )

  const lockStatusText = week.is_results_entered
    ? 'Results have been entered'
    : week.is_locked
      ? 'Locked — awaiting results'
      : 'Unlocked — picks still open'

  const lockDotColor = week.is_results_entered
    ? 'bg-[#16A34A]'
    : week.is_locked
      ? 'bg-orange-400'
      : 'bg-[#16A34A]'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Week {week.week_number} Status</CardTitle>
        <CardAction>{statusBadge}</CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-foreground">{formatEpisodeDate(week.episode_date)}</p>
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${lockDotColor}`} />
            <p className="text-sm text-muted-foreground">{lockStatusText}</p>
          </div>
        </div>

        <div className="space-y-2">
          {playerPicks.map((player) => (
            <div
              key={player.userId}
              className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
            >
              <span className="text-sm font-medium text-foreground">{player.name}</span>
              {player.contestantName ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {player.contestantName}
                    {player.tribeName ? ` (${player.tribeName})` : ''}
                  </span>
                  <Check className="size-4 text-[#16A34A]" />
                </div>
              ) : (
                <Badge variant="destructive" className="bg-[#DC2626] text-white">
                  No pick
                </Badge>
              )}
            </div>
          ))}
          {playerPicks.length === 0 && (
            <p className="text-sm text-muted-foreground">No active players.</p>
          )}
        </div>

        {lockError && <p className="text-xs text-red-600">{lockError}</p>}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          {!week.is_locked && !week.is_results_entered && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleLock}
              disabled={locking}
            >
              {locking ? 'Locking…' : 'Lock Week Early'}
            </Button>
          )}
          <Button
            className="flex-1 bg-[#F97316] hover:bg-orange-600 text-white disabled:opacity-50"
            disabled={!week.is_locked && !week.is_results_entered}
            asChild={week.is_locked || week.is_results_entered}
          >
            {week.is_locked || week.is_results_entered ? (
              <Link href="/admin/weeks">Enter Results</Link>
            ) : (
              <span>Enter Results</span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

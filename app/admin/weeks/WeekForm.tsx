'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface Props {
  nextWeekNumber: number
}

export default function WeekForm({ nextWeekNumber }: Props) {
  const { userId } = useAuth()
  const router = useRouter()
  const [weekNumber, setWeekNumber] = useState(nextWeekNumber)
  const [episodeDate, setEpisodeDate] = useState('')
  const [episodeTime, setEpisodeTime] = useState('20:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!episodeDate || !episodeTime) return
    setLoading(true)
    setError(null)
    try {
      // Combine date + time as local datetime, convert to ISO for the API
      const dateTime = new Date(`${episodeDate}T${episodeTime}:00`)
      const res = await fetch('/api/admin/create-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          week_number: weekNumber,
          episode_date: dateTime.toISOString(),
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to add week')
      } else {
        setWeekNumber((n) => n + 1)
        setEpisodeDate('')
        setEpisodeTime('20:00')
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Week</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wf-number">Week Number</Label>
              <Input
                id="wf-number"
                type="number"
                min={1}
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wf-date">Episode Date</Label>
              <Input
                id="wf-date"
                type="date"
                value={episodeDate}
                onChange={(e) => setEpisodeDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wf-time">Air Time (local)</Label>
              <Input
                id="wf-time"
                type="time"
                value={episodeTime}
                onChange={(e) => setEpisodeTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white disabled:opacity-50"
            >
              {loading ? 'Adding…' : 'Add Week'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Episode air time is used as the automatic pick deadline.
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </CardContent>
    </Card>
  )
}

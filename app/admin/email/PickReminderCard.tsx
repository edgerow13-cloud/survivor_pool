'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface Props {
  unpickedCount: number
  activeCount: number
  weekNumber: number | null
  hasOpenWeek: boolean
}

export function PickReminderCard({ unpickedCount, activeCount, weekNumber, hasOpenWeek }: Props) {
  const { userId } = useAuth()
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [resultMsg, setResultMsg] = useState('')

  const canSend = hasOpenWeek && unpickedCount > 0

  async function handleSend() {
    setStatus('sending')
    setResultMsg('')

    try {
      const res = await fetch('/api/admin/send-pick-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json() as { sent?: number; skipped?: number; error?: string }
      if (!res.ok) {
        setStatus('error')
        setResultMsg(data.error ?? 'Failed to send')
      } else {
        setStatus('success')
        setResultMsg(`Sent to ${data.sent} player${data.sent === 1 ? '' : 's'} ✓`)
      }
    } catch {
      setStatus('error')
      setResultMsg('Network error — please try again')
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">Pick Reminder</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Sends a personalized reminder to every active player who hasn&apos;t picked yet this week.
      </p>

      {!hasOpenWeek ? (
        <p className="text-sm text-muted-foreground italic">No open week — all weeks have results entered.</p>
      ) : (
        <>
          <div className="mb-4 rounded-md bg-primary/10 border border-primary/20 px-4 py-3">
            <p className="text-sm font-medium text-primary">
              Week {weekNumber}:{' '}
              <span className="font-bold">{unpickedCount}</span> of{' '}
              <span className="font-bold">{activeCount}</span> active player
              {activeCount === 1 ? '' : 's'} haven&apos;t picked yet
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSend}
              disabled={!canSend || status === 'sending'}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'sending' ? 'Sending…' : 'Send Reminder'}
            </button>

            {unpickedCount === 0 && (
              <span className="text-sm text-muted-foreground italic">Everyone has picked this week.</span>
            )}

            {resultMsg && (
              <span
                className={`text-sm font-medium ${
                  status === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {resultMsg}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

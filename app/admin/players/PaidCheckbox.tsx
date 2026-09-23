'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Checkbox } from '@/components/ui/checkbox'

export default function PaidCheckbox({
  playerId,
  playerName,
  hasPaid,
}: {
  playerId: string
  playerName: string
  hasPaid: boolean
}) {
  const { userId } = useAuth()
  const router = useRouter()
  const [checked, setChecked] = useState(hasPaid)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle(next: boolean) {
    const previous = checked
    setChecked(next)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/set-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, user_id: playerId, has_paid: next }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setChecked(previous)
        setError(data.error ?? 'Failed')
      } else {
        router.refresh()
      }
    } catch {
      setChecked(previous)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Checkbox
        checked={checked}
        disabled={loading}
        onCheckedChange={(value) => toggle(value === true)}
        aria-label={`${playerName} has paid the buy-in`}
        className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] data-[state=checked]:text-white"
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function PaidToggle({ playerId, paid }: { playerId: string; paid: boolean }) {
  const { userId } = useAuth()
  const router = useRouter()
  const [isPaid, setIsPaid] = useState(paid)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    const next = !isPaid
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/set-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, user_id: playerId, paid: next }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed')
      } else {
        setIsPaid(next)
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={toggle}
        disabled={loading}
        aria-pressed={isPaid}
        className={cn(
          'text-xs h-7 px-2 min-w-[4.5rem]',
          isPaid
            ? 'bg-[#16A34A] border-[#16A34A] text-white hover:bg-[#15803D] hover:text-white'
            : 'border-gray-300 text-muted-foreground hover:bg-gray-50',
        )}
      >
        {loading ? '…' : isPaid ? '✓ Paid' : 'Unpaid'}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

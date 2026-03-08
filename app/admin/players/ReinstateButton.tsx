'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export default function ReinstateButton({ playerId }: { playerId: string }) {
  const { userId } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reinstate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/reinstate-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, user_id: playerId }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed')
      } else {
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
        onClick={reinstate}
        disabled={loading}
        className="text-xs border-green-300 text-green-700 hover:bg-green-50 h-7 px-2"
      >
        {loading ? '…' : 'Reinstate'}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

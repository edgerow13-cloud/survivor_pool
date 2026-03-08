'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function DeactivateButton({ playerId }: { playerId: string }) {
  const { userId } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deactivate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/deactivate-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, playerId }),
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
      <button
        onClick={deactivate}
        disabled={loading}
        className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
      >
        {loading ? '...' : 'Deactivate'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

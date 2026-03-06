'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReinstateButton({ userId }: { userId: string }) {
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
        body: JSON.stringify({ user_id: userId }),
      })
      if (!res.ok) {
        const data = await res.json()
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
        onClick={reinstate}
        disabled={loading}
        className="px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50"
      >
        {loading ? '...' : 'Reinstate'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

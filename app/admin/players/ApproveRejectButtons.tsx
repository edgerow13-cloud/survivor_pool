'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApproveRejectButtons({ joinRequestId }: { joinRequestId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action)
    setError(null)
    const endpoint =
      action === 'approve' ? '/api/admin/approve-player' : '/api/admin/reject-player'
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ join_request_id: joinRequestId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        className="px-3 py-1 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading === 'approve' ? '...' : 'Approve'}
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        className="px-3 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
      >
        {loading === 'reject' ? '...' : 'Reject'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WeekForm() {
  const router = useRouter()
  const [weekNumber, setWeekNumber] = useState('')
  const [episodeDate, setEpisodeDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/create-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_number: Number(weekNumber), episode_date: new Date(episodeDate).toISOString() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed')
      } else {
        setWeekNumber('')
        setEpisodeDate('')
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-3 flex-wrap">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Week #</label>
        <input
          type="number"
          min="1"
          value={weekNumber}
          onChange={(e) => setWeekNumber(e.target.value)}
          required
          className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Episode Date &amp; Time (your local time)</label>
        <input
          type="datetime-local"
          value={episodeDate}
          onChange={(e) => setEpisodeDate(e.target.value)}
          required
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? '...' : 'Add Week'}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  )
}

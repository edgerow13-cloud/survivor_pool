'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Week, Contestant, User } from '@/types/database'

interface Props {
  week: Week
  contestants: Contestant[]
  users: User[]
  eliminatedContestantName: string | null
}

export default function WeekRow({ week, contestants, users, eliminatedContestantName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showOverride, setShowOverride] = useState(false)
  const [selectedContestant, setSelectedContestant] = useState(week.eliminated_contestant_id ?? '')
  const [overrideUser, setOverrideUser] = useState('')
  const [overrideContestant, setOverrideContestant] = useState('')

  async function toggleLock() {
    setLoading('lock')
    setError(null)
    try {
      const res = await fetch('/api/admin/update-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_id: week.id, is_locked: !week.is_locked }),
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
      setLoading(null)
    }
  }

  async function enterResults(e: React.FormEvent) {
    e.preventDefault()
    setLoading('results')
    setError(null)
    try {
      const res = await fetch('/api/admin/enter-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_id: week.id,
          eliminated_contestant_id: selectedContestant || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed')
      } else {
        setShowResults(false)
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(null)
    }
  }

  async function submitOverride(e: React.FormEvent) {
    e.preventDefault()
    setLoading('override')
    setError(null)
    try {
      const res = await fetch('/api/admin/upsert-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: overrideUser,
          week_id: week.id,
          contestant_id: overrideContestant || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed')
      } else {
        setOverrideUser('')
        setOverrideContestant('')
        setShowOverride(false)
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(null)
    }
  }

  // For results entry: show non-eliminated contestants + already-set one
  const resultContestants = contestants.filter(
    (c) => !c.is_eliminated || c.id === week.eliminated_contestant_id
  )

  // For pick override: show only non-eliminated contestants
  const pickContestants = contestants.filter((c) => !c.is_eliminated)

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-gray-900">Week {week.week_number}</span>
          <span className="text-sm text-gray-500">
            {new Date(week.episode_date).toLocaleString()}
          </span>
          {week.is_results_entered && eliminatedContestantName && (
            <span className="text-sm text-red-600">Eliminated: {eliminatedContestantName}</span>
          )}
          {week.is_results_entered && !eliminatedContestantName && (
            <span className="text-sm text-gray-400">No elimination</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 text-xs rounded-full font-medium ${week.is_locked ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
          >
            {week.is_locked ? 'Locked' : 'Open'}
          </span>
          {week.is_results_entered && (
            <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-green-100 text-green-700">
              Results Entered
            </span>
          )}
          <button
            onClick={toggleLock}
            disabled={loading === 'lock'}
            className="px-3 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === 'lock' ? '...' : week.is_locked ? 'Unlock' : 'Lock'}
          </button>
          <button
            onClick={() => setShowResults(!showResults)}
            className="px-3 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50"
          >
            {week.is_results_entered ? 'Re-enter Results' : 'Enter Results'}
          </button>
          <button
            onClick={() => setShowOverride(!showOverride)}
            className="px-3 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Override Pick
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {showResults && (
        <form
          onSubmit={enterResults}
          className="flex items-end gap-3 pt-3 border-t border-gray-100 flex-wrap"
        >
          <div>
            <label className="block text-xs text-gray-500 mb-1">Eliminated Contestant</label>
            <select
              value={selectedContestant}
              onChange={(e) => setSelectedContestant(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— No elimination —</option>
              {resultContestants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading === 'results'}
            className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {loading === 'results' ? '...' : 'Save Results'}
          </button>
        </form>
      )}

      {showOverride && (
        <form
          onSubmit={submitOverride}
          className="flex items-end gap-3 pt-3 border-t border-gray-100 flex-wrap"
        >
          <div>
            <label className="block text-xs text-gray-500 mb-1">Player</label>
            <select
              value={overrideUser}
              onChange={(e) => setOverrideUser(e.target.value)}
              required
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select player...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contestant</label>
            <select
              value={overrideContestant}
              onChange={(e) => setOverrideContestant(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— No Pick —</option>
              {pickContestants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading === 'override'}
            className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {loading === 'override' ? '...' : 'Set Pick'}
          </button>
        </form>
      )}
    </div>
  )
}

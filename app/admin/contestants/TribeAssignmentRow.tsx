'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { Contestant, Tribe } from '@/types/database'

interface Props {
  contestant: Contestant
  tribes: Tribe[]
  currentTribeId: string | null
  defaultWeek: number
}

export default function TribeAssignmentRow({
  contestant,
  tribes,
  currentTribeId,
  defaultWeek,
}: Props) {
  const { userId } = useAuth()
  const router = useRouter()
  const [weekNum, setWeekNum] = useState(String(defaultWeek))
  const [tribeId, setTribeId] = useState(currentTribeId ?? (tribes[0]?.id ?? ''))
  const [isElim, setIsElim] = useState(contestant.is_eliminated)
  const [elimWeek, setElimWeek] = useState(String(contestant.eliminated_week ?? ''))
  const [loading, setLoading] = useState<string | null>(null)
  const [tribeError, setTribeError] = useState<string | null>(null)
  const [tribeSuccess, setTribeSuccess] = useState(false)
  const [contestantError, setContestantError] = useState<string | null>(null)

  async function saveTribeAssignment(e: React.FormEvent) {
    e.preventDefault()
    if (!tribeId) return
    setLoading('tribe')
    setTribeError(null)
    setTribeSuccess(false)
    try {
      const res = await fetch('/api/admin/set-tribe-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contestant_id: contestant.id,
          tribe_id: tribeId,
          week_number: Number(weekNum),
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setTribeError(data.error ?? 'Failed')
      } else {
        setTribeSuccess(true)
        setTimeout(() => setTribeSuccess(false), 2000)
        router.refresh()
      }
    } catch {
      setTribeError('Network error')
    } finally {
      setLoading(null)
    }
  }

  async function saveContestant(e: React.FormEvent) {
    e.preventDefault()
    setLoading('contestant')
    setContestantError(null)
    try {
      const res = await fetch('/api/admin/update-contestant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contestant_id: contestant.id,
          is_eliminated: isElim,
          eliminated_week: isElim && elimWeek ? Number(elimWeek) : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setContestantError(data.error ?? 'Failed')
      } else {
        router.refresh()
      }
    } catch {
      setContestantError('Network error')
    } finally {
      setLoading(null)
    }
  }

  const currentTribe = tribes.find((t) => t.id === currentTribeId)

  return (
    <tr className="border-b border-gray-100">
      <td className="py-3 pr-4 font-medium text-gray-900">
        <span className={contestant.is_eliminated ? 'line-through text-gray-400' : ''}>
          {contestant.name}
        </span>
      </td>
      <td className="py-3 pr-4">
        {currentTribe ? (
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full inline-block shrink-0"
              style={{ backgroundColor: currentTribe.color }}
            />
            <span className="text-sm text-gray-700">{currentTribe.name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      <td className="py-3 pr-4">
        <form onSubmit={saveTribeAssignment} className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min="1"
            value={weekNum}
            onChange={(e) => setWeekNum(e.target.value)}
            className="w-16 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <select
            value={tribeId}
            onChange={(e) => setTribeId(e.target.value)}
            className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {tribes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading === 'tribe'}
            className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading === 'tribe' ? '...' : 'Set'}
          </button>
          {tribeSuccess && <span className="text-xs text-green-600">✓ Saved</span>}
        </form>
        {tribeError && <p className="text-xs text-red-600 mt-1">{tribeError}</p>}
      </td>
      <td className="py-3">
        <form onSubmit={saveContestant} className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isElim}
              onChange={(e) => setIsElim(e.target.checked)}
              className="rounded"
            />
            Out
          </label>
          {isElim && (
            <input
              type="number"
              min="1"
              value={elimWeek}
              onChange={(e) => setElimWeek(e.target.value)}
              placeholder="Wk #"
              className="w-14 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          )}
          <button
            type="submit"
            disabled={loading === 'contestant'}
            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {loading === 'contestant' ? '...' : 'Save'}
          </button>
        </form>
        {contestantError && <p className="text-xs text-red-600 mt-1">{contestantError}</p>}
      </td>
    </tr>
  )
}

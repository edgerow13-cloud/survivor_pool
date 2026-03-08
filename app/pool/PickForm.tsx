'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ContestantOption {
  id: string
  name: string
  is_eliminated: boolean
  tribe: { name: string; color: string } | null
}

interface Props {
  weekId: string
  userId: string
  currentContestantId: string | null
  contestants: ContestantOption[]
  usedContestantIds: string[]
  initiallyShowForm: boolean
  onPickSaved: () => void
}

export default function PickForm({
  weekId,
  userId,
  currentContestantId,
  contestants,
  usedContestantIds,
  initiallyShowForm,
  onPickSaved,
}: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(initiallyShowForm)
  const [selected, setSelected] = useState<string | null>(currentContestantId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const usedSet = new Set(usedContestantIds)

  const currentPick = currentContestantId
    ? contestants.find((c) => c.id === currentContestantId)
    : null

  async function handleSubmit() {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/picks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, week_id: weekId, contestant_id: selected }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setError(body.error ?? 'Something went wrong. Please try again.')
      } else {
        onPickSaved()
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isUnchanged = selected === currentContestantId
  const submitDisabled = !selected || isUnchanged || loading

  if (!showForm && currentPick) {
    return (
      <div className="rounded-lg p-4 bg-orange-50 border border-orange-200">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {currentPick.tribe && (
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: currentPick.tribe.color }}
              />
            )}
            <span className="font-medium text-gray-800">
              You picked <strong>{currentPick.name}</strong>
            </span>
            <span className="text-green-600 text-sm">✓</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-orange-600 hover:underline font-medium"
          >
            Change pick
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {currentPick && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <span>Current pick: <strong className="text-gray-700">{currentPick.name}</strong></span>
          <button
            onClick={() => { setShowForm(false); setSelected(currentContestantId) }}
            className="text-gray-400 hover:text-gray-600 text-xs underline"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {contestants.map((c) => {
          const isUsed = usedSet.has(c.id) && c.id !== currentContestantId
          const isElim = c.is_eliminated
          const isDisabled = isUsed || isElim
          const isSelected = selected === c.id

          let cardClass =
            'relative flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors cursor-pointer select-none '

          if (isDisabled) {
            cardClass += 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
          } else if (isSelected) {
            cardClass += 'border-orange-400 bg-orange-50 text-orange-800'
          } else {
            cardClass += 'border-gray-200 bg-white hover:border-orange-300 text-gray-700'
          }

          return (
            <button
              key={c.id}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && setSelected(c.id)}
              className={cardClass}
            >
              {c.tribe && (
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.tribe.color }}
                />
              )}
              <span className={isElim ? 'line-through' : ''}>{c.name}</span>
              {isUsed && !isElim && (
                <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">Used</span>
              )}
            </button>
          )
        })}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button
        type="button"
        disabled={submitDisabled}
        onClick={handleSubmit}
        className="w-full py-2.5 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting...' : 'Submit Pick'}
      </button>
    </div>
  )
}

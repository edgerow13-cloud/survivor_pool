'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContestantCard } from '@/components/survivor/ContestantCard'
import { SubmitBar } from '@/components/survivor/SubmitBar'
import { SuccessAlert } from '@/components/survivor/SuccessAlert'

export type PickMode = 'selecting' | 'submitted' | 'locked'

export interface ContestantOption {
  id: string
  name: string
  is_eliminated: boolean
  eliminated_week: number | null
  tribe: { name: string; color: string } | null
  photo_url?: string | null
}

interface Props {
  weekId: string
  weekNumber: number
  userId: string
  currentContestantId: string | null
  contestants: ContestantOption[]
  usedContestantIds: string[]
  usedContestantWeekMap: Record<string, number>
  isLocked?: boolean
  onPickSaved: () => void
}

export default function PickForm({
  weekId,
  weekNumber,
  userId,
  currentContestantId,
  contestants,
  usedContestantIds,
  usedContestantWeekMap,
  isLocked = false,
  onPickSaved,
}: Props) {
  const router = useRouter()

  const initialMode: PickMode = isLocked
    ? 'locked'
    : currentContestantId !== null
      ? 'submitted'
      : 'selecting'

  const [mode, setMode] = useState<PickMode>(initialMode)
  const [selected, setSelected] = useState<string | null>(currentContestantId)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const usedSet = new Set(usedContestantIds)
  const selectedContestant = selected ? contestants.find((c) => c.id === selected) ?? null : null

  function handleSelect(id: string) {
    if (mode !== 'selecting') return
    setSelected((prev) => (prev === id ? null : id))
  }

  async function handleSubmit() {
    if (!selected || mode !== 'selecting') return
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
        setMode('submitted')
        setShowSuccessAlert(true)
        onPickSaved()
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleChangePick() {
    setMode('selecting')
    setShowSuccessAlert(false)
  }

  return (
    <>
      {/* Success alert */}
      {showSuccessAlert && selectedContestant && (
        <div className="mb-6">
          <SuccessAlert
            contestantName={selectedContestant.name}
            week={weekNumber}
            onDismiss={() => setShowSuccessAlert(false)}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Contestant card grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {contestants.map((c) => {
          const isUsed = usedSet.has(c.id) && c.id !== currentContestantId
          const usedWeek = isUsed ? (usedContestantWeekMap[c.id] ?? null) : null
          return (
            <ContestantCard
              key={c.id}
              id={c.id}
              name={c.name}
              tribe={c.tribe}
              isEliminated={c.is_eliminated}
              eliminatedWeek={c.eliminated_week}
              usedWeek={usedWeek}
              isSelected={selected === c.id}
              mode={mode}
              photoUrl={c.photo_url}
              onSelect={handleSelect}
            />
          )
        })}
      </div>

      {/* Desktop sticky submit bar */}
      <div className="hidden md:block sticky bottom-0 mt-8 -mx-4 sm:-mx-6 md:-mx-8">
        <SubmitBar
          selectedName={selectedContestant?.name ?? null}
          selectedTribeName={selectedContestant?.tribe?.name ?? null}
          mode={mode}
          isLoading={loading}
          onSubmit={handleSubmit}
          onChangePick={handleChangePick}
        />
      </div>

      {/* Mobile fixed submit bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <SubmitBar
          selectedName={selectedContestant?.name ?? null}
          selectedTribeName={selectedContestant?.tribe?.name ?? null}
          mode={mode}
          isLoading={loading}
          onSubmit={handleSubmit}
          onChangePick={handleChangePick}
        />
      </div>
    </>
  )
}

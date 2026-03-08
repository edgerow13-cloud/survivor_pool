'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export interface ContestantOption {
  id: string
  name: string
}

interface Props {
  playerId: string
  contestantId: string | null
  contestantName: string | null
  isEliminated: boolean
  eliminatedWeek: number | null
  /** Non-eliminated contestants only — shown in the edit dropdown. */
  contestants: ContestantOption[]
}

export default function WinnerPickCell({
  playerId,
  contestantId,
  contestantName,
  isEliminated,
  eliminatedWeek,
  contestants,
}: Props) {
  const { userId } = useAuth()
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [selected, setSelected] = useState(contestantId ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!userId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/winner-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          targetUserId: playerId,
          contestantId: selected || null,
        }),
      })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Failed to save')
      } else {
        setIsEditing(false)
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setSelected(contestantId ?? '')
    setIsEditing(false)
    setError(null)
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1.5 py-0.5">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        >
          <option value="">— No pick —</option>
          {contestants.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={save}
            disabled={saving}
            className="h-7 px-2.5 text-xs bg-[#F97316] hover:bg-[#F97316]/90 text-white"
          >
            {saving ? '…' : 'Save'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={cancel}
            disabled={saving}
            className="h-7 px-2.5 text-xs"
          >
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex flex-col">
        {contestantName ? (
          <>
            <span className="text-sm text-gray-900">{contestantName}</span>
            {isEliminated && eliminatedWeek !== null && (
              <span className="text-xs font-medium text-[#DC2626]">
                ⚠ Eliminated Wk {eliminatedWeek}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">None</span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 shrink-0"
        title="Edit winner pick"
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Tribe } from '@/types/database'

interface Props {
  tribe?: Tribe
}

export default function TribeForm({ tribe }: Props) {
  const router = useRouter()
  const isEdit = !!tribe
  const [name, setName] = useState(tribe?.name ?? '')
  const [color, setColor] = useState(tribe?.color ?? '#F97316')
  const [isMerged, setIsMerged] = useState(tribe?.is_merged ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const endpoint = isEdit ? '/api/admin/update-tribe' : '/api/admin/create-tribe'
      const body = isEdit
        ? { tribe_id: tribe!.id, name, color, is_merged: isMerged }
        : { name, color, is_merged: isMerged }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed')
      } else {
        if (!isEdit) {
          setName('')
          setColor('#F97316')
          setIsMerged(false)
        }
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
        <label className="block text-xs text-gray-500 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Tribe name"
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            pattern="#[0-9A-Fa-f]{6}"
            placeholder="#F97316"
            className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pb-2">
        <input
          type="checkbox"
          id={`merged-${tribe?.id ?? 'new'}`}
          checked={isMerged}
          onChange={(e) => setIsMerged(e.target.checked)}
          className="rounded"
        />
        <label htmlFor={`merged-${tribe?.id ?? 'new'}`} className="text-sm text-gray-600">
          Merged tribe
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? '...' : isEdit ? 'Save' : 'Add Tribe'}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  )
}

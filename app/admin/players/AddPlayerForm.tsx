'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AddPlayerForm() {
  const { userId } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name, email }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed')
      } else {
        setName('')
        setEmail('')
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="player-name" className="text-sm font-medium text-gray-700">
            Name
          </label>
          <Input
            id="player-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Player name"
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="player-email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <Input
            id="player-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="player@example.com"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#F97316] text-white hover:bg-[#EA580C] disabled:opacity-50"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {loading ? 'Adding…' : 'Add Player'}
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Players are immediately active. Notify them via text or group chat that they can log in at{' '}
        pool.eddiegerow.com
      </p>
    </div>
  )
}

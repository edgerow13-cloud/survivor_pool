'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface User {
  id: string
  name: string
  email: string
  status: string
}

interface Props {
  users: User[]
  activeCount: number
}

export function BlastEmailForm({ users, activeCount }: Props) {
  const { userId } = useAuth()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [resultMsg, setResultMsg] = useState('')

  const activeUsers = users.filter((u) => u.status === 'active')
  const eliminatedUsers = users.filter((u) => u.status === 'eliminated')

  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectActive() {
    setSelectedIds(new Set(activeUsers.map((u) => u.id)))
  }

  function selectAll() {
    setSelectedIds(new Set(users.map((u) => u.id)))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.size === 0) return
    setStatus('sending')
    setResultMsg('')

    try {
      const res = await fetch('/api/admin/send-blast-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subject, body, userIds: [...selectedIds] }),
      })
      const data = await res.json() as { sent?: number; error?: string }
      if (!res.ok) {
        setStatus('error')
        setResultMsg(data.error ?? 'Failed to send')
      } else {
        setStatus('success')
        setResultMsg(`Sent to ${data.sent} player${data.sent === 1 ? '' : 's'} ✓`)
      }
    } catch {
      setStatus('error')
      setResultMsg('Network error — please try again')
    }
  }

  const sel = selectedIds.size

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Blast Email</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">Recipients</label>
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={selectActive} className="text-primary hover:underline">
                Select active ({activeCount})
              </button>
              <span className="text-muted-foreground/40">|</span>
              <button type="button" onClick={selectAll} className="text-primary hover:underline">
                Select all ({users.length})
              </button>
              <span className="text-muted-foreground/40">|</span>
              <button type="button" onClick={deselectAll} className="text-muted-foreground hover:underline">
                Deselect all
              </button>
            </div>
          </div>

          <div className="border border-border rounded-md overflow-y-auto max-h-72">
            {activeUsers.length > 0 && (
              <>
                <div className="px-3 py-1.5 bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
                  Active
                </div>
                {activeUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleUser(u.id)}
                      className="accent-orange-500"
                    />
                    <span className="text-sm text-foreground">{u.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{u.email}</span>
                  </label>
                ))}
              </>
            )}
            {eliminatedUsers.length > 0 && (
              <>
                <div className="px-3 py-1.5 bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border border-t border-border">
                  Eliminated
                </div>
                {eliminatedUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleUser(u.id)}
                      className="accent-orange-500"
                    />
                    <span className="text-sm text-muted-foreground line-through">{u.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{u.email}</span>
                  </label>
                ))}
              </>
            )}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {sel} of {users.length} player{users.length === 1 ? '' : 's'} selected
          </p>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. Survivor pool update"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-foreground mb-1">
            Message
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={6}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            placeholder="Write your message here. Separate paragraphs with a blank line."
          />
          <p className="mt-1 text-xs text-muted-foreground">Plain text — blank lines become paragraph breaks.</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={status === 'sending' || sel === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'sending' ? 'Sending…' : `Send to ${sel} player${sel === 1 ? '' : 's'}`}
          </button>

          {resultMsg && (
            <span
              className={`text-sm font-medium ${
                status === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {resultMsg}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

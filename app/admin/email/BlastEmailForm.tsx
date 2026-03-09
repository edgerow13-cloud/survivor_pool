'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface Props {
  activeCount: number
  totalCount: number
}

export function BlastEmailForm({ activeCount, totalCount }: Props) {
  const { userId } = useAuth()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipients, setRecipients] = useState<'active' | 'all'>('active')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [resultMsg, setResultMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setResultMsg('')

    try {
      const res = await fetch('/api/admin/send-blast-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subject, body, recipients }),
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

  const recipientCount = recipients === 'active' ? activeCount : totalCount

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Blast Email</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipients
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="recipients"
                value="active"
                checked={recipients === 'active'}
                onChange={() => setRecipients('active')}
                className="accent-orange-500"
              />
              <span className="text-sm text-gray-700">
                Active players only ({activeCount})
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="recipients"
                value="all"
                checked={recipients === 'all'}
                onChange={() => setRecipients('all')}
                className="accent-orange-500"
              />
              <span className="text-sm text-gray-700">
                All players — active + eliminated ({totalCount})
              </span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="e.g. Survivor pool update"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={6}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
            placeholder="Write your message here. Separate paragraphs with a blank line."
          />
          <p className="mt-1 text-xs text-gray-500">Plain text — blank lines become paragraph breaks.</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={status === 'sending'}
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'sending' ? 'Sending…' : `Send to ${recipientCount} player${recipientCount === 1 ? '' : 's'}`}
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

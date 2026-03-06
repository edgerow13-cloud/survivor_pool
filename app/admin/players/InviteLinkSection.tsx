'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InviteLink } from '@/types/database'

interface Props {
  activeLinks: InviteLink[]
  appUrl: string
}

export default function InviteLinkSection({ activeLinks, appUrl }: Props) {
  const router = useRouter()
  const [newToken, setNewToken] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generateLink() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/create-invite', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to generate link')
      } else {
        const data = await res.json()
        setNewToken(data.token)
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setGenerating(false)
    }
  }

  async function revokeLink(id: string) {
    setRevoking(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/revoke-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_link_id: id }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to revoke')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setRevoking(null)
    }
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const newLinkUrl = newToken ? `${appUrl}/join/${newToken}` : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={generateLink}
          disabled={generating}
          className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {generating ? '...' : 'Generate New Link'}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {newLinkUrl && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
          <span className="text-sm text-green-800 font-mono break-all flex-1">{newLinkUrl}</span>
          <button
            onClick={() => copyToClipboard(newLinkUrl)}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {activeLinks.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs border-b border-gray-200">
              <th className="pb-2 font-medium">Link</th>
              <th className="pb-2 font-medium">Created</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {activeLinks.map((link) => (
              <tr key={link.id} className="border-b border-gray-100">
                <td className="py-2 font-mono text-xs text-gray-600">
                  {appUrl}/join/{link.token.slice(0, 12)}...
                </td>
                <td className="py-2 text-gray-500">
                  {new Date(link.created_at).toLocaleDateString()}
                </td>
                <td className="py-2">
                  <button
                    onClick={() => revokeLink(link.id)}
                    disabled={revoking === link.id}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    {revoking === link.id ? '...' : 'Revoke'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

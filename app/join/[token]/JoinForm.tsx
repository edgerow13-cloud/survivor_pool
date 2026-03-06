'use client'

import { useState } from 'react'

export default function JoinForm({ token }: { token: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'submitted' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const response = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, token }),
    })

    if (response.status === 201) {
      setStatus('submitted')
    } else {
      const data = await response.json().catch(() => ({}))
      setErrorMessage(data.error ?? 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'submitted') {
    return (
      <div className="text-center">
        <p className="text-gray-700 font-medium">Your request has been submitted.</p>
        <p className="text-gray-500 text-sm mt-1">
          You&apos;ll receive an email when you&apos;re approved.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Your name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-sm">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-md transition-colors"
      >
        {status === 'loading' ? 'Submitting...' : 'Request to Join'}
      </button>
    </form>
  )
}

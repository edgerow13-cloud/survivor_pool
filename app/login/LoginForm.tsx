'use client'

import { useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json() as { userId?: string; name?: string; role?: string; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      sessionStorage.setItem('pool_userId', data.userId!)
      sessionStorage.setItem('pool_name', data.name!)
      sessionStorage.setItem('pool_role', data.role!)
      window.location.href = '/pool'
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-primary hover:bg-primary/90 disabled:bg-primary/40 text-primary-foreground font-semibold rounded-md transition-colors"
      >
        {loading ? 'Checking...' : 'Enter Pool'}
      </button>
    </form>
  )
}

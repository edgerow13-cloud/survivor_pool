'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export function AdminHeader() {
  const { name, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="h-1 bg-[#F97316]" />
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <Link href="/admin" className="text-lg font-bold text-foreground">
          Survivor 50 Pool
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground">
            {name} <span className="text-muted-foreground">(Commissioner)</span>
          </span>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-[#F97316] px-4 py-2 text-white md:px-6">
        <span className="text-sm font-medium">🔥 Commissioner Dashboard</span>
      </div>
    </header>
  )
}

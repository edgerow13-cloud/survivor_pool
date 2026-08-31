'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useActiveSeason } from '@/hooks/use-active-season'

export function AdminHeader() {
  const { name, logout } = useAuth()
  const season = useActiveSeason()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="ink-panel flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="font-display text-sm font-bold">O</span>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold text-foreground">Outlast</span>
            <span className="eyebrow">
              {season ? `Season ${season.seasonNumber}` : 'Private pool'}
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground">
            {name} <span className="text-muted-foreground">(Commissioner)</span>
          </span>
          <button
            onClick={logout}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-primary px-4 py-2 text-primary-foreground md:px-6">
        <span className="text-sm font-semibold">🔥 Commissioner Dashboard</span>
      </div>
    </header>
  )
}

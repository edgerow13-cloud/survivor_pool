"use client"

import Link from "next/link"

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <Link href="/admin" className="text-lg font-bold text-foreground">
          Survivor 50 Pool
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground">
            Eddie <span className="text-muted-foreground">(Commissioner)</span>
          </span>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Log out
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-[#F97316] px-4 py-2 text-white md:px-6">
        <span className="text-sm font-medium">🔥 Commissioner Dashboard</span>
      </div>
    </header>
  )
}

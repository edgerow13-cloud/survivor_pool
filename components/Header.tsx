'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, User, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useActiveSeason } from '@/hooks/use-active-season'
import { UserAvatar } from '@/components/UserAvatar'
import { BottomTabBar } from '@/components/BottomTabBar'

interface NavLink {
  href: string
  label: string
  shortLabel: string
}

const defaultNavLink: NavLink = { href: '/pool/picks', label: 'Picks Grid', shortLabel: 'Grid' }

export function Header({ navLink }: { navLink?: NavLink }) {
  const { name, logout } = useAuth()
  const pathname = usePathname()
  const season = useActiveSeason()
  const link = navLink ?? defaultNavLink

  const navItems = [
    { href: link.href, label: link.label, icon: Users },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/rules', label: 'Rules', icon: ScrollText },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3 max-w-6xl mx-auto">
          <Link href="/pool" className="flex items-center gap-2.5 shrink-0">
            <span className="ink-panel flex h-9 w-9 items-center justify-center rounded-xl">
              <span className="font-display text-base font-bold">O</span>
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="font-display text-lg font-bold text-foreground">Outlast</span>
              <span className="eyebrow">
                {season ? `Season ${season.seasonNumber}` : 'Private pool'}
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <UserAvatar name={name ?? ''} avatarUrl={null} size={32} className="hidden sm:inline-flex" />
            <span className="hidden sm:inline text-sm font-medium text-foreground">{name}</span>
            <button
              onClick={logout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <BottomTabBar />
    </>
  )
}

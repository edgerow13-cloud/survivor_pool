'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Calendar, Trophy, Mail } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/players', label: 'Players', icon: Users },
  { href: '/admin/weeks', label: 'Weeks & Results', icon: Calendar },
  { href: '/admin/contestants', label: 'Contestants & Tribes', icon: Trophy },
  { href: '/admin/email', label: 'Email', icon: Mail },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-card lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border p-4">
        <Link
          href="/pool"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-xs">👁</span>
          Player View
        </Link>
      </div>
    </aside>
  )
}

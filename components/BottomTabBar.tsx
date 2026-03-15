'use client'

import Link from 'next/link'
import { Vote, Grid3X3, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function BottomTabBar() {
  const pathname = usePathname()

  const tabs = [
    {
      href: '/pool',
      label: 'Pick',
      icon: Vote,
      isActive: pathname === '/pool',
    },
    {
      href: '/pool/picks',
      label: 'Grid',
      icon: Grid3X3,
      isActive: pathname === '/pool/picks',
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
      isActive: pathname.startsWith('/profile'),
    },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-gray-200 bg-white flex items-stretch">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
            style={{ color: tab.isActive ? '#F97316' : '#6B7280' }}
          >
            <Icon className="h-5 w-5" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

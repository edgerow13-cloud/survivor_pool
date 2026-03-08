'use client'

import Link from 'next/link'
import { Users, User, ScrollText } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface NavLink {
  href: string
  label: string
  shortLabel: string
}

const defaultNavLink: NavLink = { href: '/pool/picks', label: 'View Full Grid', shortLabel: 'Grid' }

export function Header({ navLink }: { navLink?: NavLink }) {
  const { name, logout } = useAuth()
  const link = navLink ?? defaultNavLink

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="h-1 bg-[#F97316]" />
      <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <Link href="/pool" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
          Survivor 50 Pool
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={link.href}
            className="flex items-center gap-1.5 text-sm font-medium text-[#F97316] hover:text-orange-600 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{link.label}</span>
            <span className="sm:hidden">{link.shortLabel}</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-sm font-medium text-[#F97316] hover:text-orange-600 transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
          <Link
            href="/rules"
            className="flex items-center gap-1.5 text-sm font-medium text-[#F97316] hover:text-orange-600 transition-colors"
          >
            <ScrollText className="w-4 h-4" />
            <span className="hidden sm:inline">Rules</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function Header() {
  const { name, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="h-1 bg-[#F97316]" />
      <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <Link href="/pool" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
          Survivor 50 Pool
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pool/picks"
            className="flex items-center gap-1.5 text-sm font-medium text-[#F97316] hover:text-orange-600 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">View Full Grid</span>
            <span className="sm:hidden">Grid</span>
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

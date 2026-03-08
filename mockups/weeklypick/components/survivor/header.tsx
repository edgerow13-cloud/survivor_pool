"use client"

import Link from "next/link"
import { Users } from "lucide-react"

interface HeaderProps {
  userName: string
  onLogout: () => void
}

export function Header({ userName, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="h-1 bg-[#F97316]" />
      <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Survivor 50 Pool</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/pool"
            className="flex items-center gap-1.5 text-sm font-medium text-[#F97316] hover:text-orange-600 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">View Full Pool</span>
            <span className="sm:hidden">Pool</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{userName}</span>
            <button
              onClick={onLogout}
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

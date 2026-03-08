"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users,
  Grid3X3,
  Trophy,
  Settings,
  BarChart3,
  Calendar,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/contestants", label: "Contestants & Tribes", icon: Users },
  { href: "/admin/picks", label: "Picks Grid", icon: Grid3X3 },
  { href: "/admin/weeks", label: "Weeks", icon: Calendar },
  { href: "/admin/standings", label: "Standings", icon: Trophy },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F97316]">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">Survivor Pool</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#F97316]/10 text-[#F97316]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

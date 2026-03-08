"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCircle,
  Mountain,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/weeks", label: "Weeks & Results", icon: Calendar },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/contestants", label: "Contestants", icon: UserCircle },
  { href: "/admin/tribes", label: "Tribes", icon: Mountain },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between bg-white border-b px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[#F97316] flex items-center justify-center">
            <Mountain className="size-5 text-white" />
          </div>
          <span className="font-semibold text-foreground">Survivor Pool</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform lg:relative lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Desktop header */}
          <div className="hidden lg:flex items-center gap-2 px-6 h-14 border-b">
            <div className="size-8 rounded-lg bg-[#F97316] flex items-center justify-center">
              <Mountain className="size-5 text-white" />
            </div>
            <span className="font-semibold text-foreground">Survivor Pool</span>
          </div>

          <nav className="p-4 space-y-1 mt-14 lg:mt-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#F97316]/10 text-[#F97316]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)]">
          {children}
        </main>
      </div>
    </div>
  )
}

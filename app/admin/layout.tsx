'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const mobileNavLinks = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/players', label: 'Players' },
  { href: '/admin/weeks', label: 'Weeks & Results' },
  { href: '/admin/contestants', label: 'Contestants & Tribes' },
  { href: '/admin/email', label: 'Email' },
]

function Spinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, role, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !userId) {
      router.push('/login')
    }
  }, [isLoading, userId, router])

  if (isLoading) return <Spinner />

  if (!userId) return null

  if (role !== 'commissioner') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
          <Link href="/pool" className="mt-4 inline-block text-sm text-primary hover:underline">
            Back to Pool
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />

      <div className="flex flex-1">
        {/* Mobile top nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex overflow-x-auto">
          {mobileNavLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-primary text-center whitespace-nowrap min-w-[80px]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <AdminSidebar />

        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background overflow-y-auto pb-16 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}

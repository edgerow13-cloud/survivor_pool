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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500">You don&apos;t have permission to view this page.</p>
          <Link href="/pool" className="mt-4 inline-block text-sm text-orange-500 hover:underline">
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
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex overflow-x-auto">
          {mobileNavLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 px-3 py-2 text-xs text-gray-600 hover:bg-orange-50 hover:text-orange-600 text-center whitespace-nowrap min-w-[80px]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <AdminSidebar />

        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-gray-50 overflow-y-auto pb-16 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}

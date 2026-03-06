import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'commissioner') {
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

  const navLinks = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/players', label: 'Players & Requests' },
    { href: '/admin/weeks', label: 'Weeks & Results' },
    { href: '/admin/contestants', label: 'Contestants' },
    { href: '/admin/tribes', label: 'Tribes' },
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile top nav */}
      <nav className="md:hidden bg-white border-b border-gray-200 flex overflow-x-auto shrink-0">
        <div className="px-4 py-3 border-r border-gray-200 shrink-0 flex items-center">
          <span className="font-bold text-orange-500">Admin</span>
        </div>
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 shrink-0 whitespace-nowrap"
          >
            {label}
          </Link>
        ))}
        <Link
          href="/pool"
          className="px-4 py-3 text-sm text-gray-400 hover:text-gray-600 shrink-0 whitespace-nowrap ml-auto"
        >
          ← Pool
        </Link>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 shrink-0">
        <div className="p-4 border-b border-gray-200">
          <span className="font-bold text-orange-500 text-lg">Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <Link href="/pool" className="block px-3 py-2 text-xs text-gray-400 hover:text-gray-600">
            Back to Pool
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-8 bg-gray-50 overflow-y-auto">{children}</main>
    </div>
  )
}

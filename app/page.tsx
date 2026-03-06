import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect('/pool')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8 text-center">
        <h1 className="text-3xl font-bold text-orange-500 mb-1">Survivor Pool</h1>
        <p className="text-sm text-gray-500 mb-6">Season 50 — All Stars</p>
        <p className="text-gray-600 text-sm mb-8">
          Pick one castaway each week. If they get voted out, you&apos;re eliminated.
          Last player standing wins.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="block w-full py-2.5 px-4 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors"
          >
            Log In
          </Link>
          <p className="text-xs text-gray-400">
            To join, ask the commissioner for an invite link.
          </p>
        </div>
      </div>
    </div>
  )
}

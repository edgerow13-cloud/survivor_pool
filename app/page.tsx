import Link from 'next/link'

export default function HomePage() {
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
          <Link
            href="/rules"
            className="block w-full py-2.5 px-4 rounded-lg border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Pool Rules
          </Link>
          <p className="text-xs text-gray-400">
            Contact Eddie to get access.
          </p>
        </div>
      </div>
    </div>
  )
}

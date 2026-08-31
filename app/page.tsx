import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const db = getAdminClient()
  const { data: season } = await db
    .from('seasons')
    .select('season_number')
    .eq('is_active', true)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-sm w-full max-w-sm p-8 text-center">
        <div className="flex flex-col items-center gap-3 mb-6">
          <span className="ink-panel flex h-12 w-12 items-center justify-center rounded-2xl">
            <span className="font-display text-lg font-bold">O</span>
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Outlast</h1>
            <p className="eyebrow mt-1">
              {season ? `Season ${season.season_number}` : 'Private pool'}
            </p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Pick one castaway each week. If they get voted out, you&apos;re eliminated.
          Last player standing wins.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="block w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/rules"
            className="block w-full py-2.5 px-4 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors"
          >
            Pool Rules
          </Link>
          <p className="text-xs text-muted-foreground">
            Contact Eddie to get access.
          </p>
        </div>
      </div>
    </div>
  )
}

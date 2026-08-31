import { getAdminClient } from '@/lib/supabase/admin'
import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const db = getAdminClient()
  const { data: season } = await db
    .from('seasons')
    .select('season_number')
    .eq('is_active', true)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-sm w-full max-w-sm p-8">
        <div className="flex flex-col items-center gap-3 mb-6">
          <span className="ink-panel flex h-12 w-12 items-center justify-center rounded-2xl">
            <span className="font-display text-lg font-bold">O</span>
          </span>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">Outlast</h1>
            <p className="eyebrow mt-1">
              {season ? `Season ${season.season_number}` : 'Private pool'}
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

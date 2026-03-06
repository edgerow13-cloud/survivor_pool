import { adminClient } from '@/lib/supabase/admin'

export default async function AdminOverviewPage() {
  const [
    { count: pendingCount },
    { data: weeks },
    { count: activeCount },
    { count: eliminatedCount },
    { count: remainingCount },
  ] = await Promise.all([
    adminClient
      .from('join_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    adminClient.from('weeks').select('*').order('week_number', { ascending: false }).limit(1),
    adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'eliminated'),
    adminClient
      .from('contestants')
      .select('*', { count: 'exact', head: true })
      .eq('is_eliminated', false),
  ])

  const currentWeek = weeks?.[0] ?? null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Pending Requests"
          value={pendingCount ?? 0}
          highlight={(pendingCount ?? 0) > 0}
        />
        <StatCard label="Active Players" value={activeCount ?? 0} />
        <StatCard label="Eliminated Players" value={eliminatedCount ?? 0} />
        <StatCard label="Remaining Contestants" value={remainingCount ?? 0} />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Current Week</h2>
        {currentWeek ? (
          <div className="space-y-1 text-sm text-gray-700">
            <div>
              <span className="font-medium">Week:</span> {currentWeek.week_number}
            </div>
            <div>
              <span className="font-medium">Episode Date:</span>{' '}
              {new Date(currentWeek.episode_date).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Status:</span>{' '}
              {currentWeek.is_results_entered ? (
                <span className="text-green-600 font-medium">Results Entered</span>
              ) : currentWeek.is_locked ? (
                <span className="text-orange-500 font-medium">Locked</span>
              ) : (
                <span className="text-gray-500">Open</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No weeks created yet.</p>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-5 ${highlight ? 'border-orange-400' : 'border-gray-200'}`}
    >
      <div className={`text-3xl font-bold ${highlight ? 'text-orange-500' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

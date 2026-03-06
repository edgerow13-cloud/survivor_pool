import { adminClient } from '@/lib/supabase/admin'
import WeekForm from './WeekForm'
import WeekRow from './WeekRow'

export default async function WeeksPage() {
  const [{ data: weeks }, { data: contestants }, { data: users }] = await Promise.all([
    adminClient.from('weeks').select('*').order('week_number', { ascending: true }),
    adminClient.from('contestants').select('*').order('name'),
    adminClient
      .from('users')
      .select('*')
      .in('status', ['active', 'eliminated'])
      .order('name'),
  ])

  const contestantMap = Object.fromEntries((contestants ?? []).map((c) => [c.id, c.name]))

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Weeks &amp; Results</h1>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Week</h2>
        <WeekForm />
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">All Weeks</h2>
        {weeks && weeks.length > 0 ? (
          <div className="space-y-3">
            {weeks.map((week) => (
              <WeekRow
                key={week.id}
                week={week}
                contestants={contestants ?? []}
                users={users ?? []}
                eliminatedContestantName={
                  week.eliminated_contestant_id
                    ? (contestantMap[week.eliminated_contestant_id] ?? null)
                    : null
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No weeks created yet.</p>
        )}
      </section>
    </div>
  )
}

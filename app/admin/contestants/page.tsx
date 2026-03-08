import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import TribeAssignmentRow from './TribeAssignmentRow'

export const dynamic = 'force-dynamic'

export default async function ContestantsPage() {
  const [{ data: contestants }, { data: tribes }, { data: tribeHistory }] = await Promise.all([
    getAdminClient().from('contestants').select('*').order('name'),
    getAdminClient().from('tribes').select('*').order('name'),
    getAdminClient().from('contestant_tribe_history').select('*'),
  ])

  // Find latest tribe assignment per contestant
  const latestTribeByContestant: Record<string, { tribe_id: string; week_number: number }> = {}
  for (const row of tribeHistory ?? []) {
    const existing = latestTribeByContestant[row.contestant_id]
    if (!existing || row.week_number > existing.week_number) {
      latestTribeByContestant[row.contestant_id] = {
        tribe_id: row.tribe_id,
        week_number: row.week_number,
      }
    }
  }

  const maxWeek = Math.max(
    1,
    ...Object.values(latestTribeByContestant).map((r) => r.week_number)
  )

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Contestants</h1>
      {(tribes ?? []).length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          No tribes defined yet.{' '}
          <Link href="/admin/tribes" className="underline hover:text-yellow-900">
            Create tribes first →
          </Link>
        </div>
      )}
      <section className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs border-b border-gray-200">
              <th className="pb-2 pr-4 font-medium">Name</th>
              <th className="pb-2 pr-4 font-medium">Current Tribe</th>
              <th className="pb-2 pr-4 font-medium">Set Tribe Assignment</th>
              <th className="pb-2 font-medium">Elimination</th>
            </tr>
          </thead>
          <tbody>
            {(contestants ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                  No contestants added yet.
                </td>
              </tr>
            ) : (
              (contestants ?? []).map((contestant) => {
                const assignment = latestTribeByContestant[contestant.id]
                return (
                  <TribeAssignmentRow
                    key={contestant.id}
                    contestant={contestant}
                    tribes={tribes ?? []}
                    currentTribeId={assignment?.tribe_id ?? null}
                    defaultWeek={maxWeek}
                  />
                )
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}

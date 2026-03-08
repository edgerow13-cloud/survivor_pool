import { getAdminClient } from '@/lib/supabase/admin'
import AddPlayerForm from './AddPlayerForm'

export const dynamic = 'force-dynamic'
import DeactivateButton from './DeactivateButton'
import ReinstateButton from './ReinstateButton'
import type { User } from '@/types/database'

export default async function PlayersPage() {
  const { data: users } = await getAdminClient()
    .from('users')
    .select('*')
    .order('status')
    .order('name')

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    eliminated: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Players</h1>

      {/* Add Player */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Player</h2>
        <AddPlayerForm />
      </section>

      {/* All Players */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">All Players</h2>
        {users && users.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-gray-200">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Elim. Week</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(users as User[]).map((user) => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="py-2 font-medium text-gray-900">{user.name}</td>
                  <td className="py-2 text-gray-600">{user.email}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[user.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-2">
                    {user.role === 'commissioner' && (
                      <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-orange-100 text-orange-700">
                        commissioner
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-gray-500">{user.eliminated_week ?? '—'}</td>
                  <td className="py-2">
                    {user.status === 'active' && user.role !== 'commissioner' && (
                      <DeactivateButton playerId={user.id} />
                    )}
                    {user.status === 'eliminated' && (
                      <ReinstateButton playerId={user.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">No players yet.</p>
        )}
      </section>
    </div>
  )
}

import { adminClient } from '@/lib/supabase/admin'
import ApproveRejectButtons from './ApproveRejectButtons'
import InviteLinkSection from './InviteLinkSection'
import ReinstateButton from './ReinstateButton'

export default async function PlayersPage() {
  const [{ data: joinRequests }, { data: users }, { data: inviteLinks }] = await Promise.all([
    adminClient
      .from('join_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    adminClient.from('users').select('*').order('status').order('name'),
    adminClient
      .from('invite_links')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    eliminated: 'bg-red-100 text-red-700',
    pending_approval: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Players &amp; Requests</h1>

      {/* Pending Join Requests */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Pending Requests
          {(joinRequests?.length ?? 0) > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full">
              {joinRequests!.length}
            </span>
          )}
        </h2>
        {joinRequests && joinRequests.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-gray-200">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Submitted</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {joinRequests.map((req) => (
                <tr key={req.id} className="border-b border-gray-100">
                  <td className="py-2 font-medium text-gray-900">{req.name}</td>
                  <td className="py-2 text-gray-600">{req.email}</td>
                  <td className="py-2 text-gray-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <ApproveRejectButtons joinRequestId={req.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">No pending requests.</p>
        )}
      </section>

      {/* Invite Links */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Invite Links</h2>
        <InviteLinkSection activeLinks={inviteLinks ?? []} appUrl={appUrl} />
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
                <th className="pb-2 font-medium">Eliminated Week</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
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
                  <td className="py-2 text-gray-500">{user.eliminated_week ?? '—'}</td>
                  <td className="py-2">
                    {user.status === 'eliminated' && <ReinstateButton userId={user.id} />}
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

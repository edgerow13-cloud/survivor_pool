import { adminClient } from '@/lib/supabase/admin'
import TribeForm from './TribeForm'

export default async function TribesPage() {
  const { data: tribes } = await adminClient
    .from('tribes')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Tribes</h1>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Tribe</h2>
        <TribeForm />
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">All Tribes</h2>
        {tribes && tribes.length > 0 ? (
          <div className="space-y-4">
            {tribes.map((tribe) => (
              <div key={tribe.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="w-5 h-5 rounded-full inline-block border border-gray-200 shrink-0"
                    style={{ backgroundColor: tribe.color }}
                  />
                  <span className="font-semibold text-gray-900">{tribe.name}</span>
                  {tribe.is_merged && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">
                      Merged
                    </span>
                  )}
                  <span className="text-xs text-gray-400 font-mono">{tribe.color}</span>
                </div>
                <TribeForm tribe={tribe} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No tribes yet.</p>
        )}
      </section>
    </div>
  )
}

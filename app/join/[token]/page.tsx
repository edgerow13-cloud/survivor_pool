import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import JoinForm from './JoinForm'

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Redirect already-logged-in users
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect('/pool')
  }

  // Validate invite token (requires service role — anon can't read invite_links)
  const { data: inviteLink } = await adminClient
    .from('invite_links')
    .select('id')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (!inviteLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-orange-500 mb-4">Survivor Pool</h1>
          <p className="text-gray-700 font-medium">This invite link is invalid or has expired.</p>
          <p className="text-gray-500 text-sm mt-2">Ask the commissioner for a new link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-center text-orange-500 mb-6">
          Join the Survivor Pool
        </h1>
        <JoinForm token={token} />
      </div>
    </div>
  )
}

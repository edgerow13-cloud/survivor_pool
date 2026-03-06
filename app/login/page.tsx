import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

const ERROR_MESSAGES: Record<string, string> = {
  link_expired: 'Your login link has expired. Please request a new one.',
  link_invalid: 'Your login link is invalid. Please request a new one.',
  missing_code: 'Something went wrong. Please try logging in again.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect('/pool')
  }

  const params = await searchParams
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-center text-orange-500 mb-6">
          Survivor Pool
        </h1>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{errorMessage}</p>
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  )
}

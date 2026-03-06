import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/login?error=link_expired', request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(new URL('/login?error=link_invalid', request.url))
  }

  const redirectTo = next && next.startsWith('/') ? next : '/pool'
  return NextResponse.redirect(new URL(redirectTo, request.url))
}

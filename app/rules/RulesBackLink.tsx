'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export function RulesBackLink() {
  const { userId, isLoading } = useAuth()
  if (isLoading) return null
  const href = userId ? '/pool/picks' : '/'
  return (
    <Link href={href} className="text-sm text-[#F97316] hover:text-orange-600 transition-colors mb-4 inline-block">
      ← Back
    </Link>
  )
}

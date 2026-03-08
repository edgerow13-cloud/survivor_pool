import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const userId = formData.get('userId') as string | null
  const file = formData.get('file') as File | null

  if (!userId || !file) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate user exists
  const db = getAdminClient()
  const { data: user } = await db.from('users').select('id').eq('id', userId).single()
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  // Server-side type validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG and PNG files are accepted' }, { status: 400 })
  }

  // Server-side size validation
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be 2 MB or smaller' }, { status: 400 })
  }

  // Use a fixed storage path per user so upsert replaces the previous file —
  // no orphaned objects, no need to track and delete the old path separately.
  const storagePath = userId

  const { error: uploadError } = await db.storage
    .from('avatars')
    .upload(storagePath, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = db.storage.from('avatars').getPublicUrl(storagePath)

  // Bust Supabase CDN cache by appending a timestamp query param
  const avatarUrl = `${publicUrl}?t=${Date.now()}`

  const { error: updateError } = await db
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ avatarUrl })
}

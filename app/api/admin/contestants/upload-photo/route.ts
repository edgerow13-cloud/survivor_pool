import { NextRequest, NextResponse } from 'next/server'
import { requireCommissioner } from '@/lib/require-commissioner'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const userId = formData.get('userId') as string | null
  const contestantId = formData.get('contestantId') as string | null
  const file = formData.get('file') as File | null

  if (!userId || !contestantId || !file) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const auth = await requireCommissioner(userId)
  if (auth instanceof NextResponse) return auth

  const supabase = getAdminClient()

  // Upload to storage — upsert so re-uploading the same filename replaces it
  const path = `${contestantId}/${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('contestant-photos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('contestant-photos')
    .getPublicUrl(path)

  // Update contestant row
  const { error: updateError } = await supabase
    .from('contestants')
    .update({ photo_url: publicUrl })
    .eq('id', contestantId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ photoUrl: publicUrl })
}

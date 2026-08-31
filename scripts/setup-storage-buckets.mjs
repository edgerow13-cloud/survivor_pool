// One-off / rerunnable setup script: (re)creates the Supabase Storage
// buckets this app depends on. Run with:
//   node --env-file=.env.local scripts/setup-storage-buckets.mjs
//
// Both buckets are only ever written to via the service-role admin client
// (see lib/supabase/admin.ts — app/api/profile/avatar and
// app/api/admin/contestants/upload-photo both use it), so no client-side
// RLS policies are needed for uploads. Each bucket just needs to exist and
// be public so getPublicUrl() results are viewable by every player's
// browser without a signed URL.

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.')
  console.error('Run with: node --env-file=.env.local scripts/setup-storage-buckets.mjs')
  process.exit(1)
}

const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const BUCKETS = [
  {
    // Player profile photos — app/api/profile/avatar/route.ts
    name: 'avatars',
    public: true,
    fileSizeLimit: '2MB',
    allowedMimeTypes: ['image/jpeg', 'image/png'],
  },
  {
    // Commissioner-uploaded cast photos — app/api/admin/contestants/upload-photo/route.ts
    name: 'contestant-photos',
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
]

const { data: buckets, error: listError } = await db.storage.listBuckets()
if (listError) {
  console.error('Failed to list buckets:', listError.message)
  process.exit(1)
}

for (const config of BUCKETS) {
  const { name, ...settings } = config
  const existing = buckets.find((b) => b.name === name)

  if (existing) {
    console.log(`Bucket "${name}" already exists (public: ${existing.public}). Updating settings...`)
    const { error } = await db.storage.updateBucket(name, settings)
    if (error) {
      console.error(`Failed to update bucket "${name}":`, error.message)
      process.exit(1)
    }
  } else {
    console.log(`Creating bucket "${name}"...`)
    const { error } = await db.storage.createBucket(name, settings)
    if (error) {
      console.error(`Failed to create bucket "${name}":`, error.message)
      process.exit(1)
    }
  }
  console.log(`✅ "${name}" is set up (public, ${settings.fileSizeLimit} limit, ${settings.allowedMimeTypes.join('/')}).`)
}

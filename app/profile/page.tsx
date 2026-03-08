'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Upload } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/Header'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ContestantOption {
  id: string
  name: string
  tribe: { id: string; name: string; color: string } | null
}

interface ProfileData {
  user: { id: string; name: string; avatar_url: string | null }
  contestants: ContestantOption[]
  winnerPick: { contestant_id: string } | null
  ep3Deadline: string | null
}

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function TribeDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  )
}

export default function ProfilePage() {
  const { userId, isLoading, updateName } = useAuth()
  const router = useRouter()

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  // Name form
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // Winner pick combobox
  const [selectedContestantId, setSelectedContestantId] = useState<string | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [pickSaving, setPickSaving] = useState(false)
  const [pickSuccess, setPickSuccess] = useState(false)
  const [pickError, setPickError] = useState<string | null>(null)

  // Avatar upload
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep ref in sync so blur handler always reads the latest selectedContestantId
  useEffect(() => {
    selectedIdRef.current = selectedContestantId
  }, [selectedContestantId])

  useEffect(() => {
    if (isLoading) return
    if (!userId) {
      router.push('/login')
      return
    }

    setFetching(true)
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then((res) => res.json() as Promise<ProfileData & { error?: string }>)
      .then((json) => {
        if (json.error) {
          setFetchError(json.error)
        } else {
          setProfileData(json)
          setNameInput(json.user.name)
          setAvatarUrl(json.user.avatar_url)
          const existingId = json.winnerPick?.contestant_id ?? null
          setSelectedContestantId(existingId)
          selectedIdRef.current = existingId
          if (existingId) {
            const c = json.contestants.find((c) => c.id === existingId)
            setInputValue(c?.name ?? '')
          }
        }
      })
      .catch(() => setFetchError('Failed to load profile data.'))
      .finally(() => setFetching(false))
  }, [isLoading, userId, router])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    // Client-side pre-validation (server also validates)
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setAvatarError('Only JPEG and PNG files are accepted')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('File must be 2 MB or smaller')
      return
    }

    setAvatarError(null)
    setAvatarUploading(true)
    try {
      const form = new FormData()
      form.append('userId', userId)
      form.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      const json = await res.json() as { avatarUrl?: string; error?: string }
      if (!res.ok) {
        setAvatarError(json.error ?? 'Upload failed')
      } else if (json.avatarUrl) {
        setAvatarUrl(json.avatarUrl)
      }
    } catch {
      setAvatarError('Network error')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function saveName() {
    if (!userId || !nameInput.trim()) return
    setNameSaving(true)
    setNameSuccess(false)
    setNameError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: nameInput }),
      })
      const json = await res.json() as { ok?: boolean; error?: string; name?: string }
      if (!res.ok) {
        setNameError(json.error ?? 'Failed to save name')
      } else {
        setNameSuccess(true)
        if (json.name) updateName(json.name)
        setTimeout(() => setNameSuccess(false), 3000)
      }
    } catch {
      setNameError('Network error')
    } finally {
      setNameSaving(false)
    }
  }

  async function saveWinnerPick() {
    if (!userId || !selectedContestantId) return
    setPickSaving(true)
    setPickSuccess(false)
    setPickError(null)
    try {
      const res = await fetch('/api/winner-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, contestantId: selectedContestantId }),
      })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) {
        setPickError(json.error ?? 'Failed to save pick')
      } else {
        setPickSuccess(true)
        setTimeout(() => setPickSuccess(false), 3000)
      }
    } catch {
      setPickError('Network error')
    } finally {
      setPickSaving(false)
    }
  }

  if (isLoading || fetching) return <Spinner />

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-red-600 text-sm">{fetchError}</p>
      </div>
    )
  }

  if (!profileData) return null

  const { contestants, ep3Deadline } = profileData
  const isPickLocked = ep3Deadline !== null && new Date() >= new Date(ep3Deadline)

  const filtered = contestants.filter((c) =>
    c.name.toLowerCase().includes(inputValue.toLowerCase())
  )

  const selectedContestant = contestants.find((c) => c.id === selectedContestantId) ?? null

  function handleComboFocus() {
    setInputValue('')
    setIsDropdownOpen(true)
  }

  function handleComboBlur() {
    setTimeout(() => {
      setIsDropdownOpen(false)
      // Revert the input to whatever is currently selected (using ref for latest value)
      const sel = contestants.find((c) => c.id === selectedIdRef.current)
      setInputValue(sel?.name ?? '')
    }, 150)
  }

  function handleComboChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
    setIsDropdownOpen(true)
  }

  function selectContestant(c: ContestantOption) {
    setSelectedContestantId(c.id)
    selectedIdRef.current = c.id
    setInputValue(c.name)
    setIsDropdownOpen(false)
    setPickSuccess(false)
    setPickError(null)
  }

  const deadlineLabel = ep3Deadline
    ? new Date(ep3Deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>

          {/* ── Avatar ────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>
                Shown next to your name in the picks grid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-5">
                <UserAvatar name={nameInput} avatarUrl={avatarUrl} size={72} />
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={avatarUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {avatarUploading ? 'Uploading…' : 'Upload photo'}
                  </Button>
                  <p className="text-xs text-muted-foreground">JPEG or PNG · max 2 MB</p>
                  {avatarError && <p className="text-xs text-red-600">{avatarError}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Display name ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Display Name</CardTitle>
              <CardDescription>
                This is the name shown to other pool participants.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Name</Label>
                <Input
                  id="display-name"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value)
                    setNameSuccess(false)
                    setNameError(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  placeholder="Your display name"
                  maxLength={64}
                />
              </div>
              {nameError && <p className="text-sm text-red-600">{nameError}</p>}
              {nameSuccess && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Name updated
                </p>
              )}
              <Button
                onClick={saveName}
                disabled={nameSaving || !nameInput.trim()}
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white disabled:opacity-50"
              >
                {nameSaving ? 'Saving…' : 'Save Name'}
              </Button>
            </CardContent>
          </Card>

          {/* ── Season winner prediction ───────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Season Winner Prediction</CardTitle>
              <CardDescription>
                {isPickLocked
                  ? 'The pick window has closed. Your prediction is locked in.'
                  : deadlineLabel
                    ? `Pick who you think will win Survivor 50. Locks when Episode 3 airs on ${deadlineLabel}.`
                    : 'Pick who you think will win Survivor 50.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPickLocked ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200">
                  {selectedContestant?.tribe && (
                    <TribeDot color={selectedContestant.tribe.color} />
                  )}
                  <span className="text-sm font-medium text-gray-800">
                    {selectedContestant?.name ?? 'No prediction made'}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Contestant</Label>
                  <div className="relative">
                    <Input
                      value={inputValue}
                      onChange={handleComboChange}
                      onFocus={handleComboFocus}
                      onBlur={handleComboBlur}
                      placeholder="Search contestants…"
                      className="pr-8"
                    />
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    {isDropdownOpen && filtered.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
                        {filtered.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-orange-50 hover:text-orange-900 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault() // prevent blur firing before click registers
                              selectContestant(c)
                            }}
                          >
                            {c.tribe && <TribeDot color={c.tribe.color} />}
                            <span className="flex-1">{c.name}</span>
                            {c.id === selectedContestantId && (
                              <Check className="w-4 h-4 text-green-600 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedContestant && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                      <span>Selected:</span>
                      {selectedContestant.tribe && (
                        <TribeDot color={selectedContestant.tribe.color} />
                      )}
                      <span className="font-medium">{selectedContestant.name}</span>
                    </p>
                  )}
                </div>
              )}

              {pickError && <p className="text-sm text-red-600">{pickError}</p>}
              {pickSuccess && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Pick saved!
                </p>
              )}

              {!isPickLocked && (
                <Button
                  onClick={saveWinnerPick}
                  disabled={pickSaving || !selectedContestantId}
                  className="bg-[#F97316] hover:bg-[#F97316]/90 text-white disabled:opacity-50"
                >
                  {pickSaving ? 'Saving…' : 'Save Pick'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export interface ContestantForRoster {
  id: string
  name: string
  is_eliminated: boolean
  eliminated_week: number | null
  photo_url: string | null
  tribe: { id: string; name: string; color: string } | null
}

interface Props {
  contestants: ContestantForRoster[]
  selectedContestants: Set<string>
  userId: string
  onContestantToggle: (id: string) => void
}

export function ContestantRosterTable({
  contestants,
  selectedContestants,
  userId,
  onContestantToggle,
}: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Photo upload dialog state
  const [photoTarget, setPhotoTarget] = useState<ContestantForRoster | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const active = contestants.filter((c) => !c.is_eliminated)
  const eliminated = contestants.filter((c) => c.is_eliminated)

  async function reinstate(id: string) {
    setLoadingId(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/update-contestant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contestant_id: id,
          is_eliminated: false,
          eliminated_week: null,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoadingId(null)
    }
  }

  function openPhotoDialog(contestant: ContestantForRoster) {
    setPhotoTarget(contestant)
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function closePhotoDialog() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPhotoTarget(null)
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadError(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
    setUploadError(null)
  }

  async function handleUpload() {
    if (!photoTarget || !selectedFile || !userId) return
    setUploadLoading(true)
    setUploadError(null)
    try {
      const form = new FormData()
      form.append('userId', userId)
      form.append('contestantId', photoTarget.id)
      form.append('file', selectedFile)

      const res = await fetch('/api/admin/contestants/upload-photo', {
        method: 'POST',
        body: form,
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setUploadError(data.error ?? 'Upload failed.')
      } else {
        closePhotoDialog()
        router.refresh()
      }
    } catch {
      setUploadError('Network error.')
    } finally {
      setUploadLoading(false)
    }
  }

  function ContestantRow({ c, isElim }: { c: ContestantForRoster; isElim: boolean }) {
    return (
      <TableRow key={c.id} className={isElim ? 'bg-red-50/50 hover:bg-red-50' : undefined}>
        <TableCell>
          {isElim ? (
            <Checkbox disabled />
          ) : (
            <Checkbox
              checked={selectedContestants.has(c.id)}
              onCheckedChange={() => onContestantToggle(c.id)}
            />
          )}
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {/* Photo thumbnail */}
            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
              {c.photo_url ? (
                <Image
                  src={c.photo_url}
                  alt={c.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
            </div>
            <span className={isElim ? 'line-through text-gray-500' : undefined}>{c.name}</span>
          </div>
        </TableCell>
        <TableCell>
          {c.tribe ? (
            <Badge
              variant="outline"
              className={`gap-1.5 ${isElim ? 'opacity-60' : ''}`}
              style={{ borderColor: c.tribe.color, color: c.tribe.color }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.tribe.color }} />
              {c.tribe.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </TableCell>
        <TableCell>
          {isElim ? (
            <Badge className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white">Eliminated</Badge>
          ) : (
            <Badge className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white">Active</Badge>
          )}
        </TableCell>
        <TableCell className={isElim ? 'text-gray-600' : 'text-muted-foreground'}>
          {c.eliminated_week ? `Week ${c.eliminated_week}` : '—'}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPhotoDialog(c)}
              className="gap-1.5 text-gray-600"
            >
              <Camera className="w-3.5 h-3.5" />
              Photo
            </Button>
            {isElim && (
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === c.id}
                className="text-gray-600"
                onClick={() => reinstate(c.id)}
              >
                {loadingId === c.id ? '…' : 'Reinstate'}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contestant Roster</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && <p className="text-sm text-red-600 px-6 pb-2">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]" />
                <TableHead>Name</TableHead>
                <TableHead>Current Tribe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eliminated Week</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.map((c) => (
                <ContestantRow key={c.id} c={c} isElim={false} />
              ))}

              <TableRow className="bg-gray-100 hover:bg-gray-100">
                <TableCell colSpan={6} className="py-2 text-center">
                  <span className="text-sm font-medium text-gray-600">
                    Eliminated from Show ({eliminated.length})
                  </span>
                </TableCell>
              </TableRow>

              {eliminated.map((c) => (
                <ContestantRow key={c.id} c={c} isElim={true} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Photo upload dialog */}
      <Dialog open={photoTarget !== null} onOpenChange={(open) => !open && closePhotoDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Upload photo for {photoTarget?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current photo */}
            {photoTarget?.photo_url && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Current photo</Label>
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                  <Image
                    src={photoTarget.photo_url}
                    alt={photoTarget.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Preview</Label>
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* File input */}
            <div className="space-y-1.5">
              <Label htmlFor="photo-file">Select image</Label>
              <input
                ref={fileInputRef}
                id="photo-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50"
              />
            </div>

            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePhotoDialog} disabled={uploadLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadLoading}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white disabled:opacity-50"
            >
              {uploadLoading ? 'Uploading…' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

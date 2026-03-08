'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function AddTribeModal({ open, onOpenChange, userId }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366F1')
  const [isMerged, setIsMerged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/create-tribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: name.trim(), color, is_merged: isMerged }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to create tribe')
      } else {
        setName('')
        setColor('#6366F1')
        setIsMerged(false)
        onOpenChange(false)
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tribe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-tribe-name">Tribe Name</Label>
            <Input
              id="new-tribe-name"
              placeholder="Enter tribe name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tribe Color</Label>
            <div className="flex gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-md border border-input"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#000000"
                className="flex-1 font-mono"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-tribe-merged">This is the merged tribe</Label>
              <Switch id="new-tribe-merged" checked={isMerged} onCheckedChange={setIsMerged} />
            </div>
            {isMerged && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                All remaining contestants will need their tribe assignments updated on this page after creating.
              </p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="bg-[#F97316] hover:bg-[#F97316]/90 text-white disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Tribe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

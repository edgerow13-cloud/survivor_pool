'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Crown } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Tribe } from '@/types/database'

interface Props {
  tribe: Tribe
  members: string[]
}

export function TribeCard({ tribe, members }: Props) {
  const { userId } = useAuth()
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState(tribe.name)
  const [editColor, setEditColor] = useState(tribe.color)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/update-tribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tribe_id: tribe.id, name: editName, color: editColor, is_merged: tribe.is_merged }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to save')
      } else {
        setIsEditOpen(false)
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="min-w-[240px] flex-shrink-0 py-0 overflow-hidden">
        <div className="h-1" style={{ backgroundColor: tribe.color }} />
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: tribe.color }}
            />
            <span className="font-bold text-lg text-gray-900">{tribe.name}</span>
            {tribe.is_merged && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1">
                <Crown className="h-3 w-3" />
                Merged
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="w-fit mt-1 text-gray-600 bg-gray-100">
            {members.length} members
          </Badge>
        </CardHeader>
        <CardContent className="py-2">
          <ScrollArea className="h-[120px] pr-3">
            <div className="space-y-1">
              {members.map((member) => (
                <div key={member} className="text-sm text-gray-600">
                  {member}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-2 pb-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditName(tribe.name); setEditColor(tribe.color); setError(null); setIsEditOpen(true) }}>
            Rename
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setEditName(tribe.name); setEditColor(tribe.color); setError(null); setIsEditOpen(true) }}>
            Edit Color
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tribe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tribe-edit-name">Name</Label>
              <Input
                id="tribe-edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-md border border-input"
                />
                <Input
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={loading || !editName.trim()}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

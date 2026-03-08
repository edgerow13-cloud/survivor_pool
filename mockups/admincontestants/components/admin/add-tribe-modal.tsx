"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface AddTribeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTribe?: (tribe: { name: string; color: string; isMerged: boolean }) => void
}

export function AddTribeModal({ open, onOpenChange, onCreateTribe }: AddTribeModalProps) {
  const [tribeName, setTribeName] = useState("")
  const [tribeColor, setTribeColor] = useState("#6366F1")
  const [isMerged, setIsMerged] = useState(false)

  const handleCreate = () => {
    onCreateTribe?.({ name: tribeName, color: tribeColor, isMerged })
    setTribeName("")
    setTribeColor("#6366F1")
    setIsMerged(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tribe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tribeName">Tribe Name</Label>
            <Input
              id="tribeName"
              placeholder="Enter tribe name"
              value={tribeName}
              onChange={(e) => setTribeName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tribe Color</Label>
            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={tribeColor}
                  onChange={(e) => setTribeColor(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-md border border-input"
                />
              </div>
              <Input
                value={tribeColor}
                onChange={(e) => setTribeColor(e.target.value)}
                placeholder="#000000"
                className="flex-1 font-mono"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="merged">This is the merged tribe</Label>
              <Switch
                id="merged"
                checked={isMerged}
                onCheckedChange={setIsMerged}
              />
            </div>
            {isMerged && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                All remaining contestants will need their tribe assignments updated on this page after creating.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!tribeName.trim()}
            className="bg-[#F97316] hover:bg-[#F97316]/90"
          >
            Create Tribe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

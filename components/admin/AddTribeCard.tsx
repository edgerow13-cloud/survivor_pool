'use client'

import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Props {
  onClick: () => void
}

export function AddTribeCard({ onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className="min-w-[240px] flex-shrink-0 border-dashed border-2 cursor-pointer hover:border-muted-foreground/40 hover:bg-muted transition-colors flex items-center justify-center min-h-[280px]"
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <div className="h-12 w-12 rounded-full border-2 border-dashed border-input flex items-center justify-center">
          <Plus className="h-6 w-6" />
        </div>
        <span className="text-sm font-medium">Create tribe</span>
      </div>
    </Card>
  )
}

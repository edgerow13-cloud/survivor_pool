"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Crown } from "lucide-react"

interface TribeCardProps {
  name: string
  color: string
  members: string[]
  isMerged?: boolean
  onRename?: () => void
  onEditColor?: () => void
}

export function TribeCard({
  name,
  color,
  members,
  isMerged = false,
  onRename,
  onEditColor,
}: TribeCardProps) {
  return (
    <Card className="min-w-[240px] flex-shrink-0 py-0 overflow-hidden">
      <div className="h-1" style={{ backgroundColor: color }} />
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="font-bold text-lg text-gray-900">{name}</span>
          {isMerged && (
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
        <Button variant="outline" size="sm" onClick={onRename}>
          Rename
        </Button>
        <Button variant="outline" size="sm" onClick={onEditColor}>
          Edit Color
        </Button>
      </CardFooter>
    </Card>
  )
}

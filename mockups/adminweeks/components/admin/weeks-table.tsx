"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { X, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface Week {
  id: string
  weekNumber: number
  episodeDate: Date
  status: "complete" | "in_progress" | "upcoming"
  eliminated: string[]
  picksSubmitted: number | null
  totalActivePlayers: number | null
  isPrePool: boolean
}

interface Contestant {
  id: string
  name: string
  is_eliminated: boolean
}

interface WeeksTableProps {
  weeks: Week[]
  contestants: Contestant[]
  currentWeekId: string | undefined
  onEditEliminations: (weekId: string, eliminations: string[]) => void
}

export function WeeksTable({
  weeks,
  contestants,
  currentWeekId,
  onEditEliminations,
}: WeeksTableProps) {
  const [editingWeek, setEditingWeek] = useState<Week | null>(null)
  const [editEliminations, setEditEliminations] = useState<string[]>([])
  const [selectedContestant, setSelectedContestant] = useState<string>("")
  const [editDateWeek, setEditDateWeek] = useState<Week | null>(null)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleOpenEditEliminations = (week: Week) => {
    setEditingWeek(week)
    setEditEliminations([...week.eliminated])
    setSelectedContestant("")
  }

  const handleRemoveElimination = (name: string) => {
    setEditEliminations((prev) => prev.filter((n) => n !== name))
  }

  const handleAddElimination = () => {
    if (selectedContestant && !editEliminations.includes(selectedContestant)) {
      setEditEliminations((prev) => [...prev, selectedContestant])
      setSelectedContestant("")
    }
  }

  const handleSaveEliminations = () => {
    if (editingWeek) {
      onEditEliminations(editingWeek.id, editEliminations)
      setEditingWeek(null)
    }
  }

  // Get contestants available for adding to eliminations
  // For pre-pool weeks, show eliminated contestants + active contestants not already in the list
  const getAvailableContestantsForEdit = () => {
    const allContestants = contestants.sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    return allContestants.filter((c) => !editEliminations.includes(c.name))
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Weeks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Episode Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eliminated</TableHead>
                <TableHead>Picks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map((week) => (
                <TableRow
                  key={week.id}
                  className={cn(
                    week.status === "in_progress" && "bg-orange-50"
                  )}
                >
                  <TableCell
                    className={cn(
                      "font-medium",
                      week.status === "in_progress" && "font-bold",
                      week.status === "upcoming" && "text-gray-400"
                    )}
                  >
                    Week {week.weekNumber}
                  </TableCell>
                  <TableCell
                    className={cn(
                      week.status === "upcoming" && "text-gray-400"
                    )}
                  >
                    {formatDate(week.episodeDate)}
                  </TableCell>
                  <TableCell>
                    {week.status === "complete" && (
                      <Badge className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white border-0">
                        Complete
                      </Badge>
                    )}
                    {week.status === "in_progress" && (
                      <Badge className="bg-[#F97316] hover:bg-[#F97316]/90 text-white border-0">
                        In Progress
                      </Badge>
                    )}
                    {week.status === "upcoming" && (
                      <Badge variant="secondary" className="text-gray-500">
                        Upcoming
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      week.status === "upcoming" && "text-gray-400"
                    )}
                  >
                    {week.eliminated.length > 0
                      ? week.eliminated.join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {week.isPrePool ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-gray-400 inline-flex items-center gap-1 cursor-help">
                            (pre-pool)
                            <Info className="size-3" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Pool started Week 3 — no picks collected for this week
                        </TooltipContent>
                      </Tooltip>
                    ) : week.status === "in_progress" ? (
                      `${week.picksSubmitted}/${week.totalActivePlayers}`
                    ) : week.status === "upcoming" ? (
                      "—"
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {week.id === currentWeekId ? (
                      <span className="text-muted-foreground text-sm">
                        (managed above)
                      </span>
                    ) : week.isPrePool ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditEliminations(week)}
                      >
                        Edit Eliminations
                      </Button>
                    ) : week.status === "upcoming" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditDateWeek(week)}
                      >
                        Edit Date
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Eliminations Dialog */}
      <Dialog
        open={editingWeek !== null}
        onOpenChange={(open) => !open && setEditingWeek(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Week {editingWeek?.weekNumber} Eliminations
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current eliminations */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Current Eliminations
              </p>
              {editEliminations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No eliminations recorded
                </p>
              ) : (
                <div className="space-y-2">
                  {editEliminations.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm">{name}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveElimination(name)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-4" />
                        <span className="sr-only">Remove {name}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add elimination */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Add eliminated contestant
              </p>
              <div className="flex gap-2">
                <Select
                  value={selectedContestant}
                  onValueChange={setSelectedContestant}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select contestant" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableContestantsForEdit().map((contestant) => (
                      <SelectItem key={contestant.id} value={contestant.name}>
                        {contestant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddElimination}
                  disabled={!selectedContestant}
                  className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWeek(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEliminations}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Date Dialog */}
      <Dialog
        open={editDateWeek !== null}
        onOpenChange={(open) => !open && setEditDateWeek(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Week {editDateWeek?.weekNumber} Date</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Date editing functionality would go here with a date/time picker.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDateWeek(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

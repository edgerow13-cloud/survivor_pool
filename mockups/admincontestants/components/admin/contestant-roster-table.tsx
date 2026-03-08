"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Contestant {
  id: string
  name: string
  tribe: string
  status: "active" | "eliminated"
  eliminatedWeek?: number
  notes?: string
}

interface Tribe {
  name: string
  color: string
}

interface ContestantRosterTableProps {
  contestants: Contestant[]
  tribes: Tribe[]
  selectedContestants: Set<string>
  onContestantToggle: (contestantId: string) => void
  onMarkEliminated?: (contestantId: string) => void
  onReinstate?: (contestantId: string) => void
}

export function ContestantRosterTable({
  contestants,
  tribes,
  selectedContestants,
  onContestantToggle,
  onMarkEliminated,
  onReinstate,
}: ContestantRosterTableProps) {
  const getTribeColor = (tribeName: string) => {
    return tribes.find((t) => t.name === tribeName)?.color || "#6B7280"
  }

  const activeContestants = contestants.filter((c) => c.status === "active")
  const eliminatedContestants = contestants.filter((c) => c.status === "eliminated")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contestant Roster</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Current Tribe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Eliminated Week</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Active Contestants */}
            {activeContestants.map((contestant) => (
              <TableRow key={contestant.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedContestants.has(contestant.id)}
                    onCheckedChange={() => onContestantToggle(contestant.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{contestant.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="gap-1.5"
                    style={{
                      borderColor: getTribeColor(contestant.tribe),
                      color: getTribeColor(contestant.tribe),
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: getTribeColor(contestant.tribe) }}
                    />
                    {contestant.tribe}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-[#16A34A] hover:bg-[#16A34A]/90">
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-400">—</TableCell>
                <TableCell className="text-gray-400">—</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[#DC2626] border-[#DC2626] hover:bg-[#DC2626]/10"
                    onClick={() => onMarkEliminated?.(contestant.id)}
                  >
                    Mark Eliminated
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {/* Divider Row */}
            <TableRow className="bg-gray-100 hover:bg-gray-100">
              <TableCell colSpan={7} className="py-2 text-center">
                <span className="text-sm font-medium text-gray-600">
                  Eliminated from Show ({eliminatedContestants.length})
                </span>
              </TableCell>
            </TableRow>

            {/* Eliminated Contestants */}
            {eliminatedContestants.map((contestant) => (
              <TableRow
                key={contestant.id}
                className="bg-red-50/50 hover:bg-red-50"
              >
                <TableCell>
                  <Checkbox disabled />
                </TableCell>
                <TableCell className="font-medium">
                  <span className="line-through text-gray-500">
                    {contestant.name}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="gap-1.5 opacity-60"
                    style={{
                      borderColor: getTribeColor(contestant.tribe),
                      color: getTribeColor(contestant.tribe),
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: getTribeColor(contestant.tribe) }}
                    />
                    {contestant.tribe}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-[#DC2626] hover:bg-[#DC2626]/90">
                    Eliminated
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  Week {contestant.eliminatedWeek}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {contestant.notes || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-600"
                    onClick={() => onReinstate?.(contestant.id)}
                  >
                    Reinstate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

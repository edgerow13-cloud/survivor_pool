"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Player } from "@/app/admin/players/page"
import { cn } from "@/lib/utils"

interface PlayerTableProps {
  players: Player[]
}

function StatusBadge({ status }: { status: Player["status"] }) {
  if (status === "active") {
    return (
      <Badge className="bg-[#16A34A] text-white hover:bg-[#16A34A]">
        Active
      </Badge>
    )
  }
  if (status === "eliminated") {
    return (
      <Badge className="bg-[#DC2626] text-white hover:bg-[#DC2626]">
        Eliminated
      </Badge>
    )
  }
  return (
    <Badge className="bg-gray-400 text-white hover:bg-gray-400">
      Inactive
    </Badge>
  )
}

function RoleBadge({ role }: { role: Player["role"] }) {
  if (role === "commissioner") {
    return (
      <Badge className="bg-[#F97316] text-white hover:bg-[#F97316]">
        Commissioner
      </Badge>
    )
  }
  return <span className="text-sm text-gray-600">Player</span>
}

export function PlayerTable({ players }: PlayerTableProps) {
  return (
    <Card className="bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Player List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-gray-700">Name</TableHead>
              <TableHead className="text-gray-700">Email</TableHead>
              <TableHead className="text-gray-700">Status</TableHead>
              <TableHead className="text-gray-700">Role</TableHead>
              <TableHead className="text-gray-700">Eliminated Week</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow
                key={player.id}
                className={cn(
                  "hover:bg-gray-50",
                  player.status === "eliminated" && "bg-red-50 hover:bg-red-100"
                )}
              >
                <TableCell className="font-medium text-gray-900">{player.name}</TableCell>
                <TableCell className="text-gray-600">{player.email}</TableCell>
                <TableCell>
                  <StatusBadge status={player.status} />
                </TableCell>
                <TableCell>
                  <RoleBadge role={player.role} />
                </TableCell>
                <TableCell className="text-gray-600">
                  {player.eliminatedWeek ? `Week ${player.eliminatedWeek}` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

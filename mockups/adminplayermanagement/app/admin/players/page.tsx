"use client"

import { useState } from "react"
import { AddPlayerCard } from "@/components/admin/add-player-card"
import { PlayerTable } from "@/components/admin/player-table"
import { CommissionerOverridesCard } from "@/components/admin/commissioner-overrides-card"

export interface Player {
  id: string
  name: string
  email: string
  status: "active" | "eliminated" | "inactive"
  role: "commissioner" | "player"
  eliminatedWeek: number | null
}

const initialPlayers: Player[] = [
  { id: "1", name: "Eddie", email: "eddie@email.com", status: "active", role: "commissioner", eliminatedWeek: null },
  { id: "2", name: "Sarah", email: "sarah@email.com", status: "active", role: "player", eliminatedWeek: null },
  { id: "3", name: "Marcus", email: "marcus@email.com", status: "active", role: "player", eliminatedWeek: null },
  { id: "4", name: "Jill", email: "jill@email.com", status: "active", role: "player", eliminatedWeek: null },
  { id: "5", name: "Tom", email: "tom@email.com", status: "eliminated", role: "player", eliminatedWeek: 1 },
  { id: "6", name: "Priya", email: "priya@email.com", status: "active", role: "player", eliminatedWeek: null },
  { id: "7", name: "Devon", email: "devon@email.com", status: "active", role: "player", eliminatedWeek: null },
  { id: "8", name: "Cam", email: "cam@email.com", status: "active", role: "player", eliminatedWeek: null },
]

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)

  const activeCount = players.filter((p) => p.status === "active").length
  const eliminatedCount = players.filter((p) => p.status === "eliminated").length

  const handleAddPlayer = (name: string, email: string) => {
    const newPlayer: Player = {
      id: String(players.length + 1),
      name,
      email,
      status: "active",
      role: "player",
      eliminatedWeek: null,
    }
    setPlayers([...players, newPlayer])
  }

  const activePlayers = players.filter((p) => p.status === "active")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Player Management</h1>
        <p className="text-sm text-gray-500">
          {players.length} players total — {activeCount} active, {eliminatedCount} eliminated
        </p>
      </div>

      <AddPlayerCard onAddPlayer={handleAddPlayer} />
      <PlayerTable players={players} />
      <CommissionerOverridesCard activePlayers={activePlayers} />
    </div>
  )
}

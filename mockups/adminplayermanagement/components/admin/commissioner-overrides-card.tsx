"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle } from "lucide-react"
import type { Player } from "@/app/admin/players/page"

interface CommissionerOverridesCardProps {
  activePlayers: Player[]
}

const weeks = Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`)

const contestants = [
  "Andy",
  "Teeny",
  "Sam",
  "Rachel",
  "Genevieve",
  "Caroline",
  "Sue",
  "Kyle",
]

export function CommissionerOverridesCard({ activePlayers }: CommissionerOverridesCardProps) {
  const [setPickPlayer, setSetPickPlayer] = useState("")
  const [setPickWeek, setSetPickWeek] = useState("")
  const [setPickContestant, setSetPickContestant] = useState("")

  const handleSetPick = () => {
    if (setPickPlayer && setPickWeek && setPickContestant) {
      console.log("Setting pick:", { setPickPlayer, setPickWeek, setPickContestant })
      setSetPickPlayer("")
      setSetPickWeek("")
      setSetPickContestant("")
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Commissioner Overrides
        </CardTitle>
        <CardDescription className="text-gray-500">
          {"Manually set or reset a player's pick for any week"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Set Pick Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Player</label>
            <Select value={setPickPlayer} onValueChange={setSetPickPlayer}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {activePlayers.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Week</label>
            <Select value={setPickWeek} onValueChange={setSetPickWeek}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((week) => (
                  <SelectItem key={week} value={week}>
                    {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Contestant</label>
            <Select value={setPickContestant} onValueChange={setSetPickContestant}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select contestant" />
              </SelectTrigger>
              <SelectContent>
                {contestants.map((contestant) => (
                  <SelectItem key={contestant} value={contestant}>
                    {contestant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSetPick}
            className="bg-[#F97316] text-white hover:bg-[#EA580C]"
            disabled={!setPickPlayer || !setPickWeek || !setPickContestant}
          >
            Set Pick
          </Button>
        </div>

        {/* Warning Text */}
        <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-700">
            {"Overridden picks are flagged in the picks grid with a \u2699\uFE0F icon"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

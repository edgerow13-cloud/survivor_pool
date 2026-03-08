"use client"

import { Lock, Check, X, User } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Full cast of Survivor 50 contestants
const allContestants: { name: string; tribe: TribeName }[] = [
  // Cila tribe (orange)
  { name: "Ozzy Lusth", tribe: "Cila" },
  { name: "Rick Devens", tribe: "Cila" },
  { name: "Cirie Fields", tribe: "Cila" },
  { name: "Emily Flippen", tribe: "Cila" },
  { name: "Jenna Lewis-Dougherty", tribe: "Cila" },
  { name: "David Voce", tribe: "Cila" },
  // Vatu tribe (magenta)
  { name: "Colby Donaldson", tribe: "Vatu" },
  { name: "Q Burdette", tribe: "Vatu" },
  { name: "Angelina Keeley", tribe: "Vatu" },
  { name: "Aubry Bracco", tribe: "Vatu" },
  { name: "Savannah Lynne", tribe: "Vatu" },
  { name: "Tai Trang", tribe: "Vatu" },
  // Kalo tribe (green)
  { name: "Charlie Davis", tribe: "Kalo" },
  { name: "Dee Valladares", tribe: "Kalo" },
  { name: "Mike White", tribe: "Kalo" },
  { name: "Jonathan Young", tribe: "Kalo" },
  { name: "Chrissy Hofbeck", tribe: "Kalo" },
  { name: "Tiffany Ervin", tribe: "Kalo" },
]

// Tribe colors
const tribeColors = {
  Cila: "#F97316", // orange
  Vatu: "#BE185D", // magenta
  Kalo: "#16A34A", // green
}

type TribeName = keyof typeof tribeColors

interface Pick {
  contestant: string
  tribe: TribeName
  status: "safe" | "eliminated" | "pending" | "locked" | "none"
  isOwnPick?: boolean
}

interface Player {
  name: string
  isEliminated: boolean
  eliminatedWeek?: number
  picks: (Pick | null)[]
}

interface WeekInfo {
  week: number
  eliminatedContestant: string | null
  isCurrent: boolean
  isFuture: boolean
}

const weeks: WeekInfo[] = [
  { week: 1, eliminatedContestant: "Jenna L.", isCurrent: false, isFuture: false },
  { week: 2, eliminatedContestant: "Savannah L.", isCurrent: false, isFuture: false },
  { week: 3, eliminatedContestant: null, isCurrent: true, isFuture: false },
  { week: 4, eliminatedContestant: null, isCurrent: false, isFuture: true },
  { week: 5, eliminatedContestant: null, isCurrent: false, isFuture: true },
]

const players: Player[] = [
  {
    name: "Cam",
    isEliminated: false,
    picks: [
      { contestant: "Dee Valladares", tribe: "Kalo", status: "safe" },
      { contestant: "Rick Devens", tribe: "Cila", status: "safe" },
      { contestant: "Ozzy Lusth", tribe: "Cila", status: "locked" },
      null,
      null,
    ],
  },
  {
    name: "Devon",
    isEliminated: false,
    picks: [
      { contestant: "Charlie Davis", tribe: "Kalo", status: "safe" },
      { contestant: "Chrissy Hofbeck", tribe: "Kalo", status: "safe" },
      { contestant: "Ozzy Lusth", tribe: "Cila", status: "locked" },
      null,
      null,
    ],
  },
  {
    name: "Eddie",
    isEliminated: false,
    picks: [
      { contestant: "Ozzy Lusth", tribe: "Cila", status: "safe" },
      { contestant: "Emily Flippen", tribe: "Cila", status: "safe" },
      { contestant: "Mike White", tribe: "Kalo", status: "pending", isOwnPick: true },
      null,
      null,
    ],
  },
  {
    name: "Jill",
    isEliminated: false,
    picks: [
      { contestant: "Mike White", tribe: "Kalo", status: "safe" },
      { contestant: "Tiffany Ervin", tribe: "Kalo", status: "safe" },
      { contestant: "Ozzy Lusth", tribe: "Cila", status: "locked" },
      null,
      null,
    ],
  },
  {
    name: "Marcus",
    isEliminated: false,
    picks: [
      { contestant: "Colby Donaldson", tribe: "Vatu", status: "safe" },
      { contestant: "Angelina Keeley", tribe: "Vatu", status: "safe" },
      { contestant: "Ozzy Lusth", tribe: "Cila", status: "locked" },
      null,
      null,
    ],
  },
  {
    name: "Priya",
    isEliminated: false,
    picks: [
      { contestant: "Q Burdette", tribe: "Vatu", status: "safe" },
      { contestant: "Aubry Bracco", tribe: "Vatu", status: "safe" },
      { contestant: "Ozzy Lusth", tribe: "Cila", status: "locked" },
      null,
      null,
    ],
  },
  {
    name: "Sarah",
    isEliminated: false,
    picks: [
      { contestant: "Cirie Fields", tribe: "Cila", status: "safe" },
      { contestant: "Jonathan Young", tribe: "Kalo", status: "safe" },
      { contestant: "Ozzy Lusth", tribe: "Cila", status: "locked" },
      null,
      null,
    ],
  },
  // Eliminated player at the bottom
  {
    name: "Tom",
    isEliminated: true,
    eliminatedWeek: 1,
    picks: [
      { contestant: "Jenna Lewis-Dougherty", tribe: "Cila", status: "eliminated" },
      null,
      null,
      null,
      null,
    ],
  },
]

// Get available contestants for a player (not yet used)
function getAvailableContestants(player: Player): { name: string; tribe: TribeName }[] {
  const usedContestants = new Set(
    player.picks
      .filter((pick): pick is Pick => pick !== null)
      .map((pick) => pick.contestant)
  )
  return allContestants.filter((c) => !usedContestants.has(c.name))
}

function TribeDot({ tribe }: { tribe: TribeName }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: tribeColors[tribe] }}
    />
  )
}

function PickCell({ 
  pick, 
  week, 
  isEliminatedPlayer,
  player 
}: { 
  pick: Pick | null
  week: WeekInfo
  isEliminatedPlayer: boolean
  player: Player
}) {
  // Eliminated player rows after their elimination
  if (isEliminatedPlayer && pick === null) {
    return (
      <td className="px-3 py-3 min-w-[140px] bg-gray-100 border-r border-gray-200">
        <div className="flex items-center justify-center text-gray-400">
          —
        </div>
      </td>
    )
  }

  // Future weeks - empty dashed cell
  if (week.isFuture) {
    return (
      <td className="px-3 py-3 min-w-[140px] border-r border-gray-200">
        <div className="h-10 border-2 border-dashed border-gray-300 rounded-md" />
      </td>
    )
  }

  // No pick submitted
  if (pick === null || pick.status === "none") {
    return (
      <td className="px-3 py-3 min-w-[140px] bg-[#F3F4F6] border-r border-gray-200">
        <div className="flex items-center justify-center text-gray-400">
          —
        </div>
      </td>
    )
  }

  // Locked pick (other players' current week picks) - with availability popover
  if (pick.status === "locked") {
    const availableContestants = getAvailableContestants(player)
    
    return (
      <td className="px-3 py-3 min-w-[140px] bg-[#F3F4F6] border-r border-gray-200">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center text-gray-400 gap-2 w-full hover:text-gray-600 transition-colors cursor-pointer">
              <Lock className="w-4 h-4" />
              <User className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 max-h-72 overflow-y-auto" align="start">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">{player.name}&apos;s Available Picks</h4>
                <p className="text-xs text-gray-500 mt-0.5">{availableContestants.length} contestants remaining</p>
              </div>
              <div className="space-y-1.5">
                {availableContestants.map((contestant) => (
                  <div 
                    key={contestant.name}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-50"
                  >
                    <TribeDot tribe={contestant.tribe} />
                    <span className="text-sm text-gray-700">{contestant.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </td>
    )
  }

  // Own pick (current week)
  if (pick.isOwnPick) {
    return (
      <td className="px-3 py-3 min-w-[140px] border-r border-gray-200">
        <div className="flex flex-col gap-1 p-2 rounded-md border-2 border-[#F97316] bg-orange-50">
          <div className="flex items-center gap-1.5">
            <TribeDot tribe={pick.tribe} />
            <span className="text-sm font-medium text-gray-900 truncate">{pick.contestant}</span>
          </div>
          <span className="text-xs text-[#F97316] font-medium">Your pick</span>
        </div>
      </td>
    )
  }

  // Safe pick
  if (pick.status === "safe") {
    return (
      <td className="px-3 py-3 min-w-[140px] border-r border-gray-200">
        <div className="flex items-center gap-1.5 p-2 rounded-md bg-[#DCFCE7]">
          <TribeDot tribe={pick.tribe} />
          <span className="text-sm font-medium text-[#16A34A] truncate">{pick.contestant}</span>
          <Check className="w-4 h-4 text-[#16A34A] flex-shrink-0 ml-auto" />
        </div>
      </td>
    )
  }

  // Eliminated pick (fatal)
  if (pick.status === "eliminated") {
    return (
      <td className="px-3 py-3 min-w-[140px] border-r border-gray-200">
        <div className="flex items-center gap-1.5 p-2 rounded-md bg-[#FEE2E2]">
          <TribeDot tribe={pick.tribe} />
          <span className="text-sm font-medium text-[#DC2626] truncate">{pick.contestant}</span>
          <X className="w-4 h-4 text-[#DC2626] flex-shrink-0 ml-auto" />
        </div>
      </td>
    )
  }

  // Pending
  return (
    <td className="px-3 py-3 min-w-[140px] bg-[#F3F4F6] border-r border-gray-200">
      <div className="flex items-center gap-1.5 p-2 rounded-md">
        <TribeDot tribe={pick.tribe} />
        <span className="text-sm font-medium text-gray-600 truncate">{pick.contestant}</span>
      </div>
    </td>
  )
}

export default function PickHistoryPage() {
  const currentWeek = 3
  const totalWeeks = 13

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Survivor 50 Pool</h1>
          <span className="text-sm text-gray-600">Eddie</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Pick History</h2>
          <p className="text-gray-500 mt-1">Week {currentWeek} of ~{totalWeeks}</p>
        </div>

        {/* Scrollable Table Container */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {/* Frozen Player Column Header */}
                  <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 min-w-[140px]">
                    Player
                  </th>
                  {/* Week Column Headers */}
                  {weeks.map((week) => (
                    <th
                      key={week.week}
                      className={`px-3 py-3 text-center text-sm font-semibold min-w-[140px] border-r border-gray-200 ${
                        week.isCurrent
                          ? "bg-[#F97316] text-white"
                          : week.isFuture
                          ? "text-gray-400 bg-gray-50"
                          : "text-gray-900 bg-gray-50"
                      }`}
                    >
                      <div>Wk {week.week}</div>
                      {week.eliminatedContestant && (
                        <div className={`text-xs font-normal mt-0.5 ${week.isCurrent ? "text-orange-100" : "text-gray-500"}`}>
                          {week.eliminatedContestant}
                        </div>
                      )}
                      {week.isCurrent && !week.eliminatedContestant && (
                        <div className="text-xs font-normal mt-0.5 text-orange-100">In progress</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((player, playerIndex) => (
                  <tr
                    key={player.name}
                    className={`border-b border-gray-200 last:border-b-0 ${
                      player.isEliminated ? "bg-gray-50" : ""
                    }`}
                  >
                    {/* Frozen Player Name Cell */}
                    <td
                      className={`sticky left-0 z-10 px-4 py-3 border-r border-gray-200 min-w-[140px] ${
                        player.isEliminated ? "bg-gray-100" : "bg-white"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span
                          className={`font-medium ${
                            player.isEliminated
                              ? "line-through text-gray-400"
                              : "text-gray-900"
                          }`}
                        >
                          {player.name}
                        </span>
                        {player.isEliminated && player.eliminatedWeek && (
                          <span className="text-xs text-[#DC2626] mt-0.5">
                            Out Wk {player.eliminatedWeek}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Pick Cells */}
                    {weeks.map((week, weekIndex) => (
                      <PickCell
                        key={week.week}
                        pick={player.picks[weekIndex]}
                        week={week}
                        isEliminatedPlayer={player.isEliminated && week.week > (player.eliminatedWeek || 0)}
                        player={player}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#DCFCE7] flex items-center justify-center">
                <Check className="w-3 h-3 text-[#16A34A]" />
              </div>
              <span className="text-gray-600">Safe pick</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#FEE2E2] flex items-center justify-center">
                <X className="w-3 h-3 text-[#DC2626]" />
              </div>
              <span className="text-gray-600">Eliminated (out of pool)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#F3F4F6] flex items-center justify-center">
                <span className="text-gray-400 text-xs">—</span>
              </div>
              <span className="text-gray-600">No pick</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#F3F4F6] flex items-center justify-center">
                <Lock className="w-3 h-3 text-gray-400" />
              </div>
              <span className="text-gray-600">Pending reveal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-[#F97316] bg-orange-50" />
              <span className="text-gray-600">Your pick</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

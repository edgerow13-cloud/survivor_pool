"use client"

import { Check, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Contestant, Tribe } from "@/lib/contestants"
import { TRIBE_COLORS } from "@/lib/contestants"

interface ContestantCardProps {
  contestant: Contestant
  isSelected: boolean
  isSubmitted: boolean
  onSelect: (contestant: Contestant) => void
}

export function ContestantCard({
  contestant,
  isSelected,
  isSubmitted,
  onSelect,
}: ContestantCardProps) {
  const isDisabled = contestant.status === "used" || contestant.status === "eliminated"
  const tribeColor = TRIBE_COLORS[contestant.tribe]

  const handleClick = () => {
    if (!isDisabled && !isSubmitted) {
      onSelect(contestant)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled || isSubmitted}
      className={cn(
        "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 w-full text-left",
        // Default state
        !isSelected && !isDisabled && "bg-white border-gray-200 hover:shadow-lg hover:-translate-y-1",
        // Selected state
        isSelected && !isSubmitted && "bg-orange-50 border-[#F97316] border-[3px] shadow-md",
        // Submitted/locked state
        isSelected && isSubmitted && "bg-green-50 border-[#16A34A] border-[3px]",
        // Used state
        contestant.status === "used" && "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed",
        // Eliminated state
        contestant.status === "eliminated" && "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
      )}
    >
      {/* Selected checkmark */}
      {isSelected && !isSubmitted && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-[#F97316] rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Tribe badge */}
      <div
        className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: tribeColor }}
      >
        {contestant.tribe}
      </div>

      {/* Eliminated badge */}
      {contestant.status === "eliminated" && (
        <Badge variant="destructive" className="absolute top-2 left-2 text-xs">
          Eliminated
        </Badge>
      )}

      {/* Placeholder silhouette */}
      <div className={cn(
        "w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mt-4 mb-3",
        (contestant.status === "used" || contestant.status === "eliminated") && "bg-gray-300"
      )}>
        <User className="w-8 h-8 text-gray-400" />
      </div>

      {/* Contestant name */}
      <span
        className={cn(
          "text-sm font-semibold text-center text-gray-900",
          contestant.status === "used" && "line-through text-gray-500",
          contestant.status === "eliminated" && "text-gray-500"
        )}
      >
        {contestant.name}
      </span>

      {/* Already used label with week */}
      {contestant.status === "used" && (
        <span className="text-xs text-gray-500 mt-1">
          Used Week {contestant.statusWeek ?? "?"}
        </span>
      )}

      {/* Eliminated label with week */}
      {contestant.status === "eliminated" && (
        <span className="text-xs text-gray-500 mt-1">
          Eliminated Week {contestant.statusWeek ?? "?"}
        </span>
      )}

      {/* Locked in banner */}
      {isSelected && isSubmitted && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#16A34A] text-white text-xs font-medium py-1.5 rounded-b-lg flex items-center justify-center gap-1">
          <Check className="w-3 h-3" />
          Locked in
        </div>
      )}
    </button>
  )
}

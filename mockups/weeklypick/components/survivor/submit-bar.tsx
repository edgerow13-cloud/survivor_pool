"use client"

import { Button } from "@/components/ui/button"
import type { Contestant } from "@/lib/contestants"
import { cn } from "@/lib/utils"

interface SubmitBarProps {
  selectedContestant: Contestant | null
  isSubmitted: boolean
  onSubmit: () => void
  onChangePick: () => void
  className?: string
}

export function SubmitBar({
  selectedContestant,
  isSubmitted,
  onSubmit,
  onChangePick,
  className,
}: SubmitBarProps) {
  return (
    <div className={cn("bg-white border-t border-gray-200 p-4", className)}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          {selectedContestant ? (
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">Your pick:</span>{" "}
              <span className="font-semibold">{selectedContestant.name}</span>{" "}
              <span className="text-gray-500">({selectedContestant.tribe})</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">Select a contestant to pick</p>
          )}
        </div>

        {isSubmitted ? (
          <Button
            variant="outline"
            onClick={onChangePick}
            className="w-full sm:w-auto border-[#F97316] text-[#F97316] hover:bg-orange-50"
          >
            Change Pick
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={!selectedContestant}
            className="w-full sm:w-auto bg-[#F97316] hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedContestant ? "Submit Pick" : "Select a contestant to pick"}
          </Button>
        )}
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"

interface Contestant {
  id: string
  name: string
  tribe: string
  status: "active" | "eliminated"
}

interface Tribe {
  name: string
  color: string
}

interface TribeAssignmentPanelProps {
  tribes: Tribe[]
  contestants: Contestant[]
  selectedContestants: Set<string>
  selectedDestinationTribe: string | null
  weekNumber: number
  onWeekNumberChange: (week: number) => void
  onContestantToggle: (contestantId: string) => void
  onSelectAllInTribe: (tribeName: string) => void
  onDestinationTribeSelect: (tribeName: string) => void
  onCreateNewTribe: () => void
  onConfirm: () => void
}

export function TribeAssignmentPanel({
  tribes,
  contestants,
  selectedContestants,
  selectedDestinationTribe,
  weekNumber,
  onWeekNumberChange,
  onContestantToggle,
  onSelectAllInTribe,
  onDestinationTribeSelect,
  onCreateNewTribe,
  onConfirm,
}: TribeAssignmentPanelProps) {
  const activeContestants = contestants.filter((c) => c.status === "active")
  const contestantsByTribe = tribes.reduce((acc, tribe) => {
    acc[tribe.name] = activeContestants.filter((c) => c.tribe === tribe.name)
    return acc
  }, {} as Record<string, Contestant[]>)

  const selectedNames = Array.from(selectedContestants)
    .map((id) => contestants.find((c) => c.id === id)?.name)
    .filter(Boolean)

  const canConfirm = selectedContestants.size > 0 && selectedDestinationTribe

  return (
    <Card className="border-l-4 border-l-[#F97316] py-0">
      <CardHeader className="pt-6">
        <CardTitle className="text-lg">Update Tribe Assignments</CardTitle>
        <CardDescription>
          Use this after a tribe swap, dissolve, or merge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        {/* Week Number Input */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="weekNumber" className="whitespace-nowrap">
              Week Number
            </Label>
            <Input
              id="weekNumber"
              type="number"
              min={1}
              value={weekNumber}
              onChange={(e) => onWeekNumberChange(parseInt(e.target.value) || 1)}
              className="w-20"
            />
          </div>
          <p className="text-sm text-gray-500">
            Assignments take effect starting this week — past weeks are unchanged
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Select Contestants */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Select contestants to move</h4>
            <ScrollArea className="h-[280px] rounded-md border p-4">
              <div className="space-y-6">
                {tribes.map((tribe) => (
                  <div key={tribe.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: tribe.color }}
                        />
                        <span className="font-medium text-sm text-gray-900">
                          {tribe.name}
                        </span>
                      </div>
                      <button
                        onClick={() => onSelectAllInTribe(tribe.name)}
                        className="text-xs text-[#F97316] hover:underline"
                      >
                        Select all in tribe
                      </button>
                    </div>
                    <div className="space-y-1 pl-5">
                      {contestantsByTribe[tribe.name]?.map((contestant) => (
                        <div
                          key={contestant.id}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={`panel-${contestant.id}`}
                            checked={selectedContestants.has(contestant.id)}
                            onCheckedChange={() =>
                              onContestantToggle(contestant.id)
                            }
                          />
                          <Label
                            htmlFor={`panel-${contestant.id}`}
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            {contestant.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Column - Destination Tribe */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Move selected to:</h4>
            <div className="space-y-2">
              {tribes.map((tribe) => (
                <button
                  key={tribe.name}
                  onClick={() => onDestinationTribeSelect(tribe.name)}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                    selectedDestinationTribe === tribe.name
                      ? "border-[#F97316] bg-[#F97316]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: tribe.color }}
                  />
                  <span className="font-medium text-gray-900">{tribe.name}</span>
                </button>
              ))}
              <button
                onClick={onCreateNewTribe}
                className="w-full flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-3 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Create and move to new tribe</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {selectedContestants.size > 0 && selectedDestinationTribe && (
          <div className="rounded-lg bg-gray-50 p-4 border">
            <p className="text-sm font-medium text-gray-700">
              Moving {selectedContestants.size} contestants to{" "}
              <span className="text-[#F97316]">{selectedDestinationTribe}</span>:
            </p>
            <p className="text-sm text-gray-600 mt-1">{selectedNames.join(", ")}</p>
          </div>
        )}

        {/* Helper Text */}
        <p className="text-sm text-gray-500">
          Only select contestants who are CHANGING tribes.
        </p>

        {/* Confirm Button */}
        <Button
          onClick={onConfirm}
          disabled={!canConfirm}
          className="w-full bg-[#F97316] hover:bg-[#F97316]/90 disabled:bg-gray-300"
        >
          Confirm Tribe Update
        </Button>
      </CardContent>
    </Card>
  )
}

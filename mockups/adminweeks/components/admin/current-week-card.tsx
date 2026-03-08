"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Lock, AlertTriangle, Check, ExternalLink } from "lucide-react"
import Link from "next/link"

type WeekState = "unlocked" | "locked" | "complete"
type ResultsStep = null | 1 | 2

interface Week {
  id: string
  weekNumber: number
  episodeDate: Date
  status: "complete" | "in_progress" | "upcoming"
  picksSubmitted: number | null
  totalActivePlayers: number | null
}

interface Contestant {
  id: string
  name: string
  is_eliminated: boolean
}

interface CurrentWeekCardProps {
  week: Week
  contestants: Contestant[]
  onComplete: (weekId: string, eliminatedContestantId: string) => void
}

export function CurrentWeekCard({
  week,
  contestants,
  onComplete,
}: CurrentWeekCardProps) {
  const [weekState, setWeekState] = useState<WeekState>(
    week.status === "in_progress" ? "unlocked" : "unlocked"
  )
  const [resultsStep, setResultsStep] = useState<ResultsStep>(null)
  const [selectedContestant, setSelectedContestant] = useState<string>("")
  const [tribeChange, setTribeChange] = useState<string>("no-changes")
  const [eliminationConfirmed, setEliminationConfirmed] = useState(false)

  const activeContestants = contestants
    .filter((c) => !c.is_eliminated)
    .sort((a, b) => a.name.localeCompare(b.name))

  const playersWithNoPick = week.totalActivePlayers 
    ? week.totalActivePlayers - (week.picksSubmitted || 0)
    : 0

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    })
  }

  const handleLockWeek = () => {
    setWeekState("locked")
  }

  const handleEnterResults = () => {
    setResultsStep(1)
  }

  const handleConfirmElimination = () => {
    if (selectedContestant) {
      setEliminationConfirmed(true)
      setResultsStep(2)
    }
  }

  const handleCompleteWeek = () => {
    onComplete(week.id, selectedContestant)
    // Reset state for next week
    setWeekState("unlocked")
    setResultsStep(null)
    setSelectedContestant("")
    setTribeChange("no-changes")
    setEliminationConfirmed(false)
  }

  return (
    <Card className="border-l-4 border-l-[#F97316] py-0">
      <CardHeader className="pb-2 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            Week {week.weekNumber} —{" "}
            {weekState === "unlocked" && "Accepting Picks"}
            {weekState === "locked" && (
              <span className="inline-flex items-center gap-2">
                Locked
                <Badge variant="secondary" className="bg-[#F97316]/10 text-[#F97316] border-0">
                  <Lock className="size-3 mr-1" />
                  Enter Results
                </Badge>
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <p className="text-sm text-muted-foreground">
          {formatDate(week.episodeDate)} at {formatTime(week.episodeDate)}
        </p>

        {weekState === "unlocked" && (
          <>
            <p className="text-sm text-foreground">
              {week.picksSubmitted} of {week.totalActivePlayers} active players
              have submitted picks
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleLockWeek}
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
              >
                Lock Week
              </Button>
              <p className="text-xs text-muted-foreground">
                Locking prevents further submissions. You&apos;ll enter results
                in the next step.
              </p>
            </div>
          </>
        )}

        {weekState === "locked" && (
          <>
            {playersWithNoPick > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  {playersWithNoPick} player{playersWithNoPick > 1 ? "s have" : " has"} no pick — they will be eliminated when you confirm results
                </p>
              </div>
            )}

            {resultsStep === null && (
              <Button
                onClick={handleEnterResults}
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
              >
                Enter Results
              </Button>
            )}

            {resultsStep !== null && (
              <div className="space-y-6 border rounded-lg p-4 bg-muted/30">
                {/* Step 1: Elimination */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        eliminationConfirmed
                          ? "bg-[#16A34A] text-white"
                          : "bg-[#F97316] text-white"
                      }`}
                    >
                      {eliminationConfirmed ? <Check className="size-4" /> : "1"}
                    </div>
                    <Label className="text-sm font-medium">
                      Who was eliminated this episode?
                    </Label>
                  </div>

                  {!eliminationConfirmed ? (
                    <>
                      <Select
                        value={selectedContestant}
                        onValueChange={setSelectedContestant}
                      >
                        <SelectTrigger className="w-full max-w-sm bg-white">
                          <SelectValue placeholder="Select eliminated contestant" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeContestants.map((contestant) => (
                            <SelectItem key={contestant.id} value={contestant.id}>
                              {contestant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={handleConfirmElimination}
                        disabled={!selectedContestant}
                        className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white"
                      >
                        Confirm Elimination
                      </Button>

                      <p className="text-xs text-muted-foreground">
                        Players who picked this contestant will be marked
                        eliminated. Players with no pick this week will also be
                        eliminated.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[#16A34A] flex items-center gap-2">
                      <Check className="size-4" />
                      {activeContestants.find((c) => c.id === selectedContestant)?.name}{" "}
                      marked as eliminated
                    </p>
                  )}
                </div>

                {/* Step 2: Tribe Assignments */}
                {resultsStep === 2 && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-[#F97316] text-white flex items-center justify-center text-xs font-medium">
                        2
                      </div>
                      <Label className="text-sm font-medium">
                        Did any tribe changes occur this episode?
                      </Label>
                    </div>

                    <RadioGroup
                      value={tribeChange}
                      onValueChange={setTribeChange}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no-changes" id="no-changes" />
                        <Label htmlFor="no-changes" className="font-normal">
                          No changes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tribe-swap" id="tribe-swap" />
                        <Label htmlFor="tribe-swap" className="font-normal">
                          Tribe swap occurred
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="merge" id="merge" />
                        <Label htmlFor="merge" className="font-normal">
                          Tribes merged
                        </Label>
                      </div>
                    </RadioGroup>

                    {tribeChange === "no-changes" && (
                      <Button
                        onClick={handleCompleteWeek}
                        className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white"
                      >
                        <Check className="size-4 mr-1" />
                        Complete Week
                      </Button>
                    )}

                    {(tribeChange === "tribe-swap" || tribeChange === "merge") && (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          You&apos;ll need to update tribe assignments on the Tribes
                          page before completing
                          <Link
                            href="/admin/tribes"
                            className="text-[#F97316] hover:underline inline-flex items-center gap-1"
                          >
                            Go to Tribes <ExternalLink className="size-3" />
                          </Link>
                        </p>
                        <Button
                          onClick={handleCompleteWeek}
                          variant="outline"
                          className="border-muted-foreground/30"
                        >
                          Complete Week Anyway
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

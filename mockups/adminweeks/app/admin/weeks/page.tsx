"use client"

import { useState } from "react"
import { CurrentWeekCard } from "@/components/admin/current-week-card"
import { WeeksTable } from "@/components/admin/weeks-table"
import { AddWeekCard } from "@/components/admin/add-week-card"

// Sample data - in a real app this would come from props/API
const sampleContestants = [
  { id: "1", name: "Amanda Blake", is_eliminated: false },
  { id: "2", name: "Brian Chen", is_eliminated: false },
  { id: "3", name: "Caroline Davis", is_eliminated: false },
  { id: "4", name: "Derek Evans", is_eliminated: false },
  { id: "5", name: "Elena Foster", is_eliminated: false },
  { id: "6", name: "Frank Garcia", is_eliminated: false },
  { id: "7", name: "Jenna L-D", is_eliminated: true },
  { id: "8", name: "Kyle F", is_eliminated: true },
  { id: "9", name: "Savannah Louie", is_eliminated: true },
]

const initialWeeks = [
  {
    id: "1",
    weekNumber: 1,
    episodeDate: new Date("2026-02-25T20:00:00"),
    status: "complete" as const,
    eliminated: ["Jenna L-D", "Kyle F"],
    picksSubmitted: null,
    totalActivePlayers: null,
    isPrePool: true,
  },
  {
    id: "2",
    weekNumber: 2,
    episodeDate: new Date("2026-03-04T20:00:00"),
    status: "complete" as const,
    eliminated: ["Savannah Louie"],
    picksSubmitted: null,
    totalActivePlayers: null,
    isPrePool: true,
  },
  {
    id: "3",
    weekNumber: 3,
    episodeDate: new Date("2026-03-11T20:00:00"),
    status: "in_progress" as const,
    eliminated: [],
    picksSubmitted: 6,
    totalActivePlayers: 7,
    isPrePool: false,
  },
  {
    id: "4",
    weekNumber: 4,
    episodeDate: new Date("2026-03-18T20:00:00"),
    status: "upcoming" as const,
    eliminated: [],
    picksSubmitted: null,
    totalActivePlayers: null,
    isPrePool: false,
  },
  {
    id: "5",
    weekNumber: 5,
    episodeDate: new Date("2026-03-25T20:00:00"),
    status: "upcoming" as const,
    eliminated: [],
    picksSubmitted: null,
    totalActivePlayers: null,
    isPrePool: false,
  },
]

export default function WeeksPage() {
  const [weeks, setWeeks] = useState(initialWeeks)
  const [contestants, setContestants] = useState(sampleContestants)

  // Find the current week (earliest incomplete week)
  const currentWeek = weeks.find(
    (w) => w.status === "in_progress" || w.status === "upcoming"
  )

  const handleWeekComplete = (weekId: string, eliminatedContestantId: string) => {
    const eliminatedContestant = contestants.find(c => c.id === eliminatedContestantId)
    
    setWeeks((prev) =>
      prev.map((week) => {
        if (week.id === weekId) {
          return {
            ...week,
            status: "complete" as const,
            eliminated: eliminatedContestant ? [eliminatedContestant.name] : [],
          }
        }
        // Set the next week as in_progress
        const currentIndex = prev.findIndex((w) => w.id === weekId)
        const nextWeek = prev[currentIndex + 1]
        if (nextWeek && week.id === nextWeek.id) {
          return {
            ...week,
            status: "in_progress" as const,
            picksSubmitted: 0,
            totalActivePlayers: 7, // This would be calculated based on remaining players
          }
        }
        return week
      })
    )

    // Mark the contestant as eliminated
    if (eliminatedContestantId) {
      setContestants((prev) =>
        prev.map((c) =>
          c.id === eliminatedContestantId ? { ...c, is_eliminated: true } : c
        )
      )
    }
  }

  const handleAddWeek = (weekNumber: number, episodeDate: Date) => {
    const newWeek = {
      id: String(weeks.length + 1),
      weekNumber,
      episodeDate,
      status: "upcoming" as const,
      eliminated: [],
      picksSubmitted: null,
      totalActivePlayers: null,
      isPrePool: false,
    }
    setWeeks((prev) => [...prev, newWeek])
  }

  const handleEditEliminations = (
    weekId: string,
    eliminations: string[]
  ) => {
    setWeeks((prev) =>
      prev.map((week) =>
        week.id === weekId ? { ...week, eliminated: eliminations } : week
      )
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Weeks & Results</h1>
        <p className="text-muted-foreground mt-1">
          Manage episode dates, lock weeks, and enter eliminations.
        </p>
      </div>

      {currentWeek && (
        <CurrentWeekCard
          week={currentWeek}
          contestants={contestants}
          onComplete={handleWeekComplete}
        />
      )}

      <WeeksTable
        weeks={weeks}
        contestants={contestants}
        currentWeekId={currentWeek?.id}
        onEditEliminations={handleEditEliminations}
      />

      <AddWeekCard
        nextWeekNumber={weeks.length + 1}
        onAddWeek={handleAddWeek}
      />
    </div>
  )
}

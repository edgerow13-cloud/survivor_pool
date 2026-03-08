"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddWeekCardProps {
  nextWeekNumber: number
  onAddWeek: (weekNumber: number, episodeDate: Date) => void
}

export function AddWeekCard({ nextWeekNumber, onAddWeek }: AddWeekCardProps) {
  const [weekNumber, setWeekNumber] = useState(nextWeekNumber)
  const [episodeDate, setEpisodeDate] = useState("")
  const [episodeTime, setEpisodeTime] = useState("20:00")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (episodeDate && episodeTime) {
      const dateTime = new Date(`${episodeDate}T${episodeTime}:00`)
      onAddWeek(weekNumber, dateTime)
      setWeekNumber((prev) => prev + 1)
      setEpisodeDate("")
      setEpisodeTime("20:00")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add New Week</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weekNumber">Week Number</Label>
              <Input
                id="weekNumber"
                type="number"
                min={1}
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="episodeDate">Episode Date</Label>
              <Input
                id="episodeDate"
                type="date"
                value={episodeDate}
                onChange={(e) => setEpisodeDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="episodeTime">Air Time</Label>
              <Input
                id="episodeTime"
                type="time"
                value={episodeTime}
                onChange={(e) => setEpisodeTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              type="submit"
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
            >
              Add Week
            </Button>
            <p className="text-xs text-muted-foreground">
              Episode air time is automatically used as the pick submission
              deadline.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

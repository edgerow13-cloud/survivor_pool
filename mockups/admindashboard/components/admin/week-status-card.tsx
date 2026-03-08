import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface PlayerPick {
  name: string
  pick: string | null
  tribe?: string
}

const playerPicks: PlayerPick[] = [
  { name: "Eddie", pick: "Ozzy Lusth", tribe: "Cila" },
  { name: "Sarah", pick: "Emily Flippen", tribe: "Cila" },
  { name: "Marcus", pick: "Genevieve Mushaluk", tribe: "Vatu" },
  { name: "Jill", pick: "Charlie Davis", tribe: "Kalo" },
  { name: "Priya", pick: null },
  { name: "Devon", pick: "Dee Valladares", tribe: "Kalo" },
  { name: "Cam", pick: "Aubry Bracco", tribe: "Vatu" },
]

export function WeekStatusCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Week 3 Status
        </CardTitle>
        <CardAction>
          <Badge className="bg-[#F97316] text-white">In Progress</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-foreground">
            Airs Wednesday March 11, 2026 at 8:00 PM ET
          </p>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#16A34A]" />
            <p className="text-sm text-muted-foreground">
              Unlocked — picks still open
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {playerPicks.map((player) => (
            <div
              key={player.name}
              className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
            >
              <span className="text-sm font-medium text-foreground">{player.name}</span>
              {player.pick ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {player.pick} ({player.tribe})
                  </span>
                  <Check className="size-4 text-[#16A34A]" />
                </div>
              ) : (
                <Badge variant="destructive" className="bg-[#DC2626] text-white">
                  No pick
                </Badge>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button variant="outline" className="flex-1">
            Lock Week Early
          </Button>
          <Button disabled className="flex-1 bg-[#F97316] text-white opacity-50">
            Enter Results
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Activity {
  description: string
  timestamp: string
}

const activities: Activity[] = [
  { description: "Devon submitted their Week 3 pick — Dee Valladares", timestamp: "2 hours ago" },
  { description: "Sarah submitted their Week 3 pick — Emily Flippen", timestamp: "3 hours ago" },
  { description: "Week 2 results entered — Savannah Louie eliminated", timestamp: "2 days ago" },
  { description: "Cam submitted their Week 2 pick — Rick Devens", timestamp: "4 days ago" },
  { description: "Week 2 locked automatically", timestamp: "4 days ago" },
]

export function RecentActivityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
              <p className="text-sm text-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

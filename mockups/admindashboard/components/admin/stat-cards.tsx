import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string
  subtitle: string
}

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="pb-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

export function StatCards() {
  const stats = [
    { title: "Active Players", value: "7", subtitle: "1 eliminated" },
    { title: "Current Week", value: "Week 3", subtitle: "Locks Mar 11 at 8PM ET" },
    { title: "Contestants Remaining", value: "21", subtitle: "3 eliminated from show" },
    { title: "Picks Submitted", value: "6 / 7", subtitle: "1 player hasn't picked yet" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Trophy, Flag } from "lucide-react"

const actions = [
  { href: "/admin/players", label: "Manage Players", icon: Users },
  { href: "/admin/weeks", label: "Manage Weeks", icon: Calendar },
  { href: "/admin/contestants", label: "Manage Contestants", icon: Trophy },
  { href: "/admin/tribes", label: "Manage Tribes", icon: Flag },
]

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.href}
              variant="outline"
              className="h-auto flex-col gap-1 py-3"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="size-4 text-muted-foreground" />
                <span className="text-xs">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

import { StatCards } from "@/components/admin/stat-cards"
import { WeekStatusCard } from "@/components/admin/week-status-card"
import { RecentActivityCard } from "@/components/admin/recent-activity-card"
import { QuickActionsCard } from "@/components/admin/quick-actions-card"

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <StatCards />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <WeekStatusCard />
        
        <div className="space-y-6">
          <RecentActivityCard />
          <QuickActionsCard />
        </div>
      </div>
    </div>
  )
}

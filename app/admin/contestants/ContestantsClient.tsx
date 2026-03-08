'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { TribeCard } from '@/components/admin/TribeCard'
import { AddTribeCard } from '@/components/admin/AddTribeCard'
import { AddTribeModal } from '@/components/admin/AddTribeModal'
import { TribeAssignmentPanel } from '@/components/admin/TribeAssignmentPanel'
import { ContestantRosterTable } from '@/components/admin/ContestantRosterTable'
import type { Tribe } from '@/types/database'

export interface ContestantWithTribe {
  id: string
  name: string
  is_eliminated: boolean
  eliminated_week: number | null
  photo_url: string | null
  tribe: { id: string; name: string; color: string } | null
}

interface Props {
  contestants: ContestantWithTribe[]
  tribes: Tribe[]
  defaultWeekNumber: number
  tribeMembers: Record<string, string[]> // tribe.id → member names[]
}

export default function ContestantsClient({
  contestants,
  tribes,
  defaultWeekNumber,
  tribeMembers,
}: Props) {
  const { userId } = useAuth()
  const [selectedContestants, setSelectedContestants] = useState<Set<string>>(new Set())
  const [weekNumber, setWeekNumber] = useState(defaultWeekNumber)
  const [isAddTribeModalOpen, setIsAddTribeModalOpen] = useState(false)

  const activeCount = contestants.filter((c) => !c.is_eliminated).length
  const eliminatedCount = contestants.filter((c) => c.is_eliminated).length

  const handleContestantToggle = useCallback((id: string) => {
    setSelectedContestants((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAllInTribe = useCallback(
    (tribeId: string) => {
      const ids = contestants
        .filter((c) => !c.is_eliminated && c.tribe?.id === tribeId)
        .map((c) => c.id)
      setSelectedContestants((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.add(id))
        return next
      })
    },
    [contestants]
  )

  const handleConfirmSuccess = useCallback(() => {
    setSelectedContestants(new Set())
  }, [])

  if (!userId) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contestants &amp; Tribes</h1>
        <p className="text-gray-500 mt-1">
          {activeCount} active contestants across {tribes.length} tribe{tribes.length !== 1 ? 's' : ''} — {eliminatedCount} eliminated from show
        </p>
      </div>

      {/* Tribe Cards Row */}
      <section>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {tribes.map((tribe) => (
              <TribeCard
                key={tribe.id}
                tribe={tribe}
                members={tribeMembers[tribe.id] ?? []}
              />
            ))}
            <AddTribeCard onClick={() => setIsAddTribeModalOpen(true)} />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      <AddTribeModal
        open={isAddTribeModalOpen}
        onOpenChange={setIsAddTribeModalOpen}
        userId={userId}
      />

      {/* Tribe Assignment Panel */}
      <section>
        <TribeAssignmentPanel
          tribes={tribes}
          contestants={contestants}
          selectedContestants={selectedContestants}
          weekNumber={weekNumber}
          userId={userId}
          onWeekNumberChange={setWeekNumber}
          onContestantToggle={handleContestantToggle}
          onSelectAllInTribe={handleSelectAllInTribe}
          onCreateNewTribe={() => setIsAddTribeModalOpen(true)}
          onSuccess={handleConfirmSuccess}
        />
      </section>

      {/* Contestant Roster Table */}
      <section>
        <ContestantRosterTable
          contestants={contestants}
          selectedContestants={selectedContestants}
          userId={userId}
          onContestantToggle={handleContestantToggle}
        />
      </section>
    </div>
  )
}

"use client"

import { useState, useCallback } from "react"
import { TribeCard } from "@/components/admin/tribe-card"
import { AddTribeCard } from "@/components/admin/add-tribe-card"
import { AddTribeModal } from "@/components/admin/add-tribe-modal"
import { TribeAssignmentPanel } from "@/components/admin/tribe-assignment-panel"
import { ContestantRosterTable } from "@/components/admin/contestant-roster-table"
import { MergeGuide } from "@/components/admin/merge-guide"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// Initial tribes data
const initialTribes = [
  { name: "Cila", color: "#F97316" },
  { name: "Kalo", color: "#16A34A" },
  { name: "Vatu", color: "#BE185D" },
]

// Initial contestants data
const initialContestants = [
  // Cila (6 active members)
  { id: "1", name: "Christian Hubicki", tribe: "Cila", status: "active" as const },
  { id: "2", name: "Cirie Fields", tribe: "Cila", status: "active" as const },
  { id: "3", name: "Ozzy Lusth", tribe: "Cila", status: "active" as const },
  { id: "4", name: "Emily Flippen", tribe: "Cila", status: "active" as const },
  { id: "5", name: "Rick Devens", tribe: "Cila", status: "active" as const },
  { id: "6", name: "Joe Hunter", tribe: "Cila", status: "active" as const },
  
  // Kalo (8 active members)
  { id: "7", name: "Jonathan Young", tribe: "Kalo", status: "active" as const },
  { id: "8", name: "Dee Valladares", tribe: "Kalo", status: "active" as const },
  { id: "9", name: "Mike White", tribe: "Kalo", status: "active" as const },
  { id: "10", name: "Kamilla Karthigesu", tribe: "Kalo", status: "active" as const },
  { id: "11", name: "Charlie Davis", tribe: "Kalo", status: "active" as const },
  { id: "12", name: "Tiffany Ervin", tribe: "Kalo", status: "active" as const },
  { id: "13", name: 'Benjamin "Coach" Wade', tribe: "Kalo", status: "active" as const },
  { id: "14", name: "Chrissy Hofbeck", tribe: "Kalo", status: "active" as const },
  
  // Vatu (7 active members)
  { id: "15", name: "Colby Donaldson", tribe: "Vatu", status: "active" as const },
  { id: "16", name: "Genevieve Mushaluk", tribe: "Vatu", status: "active" as const },
  { id: "17", name: "Rizo Velovic", tribe: "Vatu", status: "active" as const },
  { id: "18", name: "Angelina Keeley", tribe: "Vatu", status: "active" as const },
  { id: "19", name: "Q Burdette", tribe: "Vatu", status: "active" as const },
  { id: "20", name: "Stephenie LaGrossa Kendrick", tribe: "Vatu", status: "active" as const },
  { id: "21", name: "Aubry Bracco", tribe: "Vatu", status: "active" as const },
  
  // Eliminated (3 contestants)
  { id: "22", name: "Jenna Lewis-Dougherty", tribe: "Cila", status: "eliminated" as const, eliminatedWeek: 1, notes: "Voted out Ep 1" },
  { id: "23", name: "Kyle Fraser", tribe: "Vatu", status: "eliminated" as const, eliminatedWeek: 1, notes: "Medevac (Achilles)" },
  { id: "24", name: "Savannah Louie", tribe: "Cila", status: "eliminated" as const, eliminatedWeek: 2, notes: "Voted out Ep 2" },
]

export default function ContestantsPage() {
  const [tribes, setTribes] = useState(initialTribes)
  const [contestants, setContestants] = useState(initialContestants)
  const [selectedContestants, setSelectedContestants] = useState<Set<string>>(new Set())
  const [selectedDestinationTribe, setSelectedDestinationTribe] = useState<string | null>(null)
  const [weekNumber, setWeekNumber] = useState(3)
  const [isAddTribeModalOpen, setIsAddTribeModalOpen] = useState(false)

  // Get members for each tribe
  const getMembersForTribe = (tribeName: string) => {
    return contestants
      .filter((c) => c.tribe === tribeName && c.status === "active")
      .map((c) => c.name)
  }

  // Count active contestants
  const activeCount = contestants.filter((c) => c.status === "active").length
  const eliminatedCount = contestants.filter((c) => c.status === "eliminated").length

  // Toggle contestant selection - linked between table and panel
  const handleContestantToggle = useCallback((contestantId: string) => {
    setSelectedContestants((prev) => {
      const next = new Set(prev)
      if (next.has(contestantId)) {
        next.delete(contestantId)
      } else {
        next.add(contestantId)
      }
      return next
    })
  }, [])

  // Select all contestants in a tribe
  const handleSelectAllInTribe = useCallback(
    (tribeName: string) => {
      const tribeContestants = contestants
        .filter((c) => c.tribe === tribeName && c.status === "active")
        .map((c) => c.id)
      setSelectedContestants((prev) => {
        const next = new Set(prev)
        tribeContestants.forEach((id) => next.add(id))
        return next
      })
    },
    [contestants]
  )

  // Handle tribe update confirmation
  const handleConfirmTribeUpdate = useCallback(() => {
    if (!selectedDestinationTribe || selectedContestants.size === 0) return

    setContestants((prev) =>
      prev.map((c) =>
        selectedContestants.has(c.id)
          ? { ...c, tribe: selectedDestinationTribe }
          : c
      )
    )
    setSelectedContestants(new Set())
    setSelectedDestinationTribe(null)
  }, [selectedContestants, selectedDestinationTribe])

  // Handle creating a new tribe
  const handleCreateTribe = useCallback(
    (tribe: { name: string; color: string; isMerged: boolean }) => {
      setTribes((prev) => [...prev, { name: tribe.name, color: tribe.color }])
    },
    []
  )

  // Handle marking a contestant as eliminated
  const handleMarkEliminated = useCallback((contestantId: string) => {
    setContestants((prev) =>
      prev.map((c) =>
        c.id === contestantId
          ? { ...c, status: "eliminated" as const, eliminatedWeek: weekNumber }
          : c
      )
    )
    setSelectedContestants((prev) => {
      const next = new Set(prev)
      next.delete(contestantId)
      return next
    })
  }, [weekNumber])

  // Handle reinstating a contestant
  const handleReinstate = useCallback((contestantId: string) => {
    setContestants((prev) =>
      prev.map((c) =>
        c.id === contestantId
          ? { ...c, status: "active" as const, eliminatedWeek: undefined, notes: undefined }
          : c
      )
    )
  }, [])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contestants & Tribes</h1>
        <p className="text-gray-500 mt-1">
          {activeCount} active contestants across {tribes.length} tribes — {eliminatedCount} eliminated from show
        </p>
      </div>

      {/* Section 1: Tribe Cards Row */}
      <section>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {tribes.map((tribe) => (
              <TribeCard
                key={tribe.name}
                name={tribe.name}
                color={tribe.color}
                members={getMembersForTribe(tribe.name)}
              />
            ))}
            <AddTribeCard onClick={() => setIsAddTribeModalOpen(true)} />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* Add Tribe Modal */}
      <AddTribeModal
        open={isAddTribeModalOpen}
        onOpenChange={setIsAddTribeModalOpen}
        onCreateTribe={handleCreateTribe}
      />

      {/* Section 2: Tribe Assignment Panel */}
      <section>
        <TribeAssignmentPanel
          tribes={tribes}
          contestants={contestants}
          selectedContestants={selectedContestants}
          selectedDestinationTribe={selectedDestinationTribe}
          weekNumber={weekNumber}
          onWeekNumberChange={setWeekNumber}
          onContestantToggle={handleContestantToggle}
          onSelectAllInTribe={handleSelectAllInTribe}
          onDestinationTribeSelect={setSelectedDestinationTribe}
          onCreateNewTribe={() => setIsAddTribeModalOpen(true)}
          onConfirm={handleConfirmTribeUpdate}
        />
      </section>

      {/* Section 3: Contestant Roster Table */}
      <section>
        <ContestantRosterTable
          contestants={contestants}
          tribes={tribes}
          selectedContestants={selectedContestants}
          onContestantToggle={handleContestantToggle}
          onMarkEliminated={handleMarkEliminated}
          onReinstate={handleReinstate}
        />
      </section>

      {/* Merge Guide */}
      <section>
        <MergeGuide />
      </section>
    </div>
  )
}

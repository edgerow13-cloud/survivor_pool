"use client"

import { useState } from "react"
import { Header } from "./header"
import { CountdownTimer } from "./countdown-timer"
import { ContestantCard } from "./contestant-card"
import { SubmitBar } from "./submit-bar"
import { SuccessAlert } from "./success-alert"
import { contestants, type Contestant } from "@/lib/contestants"

const CURRENT_WEEK = 3
const LOCK_DATE = new Date("2025-03-12T00:00:00Z") // March 11, 8 PM ET = March 12 00:00 UTC

export function SurvivorPool() {
  // Pre-select Ozzy as per requirements
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(
    contestants.find((c) => c.id === "ozzy") || null
  )
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

  const handleSelect = (contestant: Contestant) => {
    if (!isSubmitted) {
      setSelectedContestant(contestant)
    }
  }

  const handleSubmit = () => {
    if (selectedContestant) {
      setIsSubmitted(true)
      setShowSuccessAlert(true)
    }
  }

  const handleChangePick = () => {
    setIsSubmitted(false)
    setShowSuccessAlert(false)
  }

  const handleLogout = () => {
    // Handle logout logic
    console.log("Logging out...")
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <Header userName="Eddie" onLogout={handleLogout} />

      <main className="flex-1 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Success Alert */}
          {showSuccessAlert && selectedContestant && (
            <div className="mb-6">
              <SuccessAlert
                contestantName={selectedContestant.name}
                week={CURRENT_WEEK}
                onDismiss={() => setShowSuccessAlert(false)}
              />
            </div>
          )}

          {/* Page Title & Countdown */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Week {CURRENT_WEEK} — Pick Your Survivor
            </h2>
            <p className="text-gray-600 mb-4">
              Locks Wednesday March 11 at 8:00 PM ET
            </p>
            <CountdownTimer targetDate={LOCK_DATE} />
          </div>

          {/* Contestant Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {contestants.map((contestant) => (
              <ContestantCard
                key={contestant.id}
                contestant={contestant}
                isSelected={selectedContestant?.id === contestant.id}
                isSubmitted={isSubmitted && selectedContestant?.id === contestant.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Desktop Submit Section */}
      <div className="hidden md:block sticky bottom-0">
        <SubmitBar
          selectedContestant={selectedContestant}
          isSubmitted={isSubmitted}
          onSubmit={handleSubmit}
          onChangePick={handleChangePick}
        />
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <SubmitBar
          selectedContestant={selectedContestant}
          isSubmitted={isSubmitted}
          onSubmit={handleSubmit}
          onChangePick={handleChangePick}
        />
      </div>
    </div>
  )
}

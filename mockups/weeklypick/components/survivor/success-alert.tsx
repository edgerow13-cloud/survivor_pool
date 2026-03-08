"use client"

import { Check, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SuccessAlertProps {
  contestantName: string
  week: number
  onDismiss: () => void
}

export function SuccessAlert({ contestantName, week, onDismiss }: SuccessAlertProps) {
  return (
    <Alert className="bg-green-50 border-[#16A34A] text-green-900 relative">
      <Check className="h-4 w-4 text-[#16A34A]" />
      <AlertDescription className="pr-8">
        <span className="font-medium">Pick submitted!</span> You picked {contestantName} for Week {week}. You can change your pick until the deadline.
      </AlertDescription>
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-green-700 hover:text-green-900"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  )
}

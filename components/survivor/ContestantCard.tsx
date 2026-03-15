'use client'

import Image from 'next/image'
import { Check, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PickMode } from '@/app/pool/PickForm'

interface ContestantCardProps {
  id: string
  name: string
  tribe: { name: string; color: string } | null
  isEliminated: boolean
  eliminatedWeek: number | null
  usedWeek: number | null
  isSelected: boolean
  mode: PickMode
  photoUrl?: string | null
  onSelect: (id: string) => void
}

export function ContestantCard({
  id,
  name,
  tribe,
  isEliminated,
  eliminatedWeek,
  usedWeek,
  isSelected,
  mode,
  photoUrl,
  onSelect,
}: ContestantCardProps) {
  const isUsed = usedWeek !== null
  const isDisabled = isUsed || isEliminated

  // In submitted/locked mode, non-selected cards are dimmed and non-interactive
  const isNonInteractive = (mode === 'submitted' || mode === 'locked') && !isSelected
  const isLockedIn = isSelected && mode === 'submitted'

  return (
    <button
      type="button"
      onClick={() => !isDisabled && mode === 'selecting' && onSelect(id)}
      disabled={isDisabled || mode !== 'selecting'}
      className={cn(
        'relative flex flex-row items-center gap-3 p-3 md:flex-col md:items-center md:gap-0 md:p-4 rounded-xl border-2 transition-all duration-200 w-full',
        // Normal selectable state
        !isSelected && !isDisabled && mode === 'selecting' && 'bg-white border-gray-200 hover:shadow-lg hover:-translate-y-1',
        // Selected but not yet submitted (orange)
        isSelected && mode === 'selecting' && 'bg-orange-50 border-[#F97316] border-[3px] shadow-md',
        // Submitted pick (green locked-in)
        isLockedIn && 'bg-green-50 border-[#16A34A] border-[3px]',
        // Disabled (used or eliminated)
        isDisabled && 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed',
        // Non-selected cards in submitted/locked mode: dimmed and non-clickable
        isNonInteractive && !isDisabled && 'bg-white border-gray-200 opacity-40 pointer-events-none',
      )}
    >
      {/* Selected checkmark — desktop only (selecting mode only) */}
      {isSelected && mode === 'selecting' && (
        <div className="hidden md:flex absolute top-2 left-2 w-6 h-6 bg-[#F97316] rounded-full items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Tribe badge — desktop only */}
      {tribe && (
        <div
          className="hidden md:block absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: tribe.color }}
        >
          {tribe.name}
        </div>
      )}

      {/* Photo or silhouette */}
      <div
        className={cn(
          'w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-200 flex items-center justify-center md:mt-4 md:mb-3 overflow-hidden shrink-0',
          isDisabled && !photoUrl && 'bg-gray-300',
        )}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-8 h-8 text-gray-400" />
        )}
      </div>

      {/* Name + status — middle column on mobile, centered on desktop */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5 md:items-center md:w-full">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Tribe dot — mobile only */}
          {tribe && (
            <span
              className="md:hidden inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: tribe.color }}
            />
          )}
          <span
            className={cn(
              'text-sm font-semibold text-gray-900 truncate md:text-center',
              isUsed && 'line-through text-gray-500',
              isEliminated && !isUsed && 'text-gray-500',
            )}
          >
            {name}
          </span>
        </div>

        {/* Status label */}
        {isUsed && (
          <span className="text-xs text-gray-500">
            {usedWeek ? `Used Wk ${usedWeek}` : 'Already picked'}
          </span>
        )}
        {isEliminated && !isUsed && (
          <span className="text-xs text-gray-500">
            {eliminatedWeek ? `Eliminated Wk ${eliminatedWeek}` : 'Eliminated'}
          </span>
        )}
      </div>

      {/* Mobile selection circle — right side indicator, hidden on desktop */}
      <div className={cn(
        'md:hidden ml-auto shrink-0 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
        isSelected ? 'border-[#F97316] bg-[#F97316]' : 'border-gray-300',
      )}>
        {isSelected && <Check className="h-4 w-4 text-white" />}
      </div>

      {/* Locked in banner */}
      {isLockedIn && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#16A34A] text-white text-xs font-medium py-1.5 rounded-b-lg flex items-center justify-center gap-1">
          <Check className="w-3 h-3" />
          Locked in
        </div>
      )}
    </button>
  )
}

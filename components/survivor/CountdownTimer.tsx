'use client'

import { useCountdown } from '@/hooks/use-countdown'

interface CountdownTimerProps {
  targetDate: Date
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const timeLeft = useCountdown(targetDate)

  if (timeLeft.isExpired) {
    return <p className="text-sm font-medium text-gray-500">Picks are locked</p>
  }

  const units = [
    { value: timeLeft.days, label: 'days' },
    { value: timeLeft.hours, label: 'hrs' },
    { value: timeLeft.minutes, label: 'min' },
    { value: timeLeft.seconds, label: 'sec' },
  ]

  return (
    <div className="flex items-center gap-2">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-[#F97316] tabular-nums">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-xs text-gray-500 uppercase">{unit.label}</span>
          </div>
          {i < units.length - 1 && (
            <span className="text-xl text-gray-300 font-light">:</span>
          )}
        </div>
      ))}
    </div>
  )
}

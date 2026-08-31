'use client'

import { useEffect, useState } from 'react'

export interface ActiveSeason {
  seasonNumber: number
  name: string
}

// Module-level cache — the active season doesn't change within a browser
// session, so avoid re-fetching every time a component (e.g. the header)
// remounts on client-side navigation.
let cache: ActiveSeason | null = null

export function useActiveSeason(): ActiveSeason | null {
  const [season, setSeason] = useState<ActiveSeason | null>(cache)

  useEffect(() => {
    if (cache) return
    fetch('/api/season/active')
      .then((res) => (res.ok ? (res.json() as Promise<ActiveSeason>) : null))
      .then((json) => {
        if (json) {
          cache = json
          setSeason(json)
        }
      })
      .catch(() => {})
  }, [])

  return season
}

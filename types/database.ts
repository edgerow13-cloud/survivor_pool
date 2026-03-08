export type UserRole = 'commissioner' | 'player'
export type UserStatus = 'active' | 'eliminated' | 'pending_approval' | 'inactive'
export type PickOutcome = 'safe' | 'eliminated' | 'no_pick'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  eliminated_week: number | null
  created_at: string
}

export interface Contestant {
  id: string
  name: string
  is_eliminated: boolean
  eliminated_week: number | null
  photo_url: string | null
  created_at: string
}

export interface Tribe {
  id: string
  name: string
  color: string
  is_merged: boolean
  created_at: string
}

export interface ContestantTribeHistory {
  id: string
  contestant_id: string
  tribe_id: string
  week_number: number
  created_at: string
}

export interface Week {
  id: string
  week_number: number
  episode_date: string
  is_locked: boolean
  is_results_entered: boolean
  created_at: string
}

export interface WeekElimination {
  id: string
  week_id: string
  contestant_id: string
  created_at: string
}

export interface Pick {
  id: string
  user_id: string
  week_id: string
  contestant_id: string | null
  outcome: PickOutcome | null
  is_commissioner_override: boolean
  created_at: string
}

export interface NewUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

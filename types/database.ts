export type UserRole = 'commissioner' | 'player'
export type UserStatus = 'active' | 'eliminated' | 'pending_approval'
export type PickOutcome = 'safe' | 'eliminated' | 'no_pick'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

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
  eliminated_contestant_id: string | null
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

export interface InviteLink {
  id: string
  token: string
  created_by: string
  is_active: boolean
  created_at: string
}

export interface JoinRequest {
  id: string
  name: string
  email: string
  invite_token: string
  status: JoinRequestStatus
  created_at: string
}

// Insert helper types
export interface NewJoinRequest {
  name: string
  email: string
  invite_token: string
}

export interface NewUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

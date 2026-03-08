import { getAdminClient } from '@/lib/supabase/admin'
import ContestantsClient, { type ContestantWithTribe } from './ContestantsClient'
import type { Tribe } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ContestantsPage() {
  const [{ data: contestantsRaw }, { data: tribesRaw }, { data: tribeHistory }] =
    await Promise.all([
      getAdminClient().from('contestants').select('*').order('name'),
      getAdminClient().from('tribes').select('*').order('name'),
      getAdminClient().from('contestant_tribe_history').select('*'),
    ])

  const tribes = (tribesRaw ?? []) as Tribe[]

  // Find latest tribe assignment per contestant
  const latestTribeByContestant: Record<string, { tribe_id: string; week_number: number }> = {}
  for (const row of tribeHistory ?? []) {
    const existing = latestTribeByContestant[row.contestant_id]
    if (!existing || row.week_number > existing.week_number) {
      latestTribeByContestant[row.contestant_id] = {
        tribe_id: row.tribe_id,
        week_number: row.week_number,
      }
    }
  }

  const tribeMap = Object.fromEntries(tribes.map((t) => [t.id, t]))

  const contestants: ContestantWithTribe[] = (contestantsRaw ?? []).map((c) => {
    const assignment = latestTribeByContestant[c.id]
    const tribe = assignment ? (tribeMap[assignment.tribe_id] ?? null) : null
    return {
      id: c.id,
      name: c.name,
      is_eliminated: c.is_eliminated,
      eliminated_week: c.eliminated_week,
      tribe: tribe ? { id: tribe.id, name: tribe.name, color: tribe.color } : null,
    }
  })

  // Compute active member names per tribe (for TribeCard display)
  const tribeMembers: Record<string, string[]> = {}
  for (const tribe of tribes) {
    tribeMembers[tribe.id] = contestants
      .filter((c) => !c.is_eliminated && c.tribe?.id === tribe.id)
      .map((c) => c.name)
      .sort()
  }

  const maxWeek = Math.max(
    1,
    ...Object.values(latestTribeByContestant).map((r) => r.week_number),
  )

  return (
    <ContestantsClient
      contestants={contestants}
      tribes={tribes}
      defaultWeekNumber={maxWeek}
      tribeMembers={tribeMembers}
    />
  )
}

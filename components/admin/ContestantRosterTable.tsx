'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface ContestantForRoster {
  id: string
  name: string
  is_eliminated: boolean
  eliminated_week: number | null
  tribe: { id: string; name: string; color: string } | null
}

interface Props {
  contestants: ContestantForRoster[]
  selectedContestants: Set<string>
  weekNumber: number
  userId: string
  onContestantToggle: (id: string) => void
}

export function ContestantRosterTable({
  contestants,
  selectedContestants,
  weekNumber,
  userId,
  onContestantToggle,
}: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const active = contestants.filter((c) => !c.is_eliminated)
  const eliminated = contestants.filter((c) => c.is_eliminated)

  async function markEliminated(id: string) {
    setLoadingId(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/update-contestant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contestant_id: id,
          is_eliminated: true,
          eliminated_week: weekNumber,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoadingId(null)
    }
  }

  async function reinstate(id: string) {
    setLoadingId(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/update-contestant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contestant_id: id,
          is_eliminated: false,
          eliminated_week: null,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contestant Roster</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error && <p className="text-sm text-red-600 px-6 pb-2">{error}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]" />
              <TableHead>Name</TableHead>
              <TableHead>Current Tribe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Eliminated Week</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedContestants.has(c.id)}
                    onCheckedChange={() => onContestantToggle(c.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  {c.tribe ? (
                    <Badge
                      variant="outline"
                      className="gap-1.5"
                      style={{ borderColor: c.tribe.color, color: c.tribe.color }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.tribe.color }} />
                      {c.tribe.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white">Active</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingId === c.id}
                    className="text-[#DC2626] border-[#DC2626] hover:bg-[#DC2626]/10"
                    onClick={() => markEliminated(c.id)}
                  >
                    {loadingId === c.id ? '…' : 'Mark Eliminated'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            <TableRow className="bg-gray-100 hover:bg-gray-100">
              <TableCell colSpan={6} className="py-2 text-center">
                <span className="text-sm font-medium text-gray-600">
                  Eliminated from Show ({eliminated.length})
                </span>
              </TableCell>
            </TableRow>

            {eliminated.map((c) => (
              <TableRow key={c.id} className="bg-red-50/50 hover:bg-red-50">
                <TableCell>
                  <Checkbox disabled />
                </TableCell>
                <TableCell className="font-medium">
                  <span className="line-through text-gray-500">{c.name}</span>
                </TableCell>
                <TableCell>
                  {c.tribe ? (
                    <Badge
                      variant="outline"
                      className="gap-1.5 opacity-60"
                      style={{ borderColor: c.tribe.color, color: c.tribe.color }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.tribe.color }} />
                      {c.tribe.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white">Eliminated</Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  {c.eliminated_week ? `Week ${c.eliminated_week}` : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingId === c.id}
                    className="text-gray-600"
                    onClick={() => reinstate(c.id)}
                  >
                    {loadingId === c.id ? '…' : 'Reinstate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

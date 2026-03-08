"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

interface AddPlayerCardProps {
  onAddPlayer: (name: string, email: string) => void
}

export function AddPlayerCard({ onAddPlayer }: AddPlayerCardProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && email.trim()) {
      onAddPlayer(name.trim(), email.trim())
      setName("")
      setEmail("")
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Add Player</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter player name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white"
            />
          </div>
          <Button
            type="submit"
            className="bg-[#F97316] text-white hover:bg-[#EA580C]"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        </form>
        <p className="text-xs text-gray-500">
          Players are immediately active. Notify them via text or group chat that they can log in at pool.eddiegerow.com
        </p>
      </CardContent>
    </Card>
  )
}

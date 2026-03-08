'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type UserRole = 'commissioner' | 'player'

interface AuthState {
  userId: string | null
  name: string | null
  role: UserRole | null
  isLoading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  userId: null,
  name: null,
  role: null,
  isLoading: true,
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('pool_userId')
    const storedName = sessionStorage.getItem('pool_name')
    const storedRole = sessionStorage.getItem('pool_role') as UserRole | null
    setUserId(storedUserId)
    setName(storedName)
    setRole(storedRole)
    setIsLoading(false)
  }, [])

  function logout() {
    sessionStorage.removeItem('pool_userId')
    sessionStorage.removeItem('pool_name')
    sessionStorage.removeItem('pool_role')
    setUserId(null)
    setName(null)
    setRole(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ userId, name, role, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

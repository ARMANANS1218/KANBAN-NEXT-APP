'use client'

import { useEffect, useState } from 'react'
import { useAppDispatch } from '@/store'
import { setUserFromStorage } from '@/store/authSlice'
import { fetchUsers } from '@/store/usersSlice'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Prevent SSR hydration mismatch
    setIsHydrated(true)
    
    // Restore auth from localStorage on mount
    const token = localStorage.getItem('authToken')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        dispatch(setUserFromStorage({ user, token }))
        // Load users for task assignment asynchronously (non-blocking)
        setTimeout(() => {
          dispatch(fetchUsers())
        }, 100)
      } catch (error) {
        console.error('Failed to restore auth:', error)
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      }
    }
  }, [dispatch])

  // Prevent hydration mismatch by not rendering until client-side
  if (!isHydrated) {
    return null
  }

  return <>{children}</>
}

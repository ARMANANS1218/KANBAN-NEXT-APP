'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { setUserFromStorage } from '@/store/authSlice'
import { fetchUsers } from '@/store/usersSlice'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Restore auth from localStorage on mount
    const token = localStorage.getItem('authToken')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        dispatch(setUserFromStorage({ user, token }))
        // Load users for task assignment
        dispatch(fetchUsers())
      } catch (error) {
        console.error('Failed to restore auth:', error)
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      }
    }
  }, [dispatch])

  return children
}

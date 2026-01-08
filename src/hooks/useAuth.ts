import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { setUserFromStorage } from '@/store/authSlice'

export function useAuth() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Restore auth from localStorage on mount
    const token = localStorage.getItem('authToken')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        dispatch(setUserFromStorage({ user, token }))
      } catch (error) {
        console.error('Failed to restore auth:', error)
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      }
    }
  }, [dispatch])
}

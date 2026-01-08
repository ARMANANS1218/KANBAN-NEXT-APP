'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/store'
import { loginSuccess, loginFailure } from '@/store/authSlice'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    google: any
  }
}

export default function GoogleLoginButton() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  
  // Don't render if client ID is not configured
  if (!clientId || clientId === 'your-google-client-id-here') {
    return null
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      if (!window.google || !googleButtonRef.current) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      })

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 350,
        text: 'continue_with',
      })
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handleCredentialResponse = async (response: any) => {
    try {
      // Decode JWT token
      const base64Url = response.credential.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const decoded = JSON.parse(jsonPayload)

      // Call backend OAuth endpoint
      const res = await fetch('/api/auth/google-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleId: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        dispatch(loginFailure(data.error || 'Google login failed'))
        toast.error(data.error || 'Google login failed')
        return
      }

      dispatch(loginSuccess({ user: data.user, token: data.token }))
      toast.success('Google login successful!')
      router.push('/boards')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Google login failed'
      dispatch(loginFailure(errorMessage))
      toast.error(errorMessage)
    }
  }

  return <div ref={googleButtonRef} className="w-full"></div>
}

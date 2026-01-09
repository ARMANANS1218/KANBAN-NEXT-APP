import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/register', '/']

// API routes that don't require authentication
const publicApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/google-callback']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Allow public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check for auth token in cookies or headers
  const authToken = request.cookies.get('authToken')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '')
  
  // Redirect to login if no token and trying to access protected route
  if (!authToken && !pathname.startsWith('/auth')) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  
  // Redirect to boards if authenticated and trying to access auth pages
  if (authToken && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/boards', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip all static assets (anything with an extension) and Next internals
    '/((?!_next/static|_next/image|favicon.ico|.*\..*).*)',
  ],
}

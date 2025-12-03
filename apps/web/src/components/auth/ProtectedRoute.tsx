'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import type { UserRole } from '@/lib/auth'

interface ProtectedRouteProps {
 children: React.ReactNode
 allowedRoles?: UserRole[]
 fallbackUrl?: string
}

export function ProtectedRoute({ 
 children, 
 allowedRoles = ['employee', 'admin'],
 fallbackUrl = '/' 
}: ProtectedRouteProps) {
 const { user, session, loading } = useAuth()
 const router = useRouter()
 const pathname = usePathname()
 const [isChecking, setIsChecking] = useState(true)
 const redirectAttempted = useRef(false)
 const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)

 useEffect(() => {
  // Clear any pending timeout when component unmounts
  return () => {
   if (checkTimeoutRef.current) {
    clearTimeout(checkTimeoutRef.current)
   }
  }
 }, [])

 useEffect(() => {
  // Reset redirect flag when pathname changes (including back navigation)
  redirectAttempted.current = false
  
  // Clear any pending timeout
  if (checkTimeoutRef.current) {
   clearTimeout(checkTimeoutRef.current)
   checkTimeoutRef.current = null
  }

  // Wait for auth to finish loading
  if (loading) {
   setIsChecking(true)
   return
  }

  // Give session a moment to stabilize after loading completes
  // This prevents premature redirects during browser back navigation
  setIsChecking(true)
  
  checkTimeoutRef.current = setTimeout(() => {
   setIsChecking(false)

   // User is not authenticated - check both user and session
   if (!user && !session) {
    // Only redirect if we haven't already attempted it for this path
    if (!redirectAttempted.current && pathname !== '/login') {
     redirectAttempted.current = true
     router.push('/login')
     return
    }
   }

   // User doesn't have the required role
   if (user?.profile && !allowedRoles.includes(user.profile.role)) {
    if (!redirectAttempted.current && pathname !== '/unauthorized') {
     redirectAttempted.current = true
     router.push('/unauthorized')
     return
    }
   }
  }, 100) // Small delay to allow session state to stabilize

  return () => {
   if (checkTimeoutRef.current) {
    clearTimeout(checkTimeoutRef.current)
    checkTimeoutRef.current = null
   }
  }
 }, [user, session, loading, router, allowedRoles, pathname])

 // Show loading while checking authentication or during initial check
 if (loading || isChecking) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
   </div>
  )
 }

 // Don't render children until authentication is verified
 // Allow rendering if session exists even if user profile is still loading
 if (!user && !session) {
  return null
 }

 if (user?.profile && !allowedRoles.includes(user.profile.role)) {
  return null
 }

 return <>{children}</>
}

// Higher-order component version
export function withAuth<P extends object>(
 WrappedComponent: React.ComponentType<P>,
 allowedRoles?: UserRole[]
) {
 const WithAuthComponent = (props: P) => {
  return (
   <ProtectedRoute allowedRoles={allowedRoles}>
    <WrappedComponent {...props} />
   </ProtectedRoute>
  )
 }

 WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`
 
 return WithAuthComponent
}
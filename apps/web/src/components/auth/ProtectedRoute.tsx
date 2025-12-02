'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
 const { user, loading } = useAuth()
 const router = useRouter()

 useEffect(() => {
  if (!loading) {
   // User is not authenticated
   if (!user) {
    router.push('/login')
    return
   }

   // User doesn't have the required role
   if (user.profile && !allowedRoles.includes(user.profile.role)) {
    router.push('/unauthorized')
    return
   }
  }
 }, [user, loading, router, allowedRoles])

 // Show loading while checking authentication
 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
   </div>
  )
 }

 // Don't render children until authentication is verified
 if (!user || (user.profile && !allowedRoles.includes(user.profile.role))) {
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
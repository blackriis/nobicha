'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from './AuthProvider'

interface LogoutButtonProps {
 variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
 size?: 'default' | 'sm' | 'lg' | 'icon'
 className?: string
 children?: React.ReactNode
}

export function LogoutButton({ 
 variant = 'outline',
 size = 'default',
 className = '',
 children
}: LogoutButtonProps) {
 const [loading, setLoading] = useState(false)
 const { signOut } = useAuth()
 const router = useRouter()

 const handleLogout = async () => {
  setLoading(true)
  
  try {
   await signOut()
   // Redirect to login page after successful logout
   router.push('/login/employee')
  } catch (error: unknown) {
   console.error('Logout error:', error)
   // Still redirect even if logout fails (to handle session cleanup)
   router.push('/login/employee')
  } finally {
   setLoading(false)
  }
 }

 return (
  <Button
   variant={variant}
   size={size}
   onClick={handleLogout}
   disabled={loading}
   className={className}
  >
   {loading ? 'กำลังออกจากระบบ...' : (children || 'ออกจากระบบ')}
  </Button>
 )
}
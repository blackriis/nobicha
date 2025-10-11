'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { useAuth } from './AuthProvider'
import { getRedirectUrl, type UserRole } from '@/lib/auth'

interface LoginFormProps {
 role: UserRole
 title: string
 description: string
}

export function LoginForm({ role, title, description }: LoginFormProps) {
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')
 
 const { signIn } = useAuth()
 const router = useRouter()
 const searchParams = useSearchParams()
 const [redirectPath, setRedirectPath] = useState<string>('')

 // Get redirect path from query params or cookies
 useEffect(() => {
  const redirectTo = searchParams.get('redirectTo')
  console.log('🔍 LoginForm: Found redirectTo in query:', redirectTo)
  
  if (redirectTo) {
   setRedirectPath(redirectTo)
   console.log('✅ LoginForm: Set redirect path from query:', redirectTo)
  } else {
   // If no query param, check cookies
   const getCookie = (name: string) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
     return parts.pop()?.split(';').shift()
    }
    return null
   }
   
   const cookieRedirect = getCookie('redirectTo')
   console.log('🔍 LoginForm: Found redirectTo in cookie:', cookieRedirect)
   
   if (cookieRedirect) {
    setRedirectPath(cookieRedirect)
    console.log('✅ LoginForm: Set redirect path from cookie:', cookieRedirect)
   }
  }
 }, [searchParams])

 // Clean up redirect cookie after successful login
 const clearRedirectCookie = () => {
  document.cookie = 'redirectTo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
 }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
   await signIn(email, password)
   
   // Use saved redirect path if available, otherwise use role-based default
   const finalRedirectUrl = redirectPath && redirectPath.startsWith('/') 
    ? redirectPath 
    : getRedirectUrl(role)
   
   console.log('🚀 LoginForm: Redirecting to:', {
    redirectPath,
    finalRedirectUrl,
    role,
    isCustomPath: !!redirectPath && redirectPath.startsWith('/')
   })
   
   // Clear the redirect cookie after using it
   if (redirectPath) {
    clearRedirectCookie()
    console.log('🧹 LoginForm: Cleared redirect cookie')
   }
   
   router.push(finalRedirectUrl)
   
  } catch (error: unknown) {
   console.error('Login error:', error)
   
   // Show user-friendly error messages
   let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
   
   if (error.message?.includes('Validation failed')) {
    errorMessage = 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่'
   } else if (error.message?.includes('Invalid login credentials')) {
    errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
   } else if (error.message?.includes('Too many requests')) {
    errorMessage = 'คุณพยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่และลองใหม่'
   }
   
   setError(errorMessage)
  } finally {
   setLoading(false)
  }
 }

 return (
  <div className="min-h-screen flex items-center justify-center bg-background relative">
   {/* Theme Toggle Button - Top Right */}
   <div className="absolute top-4 right-4">
    <ModeToggle />
   </div>
   
   <Card className="w-full max-w-md">
    <CardHeader className="space-y-1">
     <CardTitle className="text-2xl font-bold text-center">
      {title}
     </CardTitle>
     <CardDescription className="text-center">
      {description}
     </CardDescription>
    </CardHeader>
    <CardContent>
     <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
       <Label htmlFor="email">อีเมล</Label>
       <Input
        id="email"
        data-testid="email-input"
        type="email"
        placeholder="กรุณากรอกอีเมล"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
        className="w-full"
       />
      </div>
      
      <div className="space-y-2">
       <Label htmlFor="password">รหัสผ่าน</Label>
       <Input
        id="password"
        data-testid="password-input"
        type="password"
        placeholder="กรุณากรอกรหัสผ่าน"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
        className="w-full"
       />
      </div>

      {error && (
       <div className="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-950/50 p-2 rounded">
        {error}
       </div>
      )}

      <Button 
       type="submit" 
       data-testid="login-button"
       disabled={loading || !email || !password}
       className="w-full"
      >
       {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </Button>
     </form>
     
     <div className="mt-4 text-center">
      <p className="text-sm text-gray-600">
       {role === 'employee' 
        ? 'สำหรับพนักงานทั่วไป' 
        : 'สำหรับผู้ดูแลระบบเท่านั้น'
       }
      </p>
     </div>
    </CardContent>
   </Card>
  </div>
 )
}
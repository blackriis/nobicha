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
 const [identifier, setIdentifier] = useState('')
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
   await signIn(identifier, password)
   
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
   
   if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase()
    
    // Network errors
    if (errorMsg.includes('เครือข่าย') || errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
     errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่'
    }
    // Timeout errors
    else if (errorMsg.includes('timeout') || errorMsg.includes('ใช้เวลานานเกินไป')) {
     errorMessage = 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง'
    }
    // Configuration errors
    else if (errorMsg.includes('configuration') || errorMsg.includes('ตั้งค่า') || errorMsg.includes('supabase')) {
     errorMessage = 'การตั้งค่าระบบไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ'
    }
    // Validation errors
    else if (errorMsg.includes('validation failed')) {
     errorMessage = 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่'
    }
    // Auth errors
    else if (errorMsg.includes('invalid login credentials') || errorMsg.includes('invalid credentials')) {
     errorMessage = 'Username, อีเมล หรือรหัสผ่านไม่ถูกต้อง'
    }
    // Rate limit errors
    else if (errorMsg.includes('too many requests') || errorMsg.includes('rate limit')) {
     errorMessage = 'คุณพยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่และลองใหม่'
    }
    // Email not confirmed
    else if (errorMsg.includes('email not confirmed') || errorMsg.includes('email_not_confirmed')) {
     errorMessage = 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ'
    }
    // Use the error message if it's already in Thai or user-friendly
    else if (error.message && error.message.length < 100) {
     errorMessage = error.message
    }
   }
   
   setError(errorMessage)
  } finally {
   setLoading(false)
  }
 }

 return (
   <Card className="w-full">
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
       <Label htmlFor="identifier">Username หรืออีเมล</Label>
       <Input
        id="identifier"
        data-testid="identifier-input"
        type="text"
        placeholder="กรุณากรอก username หรืออีเมล"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
        disabled={loading}
        className="w-full"
        autoComplete="username"
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
       disabled={loading || !identifier || !password}
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
 )
}
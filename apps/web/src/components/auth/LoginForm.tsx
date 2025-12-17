'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { useAuth } from './AuthProvider'
import { getRedirectUrl, type UserRole } from '@/lib/auth'
import { AlertCircle } from 'lucide-react'
import { useFormFocusManagement } from '@/hooks/useFocusManagement'
import { loginRateLimiter } from '@/lib/utils/rate-limiter'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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
 const [rateLimitError, setRateLimitError] = useState<string | null>(null)

 const { signIn } = useAuth()
 const router = useRouter()
 const searchParams = useSearchParams()
 const [redirectPath, setRedirectPath] = useState<string>('')

 // Use focus management for form accessibility
 const { containerRef, handleFormSubmit } = useFormFocusManagement(async () => {
   await performLogin()
 })

 // Get redirect path from query params or cookies
 useEffect(() => {
  const redirectTo = searchParams.get('redirectTo')

  if (redirectTo) {
   setRedirectPath(redirectTo)
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

   if (cookieRedirect) {
    setRedirectPath(cookieRedirect)
   }
  }
 }, [searchParams])

 // Clean up redirect cookie after successful login
 const clearRedirectCookie = () => {
  document.cookie = 'redirectTo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
 }

 const performLogin = async () => {
  // Check rate limit first
  const rateLimitResult = loginRateLimiter.check(identifier)

  if (!rateLimitResult.allowed) {
    setRateLimitError(rateLimitResult.message || 'คุณพยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่')
    setError('')
    return
  }

  setError('')
  setRateLimitError('')
  setLoading(true)

  try {
   await signIn(identifier, password)

   // Reset rate limit on successful login
   loginRateLimiter.reset(identifier)

   // Use saved redirect path if available, otherwise use role-based default
   const finalRedirectUrl = redirectPath && redirectPath.startsWith('/')
    ? redirectPath
    : getRedirectUrl(role)

   // Clear the redirect cookie after using it
   if (redirectPath) {
    clearRedirectCookie()
   }

   router.push(finalRedirectUrl)

  } catch (error: unknown) {

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
   <Card className="w-full relative" role="main" aria-labelledby="login-title" ref={containerRef}>
    {/* Loading overlay */}
    {loading && (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
        <LoadingSpinner
          size="lg"
          color="primary"
          message="กำลังเข้าสู่ระบบ..."
        />
      </div>
    )}

    <CardHeader className="space-y-1 p-3 sm:p-6">
     <CardTitle id="login-title" className="text-lg sm:text-2xl font-bold text-center">
      {title}
     </CardTitle>
     <CardDescription className="text-center text-sm sm:text-base">
      {description}
     </CardDescription>
    </CardHeader>
    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
     <form onSubmit={handleFormSubmit} className="space-y-3 sm:space-y-4" noValidate aria-describedby={
    (error ? "error-message" : "") + (rateLimitError ? " rate-limit-message" : "") || undefined
  }>
      <div className="space-y-2">
       <Label htmlFor="identifier" className="text-sm sm:text-base">Username หรืออีเมล</Label>
       <Input
        id="identifier"
        data-testid="identifier-input"
        type="text"
        placeholder="กรุณากรอก username หรืออีเมล"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
        disabled={loading}
        className="w-full h-10 sm:h-10 text-sm sm:text-base"
        autoComplete="username"
        aria-label="Username หรืออีเมล"
        aria-describedby={identifier && !identifier.match(/\S/) ? "identifier-error" : undefined}
        aria-invalid={identifier === '' ? false : undefined}
       />
      </div>

      <div className="space-y-2">
       <Label htmlFor="password" className="text-sm sm:text-base">รหัสผ่าน</Label>
       <Input
        id="password"
        data-testid="password-input"
        type="password"
        placeholder="กรุณากรอกรหัสผ่าน"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
        className="w-full h-10 sm:h-10 text-sm sm:text-base"
        aria-label="รหัสผ่าน"
        aria-describedby="password-help"
        aria-required="true"
        minLength={6}
       />
       <p id="password-help" className="sr-only">
         รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร
       </p>
      </div>

      {error && (
       <Alert
        variant="destructive"
        className="p-3 sm:p-4"
        role="alert"
        aria-live="assertive"
        id="error-message"
       >
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription className="text-sm">
         {error}
        </AlertDescription>
       </Alert>
      )}

      {rateLimitError && (
       <Alert
        variant="destructive"
        className="p-3 sm:p-4 border-orange-200 bg-orange-50"
        role="alert"
        aria-live="assertive"
        id="rate-limit-message"
       >
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription className="text-sm">
         {rateLimitError}
        </AlertDescription>
       </Alert>
      )}

      <Button
       type="submit"
       data-testid="login-button"
       disabled={loading || !identifier || !password}
       className="w-full h-10 sm:h-10 text-sm sm:text-base flex items-center justify-center gap-2"
       aria-describedby="submit-help"
      >
       {loading ? (
        <>
         <LoadingSpinner size="sm" color="white" />
         <span>กำลังเข้าสู่ระบบ...</span>
        </>
       ) : (
        'เข้าสู่ระบบ'
       )}
      </Button>

      <div id="submit-help" className="sr-only">
        กรุณากรอกข้อมูลให้ครบถ้วนก่อนกดปุ่มเข้าสู่ระบบ
      </div>
     </form>
     
     <div className="mt-4 text-center">
      <p className="text-sm text-muted-foreground">
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
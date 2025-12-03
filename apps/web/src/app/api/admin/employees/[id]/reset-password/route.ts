import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/rate-limit'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'
import { isValidUUID } from '@/lib/validation'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeId } = await params

    // Validate UUID format
    if (!isValidUUID(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID format' },
        { status: 400 }
      )
    }

    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication check - support both Bearer token and cookie-based auth
    const authHeader = request.headers.get('authorization')
    let user = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use bearer token authentication (for backward compatibility)
      const token = authHeader.replace('Bearer ', '')
      const tempSupabase = await createSupabaseServerClient()
      const { data: userData, error: tokenError } = await tempSupabase.auth.getUser(token)
      if (tokenError || !userData.user) {
        return NextResponse.json(
          { error: 'ไม่พบการยืนยันตัวตน' },
          { status: 401 }
        )
      }
      user = userData.user
    } else {
      // Fallback to cookie-based auth (preferred for production)
      const supabase = await createClient()
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !cookieUser) {
        return NextResponse.json(
          { error: 'ไม่พบการยืนยันตัวตน' },
          { status: 401 }
        )
      }
      user = cookieUser
    }

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบการยืนยันตัวตน' },
        { status: 401 }
      )
    }

    // Get user profile and check role using service role client to bypass RLS
    const adminClient = await createSupabaseServerClient()
    const { data: userProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const newPassword = body.password

    // Validate password if provided by user
    if (newPassword) {
      const passwordValidation = {
        hasUpperCase: /[A-Z]/.test(newPassword),
        hasLowerCase: /[a-z]/.test(newPassword),
        hasNumbers: /\d/.test(newPassword),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
        minLength: newPassword.length >= 8
      }
      
      const errors: string[] = []
      if (!passwordValidation.minLength) {
        errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      }
      if (!passwordValidation.hasUpperCase) {
        errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว')
      }
      if (!passwordValidation.hasLowerCase) {
        errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว')
      }
      if (!passwordValidation.hasNumbers) {
        errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
      }
      if (!passwordValidation.hasSpecialChar) {
        errors.push('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว')
      }
      
      if (errors.length > 0) {
        return NextResponse.json({
          success: false,
          error: errors.join(', ')
        }, { status: 400 })
      }
    }

    // Check if employee exists
    const { data: employee, error: employeeError } = await adminClient
      .from('users')
      .select('id, email, role')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json({
        success: false,
        error: 'ไม่พบข้อมูลพนักงานรายการนี้'
      }, { status: 404 })
    }

    // Generate secure default password if not provided
    // Format: Emp{last4digits}@2024 (ensures: uppercase, lowercase, numbers, special char)
    const generateSecurePassword = (userId: string): string => {
      // Extract digits from last 4 characters of UUID
      const last4 = userId.slice(-4)
      // Extract only digits, if none found use '2024'
      const digits = last4.replace(/[^0-9]/g, '')
      const finalDigits = digits.length >= 4 ? digits.slice(0, 4) : digits.padStart(4, '0')
      // If still no digits, use default
      const safeDigits = finalDigits || '2024'
      // Format: Emp{digits}@2024
      // This ensures: E (uppercase), m, p (lowercase), digits (numbers), @ (special char)
      return `Emp${safeDigits}@2024`
    }
    
    let defaultPassword = newPassword || generateSecurePassword(employeeId)
    
    // Validate generated password meets requirements
    const passwordValidation = {
      hasUpperCase: /[A-Z]/.test(defaultPassword),
      hasLowerCase: /[a-z]/.test(defaultPassword),
      hasNumbers: /\d/.test(defaultPassword),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(defaultPassword),
      minLength: defaultPassword.length >= 8
    }
    
    // If validation fails, use a guaranteed secure fallback
    if (!passwordValidation.hasUpperCase || 
        !passwordValidation.hasLowerCase || 
        !passwordValidation.hasNumbers || 
        !passwordValidation.hasSpecialChar || 
        !passwordValidation.minLength) {
      console.warn('Generated password validation failed, using fallback:', passwordValidation, defaultPassword)
      // Fallback: guaranteed format with all requirements
      const fallbackDigits = employeeId.slice(-4).replace(/[^0-9]/g, '0').padStart(4, '0')
      defaultPassword = `Emp${fallbackDigits}@2024`
      
      // Double-check fallback
      if (!/[A-Z]/.test(defaultPassword) || 
          !/[a-z]/.test(defaultPassword) || 
          !/\d/.test(defaultPassword) || 
          !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(defaultPassword)) {
        // Ultimate fallback
        defaultPassword = 'Emp2024@2024'
      }
    }

    // Reset password using Supabase Admin API
    const { data: updatedUser, error: passwordError } = await adminClient.auth.admin.updateUserById(
      employeeId,
      { password: defaultPassword }
    )

    if (passwordError) {
      console.error('Reset password error:', passwordError)
      return NextResponse.json({
        success: false,
        error: 'ไม่สามารถรีเซ็ตรหัสผ่านได้: ' + passwordError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว',
      password: defaultPassword // Return password so admin can share it with employee
    })

  } catch (error) {
    console.error('Unexpected error in reset password API:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน'
      },
      { status: 500 }
    )
  }
}


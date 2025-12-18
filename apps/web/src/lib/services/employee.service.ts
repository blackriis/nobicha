import { getSupabaseClient } from '@/lib/supabase-client'
import { isValidUUID } from '@/lib/validation'
// Define UserRole locally since we can't import from @packages/database
type UserRole = 'admin' | 'employee'

// Types for employee management
export interface EmployeeFormData {
  full_name: string
  email: string
  password?: string
  home_branch_id: string
  hourly_rate: number
  daily_rate: number
  user_role?: 'employee'
  is_active?: boolean
}

export interface EmployeeUpdateData {
  full_name: string
  home_branch_id: string
  hourly_rate: number
  daily_rate: number
  is_active?: boolean
}

export interface ValidationErrors {
  [key: string]: string[]
}

export interface EmployeeDetail {
  id: string
  email: string
  full_name: string
  role: UserRole
  home_branch_id: string
  hourly_rate: number
  daily_rate: number
  is_active: boolean
  created_at: string
  updated_at?: string
  branch_name?: string
  branch_address?: string
}

export interface EmployeeListItem {
  id: string
  email: string
  full_name: string
  role: UserRole
  branch_id: string | null
  is_active: boolean
  created_at: string
  // Joined data from branches table
  branch_name?: string
  branch_address?: string
}

export interface EmployeeListResponse {
  data: EmployeeListItem[]
  total: number
  page: number
  limit: number
}

export interface SearchFilters {
  search?: string
  branchId?: string
  role?: UserRole
  status?: 'active' | 'inactive'
  sortBy?: 'full_name' | 'email' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationParams {
  page: number
  limit: number
}

// Validation utilities
export class EmployeeValidation {
  static validateEmail(email: string): string[] {
    const errors: string[] = []
    
    if (!email || email.trim() === '') {
      errors.push('อีเมลเป็นข้อมูลที่จำเป็น')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('รูปแบบอีเมลไม่ถูกต้อง')
    }
    
    return errors
  }

  static validatePassword(password: string): string[] {
    const errors: string[] = []
    
    if (!password || password.length < 8) {
      errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว')
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
    }
    
    return errors
  }

  static validateRates(hourlyRate: number, dailyRate: number): string[] {
    const errors: string[] = []
    
    if (!hourlyRate || hourlyRate < 0 || hourlyRate > 10000) {
      errors.push('อัตราค่าแรงรายชั่วโมงต้องอยู่ระหว่าง 0-10,000 บาท')
    }
    
    if (!dailyRate || dailyRate < 0 || dailyRate > 50000) {
      errors.push('อัตราค่าแรงรายวันต้องอยู่ระหว่าง 0-50,000 บาท')
    }
    
    return errors
  }

  static validateEmployeeData(data: EmployeeFormData): ValidationErrors {
    const errors: ValidationErrors = {}

    // Full name validation
    if (!data.full_name || data.full_name.trim().length < 2) {
      errors.full_name = ['ชื่อ-สกุลต้องมีอย่างน้อย 2 ตัวอักษร']
    } else if (data.full_name.trim().length > 100) {
      errors.full_name = ['ชื่อ-สกุลต้องไม่เกิน 100 ตัวอักษร']
    }

    // Email validation
    const emailErrors = this.validateEmail(data.email)
    if (emailErrors.length > 0) {
      errors.email = emailErrors
    }

    // Password validation (for create only)
    if (data.password) {
      const passwordErrors = this.validatePassword(data.password)
      if (passwordErrors.length > 0) {
        errors.password = passwordErrors
      }
    }

    // Branch validation
    if (!data.home_branch_id || data.home_branch_id.trim() === '') {
      errors.home_branch_id = ['กรุณาเลือกสาขาหลัก']
    }

    // Rates validation
    const rateErrors = this.validateRates(data.hourly_rate, data.daily_rate)
    if (rateErrors.length > 0) {
      errors.rates = rateErrors
    }

    return errors
  }
}

export class EmployeeService {
  // Use singleton client to avoid multiple instances
  private supabase = getSupabaseClient()

  constructor() {
    // Constructor no longer creates new client
  }

  async getEmployeeList(
    filters: SearchFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<EmployeeListResponse> {
    try {
      const { 
        search, 
        branchId, 
        role, 
        status, 
        sortBy = 'created_at', 
        sortOrder = 'desc' 
      } = filters
      const { page, limit } = pagination

      let query = this.supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          branch_id,
          is_active,
          created_at,
          branches!users_branch_id_fkey (
            id,
            name,
            address
          )
        `, { count: 'exact' })

      // Apply search filter
      if (search && search.trim() !== '') {
        query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
      }

      // Apply branch filter
      if (branchId) {
        query = query.eq('branch_id', branchId)
      }

      // Apply role filter
      if (role) {
        query = query.eq('role', role)
      }

      // Apply status filter
      if (status) {
        const isActive = status === 'active'
        query = query.eq('is_active', isActive)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const startIndex = (page - 1) * limit
      query = query.range(startIndex, startIndex + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Employee service error:', error)
        throw new Error(`Failed to fetch employees: ${error.message}`)
      }

      // Transform data to match EmployeeListItem interface
      const employees: EmployeeListItem[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role as UserRole,
        branch_id: user.branch_id,
        is_active: user.is_active ?? true,
        created_at: user.created_at,
        branch_name: Array.isArray(user.branches) ? user.branches[0]?.name : (user.branches as any)?.name,
        branch_address: Array.isArray(user.branches) ? user.branches[0]?.address : (user.branches as any)?.address
      }))

      return {
        data: employees,
        total: count || 0,
        page,
        limit
      }

    } catch (error) {
      console.error('EmployeeService.getEmployeeList error:', error)
      throw error
    }
  }

  // Utility function for search debouncing
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  // Get employee by ID with detailed information
  async getEmployeeById(employeeId: string): Promise<EmployeeDetail> {
    try {
      // Validate input
      if (!employeeId || typeof employeeId !== 'string' || employeeId.trim() === '') {
        throw new Error('Invalid employee ID provided')
      }

      // Validate UUID format
      if (!isValidUUID(employeeId)) {
        throw new Error('Invalid employee ID format. Expected UUID format.')
      }

      console.log(`Fetching employee by ID: ${employeeId}`)
      
      // Get auth token
      const token = await this.getAuthToken()
      if (!token) {
        throw new Error('ไม่พบการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่')
      }
      
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 404) {
          throw new Error(`Employee not found for ID: ${employeeId}`)
        }
        
        if (response.status === 400) {
          throw new Error(`Invalid employee ID format: ${employeeId}`)
        }
        
        throw new Error(`Failed to fetch employee data: ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      const employee = data.employee || data // Handle both { employee: ... } and direct response
      
      return {
        id: employee.id,
        email: employee.email,
        full_name: employee.full_name,
        role: employee.role as UserRole,
        home_branch_id: employee.branch_id, // Map branch_id to home_branch_id for consistency
        hourly_rate: employee.hourly_rate || 0,
        daily_rate: employee.daily_rate || 0,
        is_active: employee.is_active ?? true,
        created_at: employee.created_at,
        updated_at: employee.created_at, // Use created_at since updated_at doesn't exist
        branch_name: Array.isArray(employee.branches) ? employee.branches[0]?.name : (employee.branches as any)?.name,
        branch_address: Array.isArray(employee.branches) ? employee.branches[0]?.address : (employee.branches as any)?.address
      }

    } catch (error) {
      // Final safety logging
      const fallback = typeof error === 'object' && error !== null ? (error as any) : { message: String(error) }
      console.error('EmployeeService.getEmployeeById error (catched):', fallback)
      throw error
    }
  }

  // Create new employee (for frontend use)
  async createEmployee(employeeData: EmployeeFormData): Promise<{ success: boolean; employee?: EmployeeDetail; error?: string }> {
    try {
      // This method will call the API endpoint
      // Using a base URL that works for both development and production
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
      const response = await fetch(`${baseUrl}/api/admin/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(employeeData)
      })

      const result = await response.json()
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'เกิดข้อผิดพลาดในการสร้างพนักงาน'
        }
      }

      return {
        success: true,
        employee: result.employee
      }

    } catch (error) {
      console.error('EmployeeService.createEmployee error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์'
      }
    }
  }

  // Update existing employee (for frontend use)
  async updateEmployee(employeeId: string, updateData: EmployeeUpdateData): Promise<{ success: boolean; employee?: EmployeeDetail; error?: string }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
      const response = await fetch(`${baseUrl}/api/admin/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'เกิดข้อผิดพลาดในการอัพเดทพนักงาน'
        }
      }

      return {
        success: true,
        employee: result.employee
      }

    } catch (error) {
      console.error('EmployeeService.updateEmployee error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์'
      }
    }
  }

  // Helper method to get auth token
  private async getAuthToken(): Promise<string> {
    try {
      // Import createClientComponentClient dynamically to avoid SSR issues
      const { createClientComponentClient } = await import('@/lib/supabase')
      const supabase = createClientComponentClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        return ''
      }
      
      return session?.access_token || ''
    } catch (error) {
      console.error('Get auth token error:', error)
      return ''
    }
  }

  // Utility function for sorting logic
  applySorting(
    employees: EmployeeListItem[], 
    sortBy: SearchFilters['sortBy'], 
    sortOrder: SearchFilters['sortOrder']
  ): EmployeeListItem[] {
    if (!sortBy) return employees

    return employees.sort((a, b) => {
      let valueA: any = a[sortBy]
      let valueB: any = b[sortBy]

      // Handle date strings
      if (sortBy === 'created_at') {
        valueA = new Date(valueA).getTime()
        valueB = new Date(valueB).getTime()
      }

      // Handle string comparison (case insensitive)
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase()
        valueB = valueB.toLowerCase()
      }

      if (valueA < valueB) {
        return sortOrder === 'asc' ? -1 : 1
      }
      if (valueA > valueB) {
        return sortOrder === 'asc' ? 1 : -1
      }
      return 0
    })
  }
}

// Export singleton instance
export const employeeService = new EmployeeService()
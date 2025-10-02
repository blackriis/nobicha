import type { Database } from '@employee-management/database'
import { createClient } from '@supabase/supabase-js'
import { validateGPSCoordinates } from '../utils/gps.utils'
import type { GPSValidationResult } from '../utils/gps.utils'

type Branch = Database['public']['Tables']['branches']['Row']
type BranchInsert = Database['public']['Tables']['branches']['Insert']
type BranchUpdate = Database['public']['Tables']['branches']['Update']

export interface CreateBranchData {
  name: string
  address: string
  latitude: number
  longitude: number
}

export interface UpdateBranchData {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
}

export interface BranchServiceResult<T = unknown> {
  data: T | null
  error: string | null
  success: boolean
}

class BranchService {
  // Use Supabase client with SERVICE_ROLE fallback for admin operations
  private getClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // Get all branches
  async getAllBranches(): Promise<BranchServiceResult<Branch[]>> {
    try {
      const supabase = this.getClient()
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching branches:', error)
        return {
          data: null,
          error: 'ไม่สามารถดึงข้อมูลสาขาได้',
          success: false
        }
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in getAllBranches:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสาขา',
        success: false
      }
    }
  }

  // Get branch by ID
  async getBranchById(id: string): Promise<BranchServiceResult<Branch>> {
    try {
      if (!id) {
        return {
          data: null,
          error: 'ID สาขาไม่ถูกต้อง',
          success: false
        }
      }

      const supabase = this.getClient()
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching branch:', error)
        return {
          data: null,
          error: error.code === 'PGRST116' ? 'ไม่พบสาขาที่ต้องการ' : 'ไม่สามารถดึงข้อมูลสาขาได้',
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in getBranchById:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสาขา',
        success: false
      }
    }
  }

  // Create new branch with GPS validation
  async createBranch(branchData: CreateBranchData): Promise<BranchServiceResult<Branch>> {
    try {
      // Validate input data
      if (!branchData.name || branchData.name.trim().length === 0) {
        return {
          data: null,
          error: 'กรุณากรอกชื่อสาขา',
          success: false
        }
      }
      
      if (!branchData.address || branchData.address.trim().length === 0) {
        return {
          data: null,
          error: 'กรุณากรอกที่อยู่สาขา',
          success: false
        }
      }

      // Validate GPS coordinates
      const gpsValidation = validateGPSCoordinates(branchData.latitude, branchData.longitude)
      if (!gpsValidation.valid) {
        return {
          data: null,
          error: `พิกัด GPS ไม่ถูกต้อง: ${gpsValidation.errors.join(', ')}`,
          success: false
        }
      }

      const supabase = this.getClient()
      
      // Check for duplicate branch name
      const { data: existingBranch } = await supabase
        .from('branches')
        .select('id')
        .eq('name', branchData.name.trim())
        .single()

      if (existingBranch) {
        return {
          data: null,
          error: 'ชื่อสาขานี้มีอยู่ในระบบแล้ว',
          success: false
        }
      }

      // Create branch
      const insertData: BranchInsert = {
        name: branchData.name.trim(),
        address: branchData.address.trim(),
        latitude: branchData.latitude,
        longitude: branchData.longitude
      }

      const { data, error } = await supabase
        .from('branches')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Error creating branch:', error)
        return {
          data: null,
          error: 'ไม่สามารถสร้างสาขาใหม่ได้',
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in createBranch:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการสร้างสาขา',
        success: false
      }
    }
  }

  // Update branch with GPS validation
  async updateBranch(id: string, branchData: UpdateBranchData): Promise<BranchServiceResult<Branch>> {
    try {
      if (!id) {
        return {
          data: null,
          error: 'ID สาขาไม่ถูกต้อง',
          success: false
        }
      }

      // Validate name if provided
      if (branchData.name !== undefined && (!branchData.name || branchData.name.trim().length === 0)) {
        return {
          data: null,
          error: 'กรุณากรอกชื่อสาขา',
          success: false
        }
      }
      
      // Validate address if provided
      if (branchData.address !== undefined && (!branchData.address || branchData.address.trim().length === 0)) {
        return {
          data: null,
          error: 'กรุณากรอกที่อยู่สาขา',
          success: false
        }
      }

      // Validate GPS coordinates if provided
      if (branchData.latitude !== undefined && branchData.longitude !== undefined) {
        const gpsValidation = validateGPSCoordinates(branchData.latitude, branchData.longitude)
        if (!gpsValidation.valid) {
          return {
            data: null,
            error: `พิกัด GPS ไม่ถูกต้อง: ${gpsValidation.errors.join(', ')}`,
            success: false
          }
        }
      }

      const supabase = this.getClient()
      
      // Check for duplicate name if updating name
      if (branchData.name) {
        const { data: existingBranch } = await supabase
          .from('branches')
          .select('id')
          .eq('name', branchData.name.trim())
          .neq('id', id)
          .single()

        if (existingBranch) {
          return {
            data: null,
            error: 'ชื่อสาขานี้มีอยู่ในระบบแล้ว',
            success: false
          }
        }
      }

      // Prepare update data
      const updateData: BranchUpdate = {}
      if (branchData.name !== undefined) updateData.name = branchData.name.trim()
      if (branchData.address !== undefined) updateData.address = branchData.address.trim()
      if (branchData.latitude !== undefined) updateData.latitude = branchData.latitude
      if (branchData.longitude !== undefined) updateData.longitude = branchData.longitude

      const { data, error } = await supabase
        .from('branches')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating branch:', error)
        return {
          data: null,
          error: error.code === 'PGRST116' ? 'ไม่พบสาขาที่ต้องการแก้ไข' : 'ไม่สามารถแก้ไขข้อมูลสาขาได้',
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in updateBranch:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการแก้ไขสาขา',
        success: false
      }
    }
  }

  // Delete branch
  async deleteBranch(id: string): Promise<BranchServiceResult<null>> {
    try {
      if (!id) {
        return {
          data: null,
          error: 'ID สาขาไม่ถูกต้อง',
          success: false
        }
      }

      const supabase = this.getClient()
      
      // Check if branch has associated work shifts
      const { data: shifts } = await supabase
        .from('work_shifts')
        .select('id')
        .eq('branch_id', id)
        .limit(1)

      if (shifts && shifts.length > 0) {
        return {
          data: null,
          error: 'ไม่สามารถลบสาขาได้ เนื่องจากมีการกำหนดกะการทำงานไว้',
          success: false
        }
      }

      // Check if branch has associated employees
      const { data: employees } = await supabase
        .from('users')
        .select('id')
        .eq('branch_id', id)
        .limit(1)

      if (employees && employees.length > 0) {
        return {
          data: null,
          error: 'ไม่สามารถลบสาขาได้ เนื่องจากมีพนักงานที่สังกัดสาขานี้',
          success: false
        }
      }

      // Check if branch has time entries
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('id')
        .eq('branch_id', id)
        .limit(1)

      if (timeEntries && timeEntries.length > 0) {
        return {
          data: null,
          error: 'ไม่สามารถลบสาขาได้ เนื่องจากมีการบันทึกเวลาทำงานในสาขานี้',
          success: false
        }
      }

      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting branch:', error)
        return {
          data: null,
          error: 'ไม่สามารถลบสาขาได้',
          success: false
        }
      }

      return {
        data: null,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in deleteBranch:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการลบสาขา',
        success: false
      }
    }
  }

  // Get branches with work shifts count
  async getBranchesWithShiftsCount(): Promise<BranchServiceResult<Array<Branch & { shifts_count: number }>>> {
    try {
      const supabase = this.getClient()
      
      // First, get all branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false })

      if (branchesError) {
        console.error('Error fetching branches:', branchesError)
        return {
          data: null,
          error: 'ไม่สามารถดึงข้อมูลสาขาได้',
          success: false
        }
      }

      // Get shift counts for each branch using single query
      const branchesWithCount = await Promise.all(
        (branchesData || []).map(async (branch) => {
          const { data: shiftsData, error: shiftError } = await supabase
            .from('work_shifts')
            .select('id')
            .eq('branch_id', branch.id)

          if (shiftError) {
            console.error(`Error counting shifts for branch ${branch.id}:`, shiftError)
          }

          return {
            ...branch,
            shifts_count: shiftsData?.length || 0
          }
        })
      )

      return {
        data: branchesWithCount,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in getBranchesWithShiftsCount:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสาขา',
        success: false
      }
    }
  }
}

// Export singleton instance
export const branchService = new BranchService()
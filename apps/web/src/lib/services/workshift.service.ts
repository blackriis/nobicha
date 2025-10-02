import type { Database } from '@employee-management/database'
import { createClient } from '../supabase'

type WorkShift = Database['public']['Tables']['work_shifts']['Row']
type WorkShiftInsert = Database['public']['Tables']['work_shifts']['Insert']
type WorkShiftUpdate = Database['public']['Tables']['work_shifts']['Update']

export interface CreateWorkShiftData {
  branch_id: string
  shift_name: string
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  days_of_week: number[]
}

export interface UpdateWorkShiftData {
  shift_name?: string
  start_time?: string // HH:MM format
  end_time?: string // HH:MM format
  days_of_week?: number[]
}

export interface WorkShiftServiceResult<T = unknown> {
  data: T | null
  error: string | null
  success: boolean
}

export interface WorkShiftWithBranch extends WorkShift {
  branch?: {
    id: string
    name: string
  }
}

class WorkShiftService {
  private supabase = createClient()

  // Validate time format (HH:MM)
  private validateTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  // Get all work shifts for a specific branch
  async getShiftsByBranchId(branchId: string): Promise<WorkShiftServiceResult<WorkShift[]>> {
    try {
      if (!branchId) {
        return {
          data: null,
          error: 'ID สาขาไม่ถูกต้อง',
          success: false
        }
      }

      const { data, error } = await this.supabase
        .from('work_shifts')
        .select('*')
        .eq('branch_id', branchId)
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching work shifts:', error)
        return {
          data: null,
          error: 'ไม่สามารถดึงข้อมูลกะการทำงานได้',
          success: false
        }
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in getShiftsByBranchId:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลกะการทำงาน',
        success: false
      }
    }
  }

  // Get all work shifts with branch information
  async getAllShiftsWithBranch(): Promise<WorkShiftServiceResult<WorkShiftWithBranch[]>> {
    try {
      const { data, error } = await this.supabase
        .from('work_shifts')
        .select(`
          *,
          branch:branches!work_shifts_branch_id_fkey (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching work shifts with branch:', error)
        return {
          data: null,
          error: 'ไม่สามารถดึงข้อมูลกะการทำงานได้',
          success: false
        }
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in getAllShiftsWithBranch:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลกะการทำงาน',
        success: false
      }
    }
  }

  // Get work shift by ID
  async getShiftById(id: string): Promise<WorkShiftServiceResult<WorkShiftWithBranch>> {
    try {
      if (!id) {
        return {
          data: null,
          error: 'ID กะการทำงานไม่ถูกต้อง',
          success: false
        }
      }

      const { data, error } = await this.supabase
        .from('work_shifts')
        .select(`
          *,
          branch:branches!work_shifts_branch_id_fkey (
            id,
            name
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching work shift:', error)
        return {
          data: null,
          error: error.code === 'PGRST116' ? 'ไม่พบกะการทำงานที่ต้องการ' : 'ไม่สามารถดึงข้อมูลกะการทำงานได้',
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in getShiftById:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลกะการทำงาน',
        success: false
      }
    }
  }

  // Create new work shift
  async createWorkShift(shiftData: CreateWorkShiftData): Promise<WorkShiftServiceResult<WorkShift>> {
    try {
      // Validate input data
      if (!shiftData.shift_name || shiftData.shift_name.trim().length === 0) {
        return {
          data: null,
          error: 'กรุณากรอกชื่อกะการทำงาน',
          success: false
        }
      }

      if (!shiftData.start_time || !this.validateTimeFormat(shiftData.start_time)) {
        return {
          data: null,
          error: 'กรุณากรอกเวลาเริ่มงานในรูปแบบ HH:MM',
          success: false
        }
      }

      if (!shiftData.branch_id) {
        return {
          data: null,
          error: 'กรุณาเลือกสาขา',
          success: false
        }
      }

      // Check if branch exists
      const { data: branch } = await this.supabase
        .from('branches')
        .select('id')
        .eq('id', shiftData.branch_id)
        .single()

      if (!branch) {
        return {
          data: null,
          error: 'ไม่พบสาขาที่ระบุ',
          success: false
        }
      }

      // Check for duplicate shift name in the same branch
      const { data: existingShift } = await this.supabase
        .from('work_shifts')
        .select('id')
        .eq('branch_id', shiftData.branch_id)
        .eq('shift_name', shiftData.shift_name.trim())
        .single()

      if (existingShift) {
        return {
          data: null,
          error: 'ชื่อกะการทำงานนี้มีอยู่ในสาขาแล้ว',
          success: false
        }
      }

      // Create work shift
      const insertData: WorkShiftInsert = {
        branch_id: shiftData.branch_id,
        shift_name: shiftData.shift_name.trim(),
        start_time: shiftData.start_time,
        end_time: shiftData.end_time,
        days_of_week: shiftData.days_of_week,
        is_active: true
      }

      const { data, error } = await this.supabase
        .from('work_shifts')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Error creating work shift:', error)
        return {
          data: null,
          error: 'ไม่สามารถสร้างกะการทำงานใหม่ได้',
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in createWorkShift:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการสร้างกะการทำงาน',
        success: false
      }
    }
  }

  // Update work shift
  async updateWorkShift(id: string, shiftData: UpdateWorkShiftData): Promise<WorkShiftServiceResult<WorkShift>> {
    try {
      if (!id) {
        return {
          data: null,
          error: 'ID กะการทำงานไม่ถูกต้อง',
          success: false
        }
      }

      // Validate name if provided
      if (shiftData.shift_name !== undefined && (!shiftData.shift_name || shiftData.shift_name.trim().length === 0)) {
        return {
          data: null,
          error: 'กรุณากรอกชื่อกะการทำงาน',
          success: false
        }
      }

      // Validate time format if provided
      if (shiftData.start_time !== undefined && !this.validateTimeFormat(shiftData.start_time)) {
        return {
          data: null,
          error: 'กรุณากรอกเวลาเริ่มงานในรูปแบบ HH:MM',
          success: false
        }
      }

      // Get existing shift to check branch_id for duplicate name validation
      const { data: existingShift } = await this.supabase
        .from('work_shifts')
        .select('branch_id')
        .eq('id', id)
        .single()

      if (!existingShift) {
        return {
          data: null,
          error: 'ไม่พบกะการทำงานที่ต้องการแก้ไข',
          success: false
        }
      }

      // Check for duplicate name if updating name
      if (shiftData.shift_name) {
        const { data: duplicateShift } = await this.supabase
          .from('work_shifts')
          .select('id')
          .eq('branch_id', existingShift.branch_id)
          .eq('shift_name', shiftData.shift_name.trim())
          .neq('id', id)
          .single()

        if (duplicateShift) {
          return {
            data: null,
            error: 'ชื่อกะการทำงานนี้มีอยู่ในสาขาแล้ว',
            success: false
          }
        }
      }

      // Prepare update data
      const updateData: WorkShiftUpdate = {}
      if (shiftData.shift_name !== undefined) updateData.shift_name = shiftData.shift_name.trim()
      if (shiftData.start_time !== undefined) updateData.start_time = shiftData.start_time
      if (shiftData.end_time !== undefined) updateData.end_time = shiftData.end_time
      if (shiftData.days_of_week !== undefined) updateData.days_of_week = shiftData.days_of_week

      const { data, error } = await this.supabase
        .from('work_shifts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating work shift:', error)
        return {
          data: null,
          error: 'ไม่สามารถแก้ไขกะการทำงานได้',
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in updateWorkShift:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการแก้ไขกะการทำงาน',
        success: false
      }
    }
  }

  // Delete work shift
  async deleteWorkShift(id: string): Promise<WorkShiftServiceResult<null>> {
    try {
      if (!id) {
        return {
          data: null,
          error: 'ID กะการทำงานไม่ถูกต้อง',
          success: false
        }
      }

      // Check if work shift is being used in time entries
      const { data: timeEntries } = await this.supabase
        .from('time_entries')
        .select('id')
        .eq('work_shift_id', id)
        .limit(1)

      // Note: Based on the schema, time_entries doesn't have work_shift_id field
      // This is a future-proofing check in case the schema is updated
      // For now, we'll allow deletion as work shifts are mainly for reference

      const { error } = await this.supabase
        .from('work_shifts')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting work shift:', error)
        return {
          data: null,
          error: 'ไม่สามารถลบกะการทำงานได้',
          success: false
        }
      }

      return {
        data: null,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in deleteWorkShift:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการลบกะการทำงาน',
        success: false
      }
    }
  }

  // Get work shifts statistics for admin dashboard
  async getWorkShiftsStats(): Promise<WorkShiftServiceResult<{
    total_shifts: number
    branches_with_shifts: number
    average_shifts_per_branch: number
  }>> {
    try {
      const { data: shifts, error } = await this.supabase
        .from('work_shifts')
        .select('branch_id')

      if (error) {
        console.error('Error fetching work shifts stats:', error)
        return {
          data: null,
          error: 'ไม่สามารถดึงข้อมูลสถิติกะการทำงานได้',
          success: false
        }
      }

      const total_shifts = shifts?.length || 0
      const unique_branches = new Set(shifts?.map(shift => shift.branch_id)).size
      const average_shifts_per_branch = unique_branches > 0 ? total_shifts / unique_branches : 0

      return {
        data: {
          total_shifts,
          branches_with_shifts: unique_branches,
          average_shifts_per_branch: Math.round(average_shifts_per_branch * 100) / 100
        },
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in getWorkShiftsStats:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ',
        success: false
      }
    }
  }
}

// Export singleton instance
export const workShiftService = new WorkShiftService()
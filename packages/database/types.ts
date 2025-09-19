// Database types generated from schema

export type UserRole = 'employee' | 'admin'
export type PayrollStatus = 'active' | 'completed'
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'CALCULATE'

export interface Branch {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  branch_id?: string
  employee_id?: string
  phone_number?: string
  hire_date?: string
  hourly_rate?: number
  daily_rate?: number
  is_active: boolean
  created_at: string
}

export interface WorkShift {
  id: string
  branch_id: string
  shift_name: string
  start_time: string
  end_time: string
  days_of_week: number[]
  is_active: boolean
  created_at: string
}

export interface TimeEntry {
  id: string
  user_id: string
  branch_id: string
  check_in_time: string
  check_out_time?: string
  selfie_url?: string
  break_duration: number
  total_hours?: number
  notes?: string
  created_at: string
}

export interface RawMaterial {
  id: string
  name: string
  unit: string
  cost_per_unit: number
  supplier?: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface MaterialUsage {
  id: string
  time_entry_id: string
  material_id: string
  quantity_used: number
  unit_cost: number
  total_cost: number
  notes?: string
  created_at: string
}

export interface SalesReport {
  id: string
  branch_id: string
  user_id: string
  report_date: string
  total_sales: number
  slip_image_url: string
  created_at: string
}

export interface PayrollCycle {
  id: string
  cycle_name: string
  start_date: string
  end_date: string
  pay_date: string
  status: PayrollStatus
  total_amount: number
  created_at: string
}

export interface PayrollDetail {
  id: string
  payroll_cycle_id: string
  user_id: string
  base_pay: number
  overtime_hours: number
  overtime_rate: number
  overtime_pay: number
  bonus: number
  bonus_reason?: string
  deduction: number
  deduction_reason?: string
  net_pay: number
  notes?: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: AuditAction
  table_name: string
  record_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  description?: string
  created_at: string
}

// Insert types (without id and created_at for new records)
export type BranchInsert = Omit<Branch, 'id' | 'created_at'>
export type UserInsert = Omit<User, 'id' | 'created_at'>
export type WorkShiftInsert = Omit<WorkShift, 'id' | 'created_at'>
export type TimeEntryInsert = Omit<TimeEntry, 'id' | 'created_at'>
export type RawMaterialInsert = Omit<RawMaterial, 'id' | 'created_at'>
export type MaterialUsageInsert = Omit<MaterialUsage, 'id' | 'created_at'>
export type SalesReportInsert = Omit<SalesReport, 'id' | 'created_at'>
export type PayrollCycleInsert = Omit<PayrollCycle, 'id' | 'created_at'>
export type PayrollDetailInsert = Omit<PayrollDetail, 'id' | 'created_at'>
export type AuditLogInsert = Omit<AuditLog, 'id' | 'created_at'>

// Update types (all fields optional except id)
export type BranchUpdate = Partial<Omit<Branch, 'id' | 'created_at'>>
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>
export type WorkShiftUpdate = Partial<Omit<WorkShift, 'id' | 'created_at'>>
export type TimeEntryUpdate = Partial<Omit<TimeEntry, 'id' | 'created_at'>>
export type RawMaterialUpdate = Partial<Omit<RawMaterial, 'id' | 'created_at'>>
export type MaterialUsageUpdate = Partial<Omit<MaterialUsage, 'id' | 'created_at'>>
export type SalesReportUpdate = Partial<Omit<SalesReport, 'id' | 'created_at'>>
export type PayrollCycleUpdate = Partial<Omit<PayrollCycle, 'id' | 'created_at'>>
export type PayrollDetailUpdate = Partial<Omit<PayrollDetail, 'id' | 'created_at'>>
export type AuditLogUpdate = Partial<Omit<AuditLog, 'id' | 'created_at'>>

// Database interface
export interface Database {
  public: {
    Tables: {
      branches: {
        Row: Branch
        Insert: BranchInsert
        Update: BranchUpdate
      }
      users: {
        Row: User
        Insert: UserInsert
        Update: UserUpdate
      }
      work_shifts: {
        Row: WorkShift
        Insert: WorkShiftInsert
        Update: WorkShiftUpdate
      }
      time_entries: {
        Row: TimeEntry
        Insert: TimeEntryInsert
        Update: TimeEntryUpdate
      }
      raw_materials: {
        Row: RawMaterial
        Insert: RawMaterialInsert
        Update: RawMaterialUpdate
      }
      material_usage: {
        Row: MaterialUsage
        Insert: MaterialUsageInsert
        Update: MaterialUsageUpdate
      }
      sales_reports: {
        Row: SalesReport
        Insert: SalesReportInsert
        Update: SalesReportUpdate
      }
      payroll_cycles: {
        Row: PayrollCycle
        Insert: PayrollCycleInsert
        Update: PayrollCycleUpdate
      }
      payroll_details: {
        Row: PayrollDetail
        Insert: PayrollDetailInsert
        Update: PayrollDetailUpdate
      }
      audit_logs: {
        Row: AuditLog
        Insert: AuditLogInsert
        Update: AuditLogUpdate
      }
    }
    Enums: {
      user_role: UserRole
      payroll_status: PayrollStatus
      audit_action: AuditAction
    }
  }
}

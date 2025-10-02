// Material usage service for employee reporting

import { rawMaterialsService, type RawMaterial } from './raw-materials.service'

export interface MaterialUsageItem {
  material_id: string
  quantity_used: number
}

export interface MaterialUsageRecord {
  id: string
  time_entry_id: string
  material_id: string
  quantity_used: number
  created_at: string
  raw_materials: {
    id: string
    name: string
    unit: string
    cost_per_unit?: number
  }
}

export interface MaterialUsageInput {
  materials: MaterialUsageItem[]
}

export interface CurrentSessionData {
  has_active_session: boolean
  time_entry_id?: string
  records?: MaterialUsageRecord[]
  total_cost?: number
  can_add_materials?: boolean
  message?: string
}

export interface MaterialUsageResponse {
  records: MaterialUsageRecord[]
  total_cost?: number
  time_entry_id: string
}

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class MaterialUsageService {
  private readonly baseUrl: string
  private readonly rawMaterialsUrl: string

  constructor() {
    this.baseUrl = '/api/employee/material-usage'
    this.rawMaterialsUrl = '/api/employee/raw-materials'
  }

  /**
   * Get available raw materials for employees
   */
  async getAvailableRawMaterials(): Promise<ServiceResponse<RawMaterial[]>> {
    try {
      const response = await fetch(this.rawMaterialsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout and retry configuration
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลวัตถุดิบ'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }

        return {
          success: false,
          error: errorMessage
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.data || []
      }

    } catch (error) {
      console.error('getAvailableRawMaterials error:', error)
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง'
          }
        }
        
        if (error.message.includes('Failed to fetch')) {
          return {
            success: false,
            error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
          }
        }
        
        return {
          success: false,
          error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
        }
      }
      
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
      }
    }
  }

  /**
   * Get current session material usage
   */
  async getCurrentSessionUsage(): Promise<ServiceResponse<CurrentSessionData>> {
    try {
      const response = await fetch(`${this.baseUrl}/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลการใช้วัตถุดิบ'
        }
      }

      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('getCurrentSessionUsage error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
      }
    }
  }

  /**
   * Submit material usage for current session
   */
  async submitMaterialUsage(input: MaterialUsageInput): Promise<ServiceResponse<MaterialUsageResponse>> {
    try {
      // Client-side validation
      const validationError = this.validateMaterialUsageInput(input)
      if (validationError) {
        return {
          success: false,
          error: validationError
        }
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'เกิดข้อผิดพลาดในการบันทึกการใช้วัตถุดิบ'
        }
      }

      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('submitMaterialUsage error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
      }
    }
  }

  /**
   * Client-side validation for material usage input
   */
  private validateMaterialUsageInput(input: MaterialUsageInput): string | null {
    if (!input.materials || !Array.isArray(input.materials)) {
      return 'ข้อมูลวัตถุดิบไม่ถูกต้อง'
    }

    if (input.materials.length === 0) {
      return 'กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ'
    }

    for (let i = 0; i < input.materials.length; i++) {
      const material = input.materials[i]

      if (!material.material_id || typeof material.material_id !== 'string') {
        return `วัตถุดิบลำดับที่ ${i + 1}: ต้องระบุรหัสวัตถุดิบ`
      }

      if (typeof material.quantity_used !== 'number' || isNaN(material.quantity_used)) {
        return `วัตถุดิบลำดับที่ ${i + 1}: จำนวนต้องเป็นตัวเลข`
      }

      if (material.quantity_used <= 0) {
        return `วัตถุดิบลำดับที่ ${i + 1}: จำนวนต้องเป็นตัวเลขบวกเท่านั้น`
      }

      // Check decimal places (max 2)
      const quantityStr = material.quantity_used.toString()
      const decimalPart = quantityStr.split('.')[1]
      if (decimalPart && decimalPart.length > 2) {
        return `วัตถุดิบลำดับที่ ${i + 1}: จำนวนสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง`
      }
    }

    // Check for duplicate materials
    const materialIds = input.materials.map(m => m.material_id)
    const uniqueIds = new Set(materialIds)
    if (uniqueIds.size !== materialIds.length) {
      return 'ไม่สามารถเลือกวัตถุดิบซ้ำได้'
    }

    return null
  }

  /**
   * Calculate total cost for materials (Admin only - returns 0 for employees)
   */
  calculateTotalCost(records: MaterialUsageRecord[], userRole?: string): number {
    if (userRole && userRole !== 'admin') {
      return 0
    }
    return records.reduce((sum, record) => {
      const costPerUnit = record.raw_materials.cost_per_unit ?? 0
      if (isNaN(costPerUnit) || isNaN(record.quantity_used)) {
        return sum
      }
      return sum + (record.quantity_used * costPerUnit)
    }, 0)
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    if (isNaN(amount) || amount == null) {
      return '฿0.00'
    }
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  /**
   * Format date for display (short format)
   */
  formatDateShort(dateString: string): string {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
}

// Export singleton instance
export const materialUsageService = new MaterialUsageService()
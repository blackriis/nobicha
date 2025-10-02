// Raw materials service for admin management

export interface RawMaterial {
  id: string
  name: string
  unit: string
  cost_per_unit?: number
  created_at: string
}

export interface RawMaterialInput {
  name: string
  unit: string
  cost_price: number
}

export interface RawMaterialsListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'name' | 'cost_per_unit' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface RawMaterialsListResponse {
  data: RawMaterial[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface RawMaterialsStats {
  totalMaterials: number
  activeMaterials: number
  lowStockMaterials: number
  totalValue: number
  recentUsageCost: number
  lastUpdated: string
}

class RawMaterialsService {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = '/api/admin/raw-materials'
  }

  /**
   * Get all raw materials with pagination and search
   */
  async getRawMaterials(params: RawMaterialsListParams = {}): Promise<ServiceResponse<RawMaterialsListResponse>> {
    try {
      const searchParams = new URLSearchParams()
      
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.search) searchParams.set('search', params.search)
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

      const url = `${this.baseUrl}?${searchParams.toString()}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลวัตถุดิบ'
        }
      }

      return {
        success: true,
        data: {
          data: result.data,
          pagination: result.pagination
        }
      }

    } catch (error) {
      console.error('getRawMaterials error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
      }
    }
  }

  /**
   * Create new raw material
   */
  async createRawMaterial(input: RawMaterialInput): Promise<ServiceResponse<RawMaterial>> {
    try {
      // Client-side validation
      const validationError = this.validateRawMaterialInput(input)
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
          error: result.error || 'เกิดข้อผิดพลาดในการสร้างวัตถุดิบ'
        }
      }

      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('createRawMaterial error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
      }
    }
  }

  /**
   * Update existing raw material
   */
  async updateRawMaterial(id: string, input: RawMaterialInput): Promise<ServiceResponse<RawMaterial>> {
    try {
      // Client-side validation
      const validationError = this.validateRawMaterialInput(input)
      if (validationError) {
        return {
          success: false,
          error: validationError
        }
      }

      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'เกิดข้อผิดพลาดในการแก้ไขวัตถุดิบ'
        }
      }

      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('updateRawMaterial error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
      }
    }
  }

  /**
   * Delete raw material
   */
  async deleteRawMaterial(id: string): Promise<ServiceResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'เกิดข้อผิดพลาดในการลบวัตถุดิบ'
        }
      }

      return {
        success: true
      }

    } catch (error) {
      console.error('deleteRawMaterial error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
      }
    }
  }

  /**
   * Client-side validation for raw material input
   */
  private validateRawMaterialInput(input: RawMaterialInput): string | null {
    if (!input.name || typeof input.name !== 'string') {
      return 'ชื่อวัตถุดิบเป็นข้อมูลที่จำเป็น'
    }

    const name = input.name.trim()
    if (name.length === 0 || name.length > 100) {
      return 'ชื่อวัตถุดิบต้องมีความยาว 1-100 ตัวอักษร'
    }

    if (!input.unit || typeof input.unit !== 'string') {
      return 'หน่วยนับเป็นข้อมูลที่จำเป็น'
    }

    const unit = input.unit.trim()
    if (unit.length === 0 || unit.length > 20) {
      return 'หน่วยนับต้องมีความยาว 1-20 ตัวอักษร'
    }

    if (typeof input.cost_price !== 'number' || isNaN(input.cost_price) || input.cost_price <= 0) {
      return 'ราคาต้นทุนต้องเป็นตัวเลขบวกเท่านั้น'
    }

    // Check decimal places (max 2)
    const costPriceStr = input.cost_price.toString()
    const decimalPart = costPriceStr.split('.')[1]
    if (decimalPart && decimalPart.length > 2) {
      return 'ราคาต้นทุนสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง'
    }

    return null
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
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
   * Get raw materials statistics
   */
  async getRawMaterialsStats(): Promise<ServiceResponse<RawMaterialsStats>> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'เกิดข้อผิดพลาดในการดึงสถิติวัตถุดิบ'
        }
      }

      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('getRawMaterialsStats error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
      }
    }
  }
}

// Export singleton instance
export const rawMaterialsService = new RawMaterialsService()
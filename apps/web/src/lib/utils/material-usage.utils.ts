// Utility functions for material usage validation and formatting

import type { MaterialUsageItem, MaterialUsageRecord } from '@/lib/services/material-usage.service'

/**
 * Validate individual material usage item
 */
export interface MaterialUsageValidation {
  isValid: boolean
  errors: string[]
}

export function validateMaterialUsageItem(item: MaterialUsageItem, index: number): MaterialUsageValidation {
  const errors: string[] = []

  if (!item.material_id) {
    errors.push(`วัตถุดิบลำดับที่ ${index + 1}: ต้องเลือกวัตถุดิบ`)
  }

  if (typeof item.quantity_used !== 'number' || isNaN(item.quantity_used)) {
    errors.push(`วัตถุดิบลำดับที่ ${index + 1}: จำนวนต้องเป็นตัวเลข`)
  } else if (item.quantity_used <= 0) {
    errors.push(`วัตถุดิบลำดับที่ ${index + 1}: จำนวนต้องมากกว่า 0`)
  } else if (item.quantity_used > 9999.99) {
    errors.push(`วัตถุดิบลำดับที่ ${index + 1}: จำนวนสูงสุด 9,999.99`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate array of material usage items
 */
export function validateMaterialUsageItems(items: MaterialUsageItem[]): MaterialUsageValidation {
  const errors: string[] = []

  if (!Array.isArray(items)) {
    errors.push('ข้อมูลวัตถุดิบไม่ถูกต้อง')
    return { isValid: false, errors }
  }

  if (items.length === 0) {
    errors.push('กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ')
    return { isValid: false, errors }
  }

  if (items.length > 50) {
    errors.push('สามารถเลือกวัตถุดิบได้สูงสุด 50 รายการต่อครั้ง')
  }

  // Validate each item
  items.forEach((item, index) => {
    const validation = validateMaterialUsageItem(item, index)
    errors.push(...validation.errors)
  })

  // Check for duplicate materials
  const materialIds = items.map(item => item.material_id).filter(Boolean)
  const uniqueIds = new Set(materialIds)
  if (uniqueIds.size !== materialIds.length) {
    errors.push('ไม่สามารถเลือกวัตถุดิบซ้ำได้')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format quantity for display
 */
export function formatQuantity(quantity: number, unit: string): string {
  const formattedQuantity = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(quantity)

  return `${formattedQuantity} ${unit}`
}

/**
 * Calculate cost for a single material usage
 */
export function calculateItemCost(quantity: number, costPerUnit: number): number {
  if (isNaN(quantity) || isNaN(costPerUnit) || costPerUnit == null) {
    return 0
  }
  return quantity * costPerUnit
}

/**
 * Calculate total cost for multiple material usage records (Admin only)
 * Returns 0 for non-admin users to hide cost information
 */
export function calculateTotalCost(records: MaterialUsageRecord[], userRole?: string): number {
  if (userRole && userRole !== 'admin') {
    return 0
  }
  return records.reduce((total, record) => {
    if (record.raw_materials.cost_per_unit !== undefined) {
      return total + calculateItemCost(record.quantity_used, record.raw_materials.cost_per_unit)
    }
    return total
  }, 0)
}

/**
 * Group material usage records by material for summary
 */
export interface MaterialSummary {
  material_id: string
  material_name: string
  unit: string
  total_quantity: number
  cost_per_unit: number
  total_cost: number
  usage_count: number
}

export function groupMaterialUsageByMaterial(records: MaterialUsageRecord[], userRole?: string): MaterialSummary[] {
  const isAdmin = userRole === 'admin'
  
  const grouped = records.reduce((acc, record) => {
    const materialId = record.material_id
    
    if (!acc[materialId]) {
      acc[materialId] = {
        material_id: materialId,
        material_name: record.raw_materials.name,
        unit: record.raw_materials.unit,
        total_quantity: 0,
        cost_per_unit: isAdmin ? (record.raw_materials.cost_per_unit ?? 0) : 0,
        total_cost: 0,
        usage_count: 0
      }
    }
    
    acc[materialId].total_quantity += record.quantity_used
    if (isAdmin && record.raw_materials.cost_per_unit !== undefined) {
      acc[materialId].total_cost += calculateItemCost(record.quantity_used, record.raw_materials.cost_per_unit)
    }
    acc[materialId].usage_count += 1
    
    return acc
  }, {} as Record<string, MaterialSummary>)

  return Object.values(grouped).sort((a, b) => a.material_name.localeCompare(b.material_name))
}

/**
 * Check if quantity is valid (within reasonable bounds)
 */
export function isValidQuantity(quantity: number): boolean {
  return (
    typeof quantity === 'number' &&
    !isNaN(quantity) &&
    quantity > 0 &&
    quantity <= 9999.99 &&
    Number.isFinite(quantity)
  )
}

/**
 * Parse and validate quantity input from string
 */
export function parseQuantityInput(input: string): { value: number | null; error: string | null } {
  if (!input || input.trim() === '') {
    return { value: null, error: 'จำนวนเป็นข้อมูลที่จำเป็น' }
  }

  const trimmed = input.trim()
  const parsed = parseFloat(trimmed)

  if (isNaN(parsed)) {
    return { value: null, error: 'จำนวนต้องเป็นตัวเลข' }
  }

  if (!isValidQuantity(parsed)) {
    if (parsed <= 0) {
      return { value: null, error: 'จำนวนต้องมากกว่า 0' }
    }
    if (parsed > 9999.99) {
      return { value: null, error: 'จำนวนสูงสุด 9,999.99' }
    }
    return { value: null, error: 'จำนวนไม่ถูกต้อง' }
  }

  // Check decimal places (max 2)
  const decimalPart = trimmed.split('.')[1]
  if (decimalPart && decimalPart.length > 2) {
    return { value: null, error: 'จำนวนสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง' }
  }

  return { value: parsed, error: null }
}

/**
 * Common Thai units for materials
 */
export const COMMON_THAI_UNITS = [
  'กิโลกรัม', 'กรัม', 'ลิตร', 'มิลลิลิตร', 
  'ถุง', 'กล่อง', 'ชิ้น', 'แผ่น', 'เมตร', 
  'แพ็ค', 'หลอด', 'ขวด', 'กระป๋อง'
]

/**
 * Format unit name for display
 */
export function formatUnit(unit: string): string {
  return unit.trim()
}

/**
 * Clean and format material name
 */
export function formatMaterialName(name: string): string {
  return name.trim()
}
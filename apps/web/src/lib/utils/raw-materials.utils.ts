import { RawMaterialInput } from '@/lib/services/raw-materials.service'

/**
 * Validation utilities for raw materials
 */

export interface RawMaterialValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Comprehensive validation for raw material input
 */
export function validateRawMaterialInput(input: Partial<RawMaterialInput>): RawMaterialValidationResult {
  const errors: string[] = []

  // Name validation
  if (!input.name) {
    errors.push('ชื่อวัตถุดิบเป็นข้อมูลที่จำเป็น')
  } else {
    const name = input.name.toString().trim()
    if (name.length === 0) {
      errors.push('ชื่อวัตถุดิบไม่สามารถเป็นช่องว่างได้')
    } else if (name.length > 100) {
      errors.push('ชื่อวัตถุดิบต้องมีความยาวไม่เกิน 100 ตัวอักษร')
    } else if (!/^[\u0E00-\u0E7F\w\s.-]+$/.test(name)) {
      errors.push('ชื่อวัตถุดิบมีเฉพาะตัวอักษรไทย อังกฤษ ตัวเลข เว้นวรรค จุด และ เครื่องหมายขีด')
    }
  }

  // Unit validation
  if (!input.unit) {
    errors.push('หน่วยนับเป็นข้อมูลที่จำเป็น')
  } else {
    const unit = input.unit.toString().trim()
    if (unit.length === 0) {
      errors.push('หน่วยนับไม่สามารถเป็นช่องว่างได้')
    } else if (unit.length > 20) {
      errors.push('หน่วยนับต้องมีความยาวไม่เกิน 20 ตัวอักษร')
    } else if (!/^[\u0E00-\u0E7F\w\s.-]+$/.test(unit)) {
      errors.push('หน่วยนับมีเฉพาะตัวอักษรไทย อังกฤษ ตัวเลข เว้นวรรค จุด และ เครื่องหมายขีด')
    }
  }

  // Cost price validation
  if (input.cost_price === undefined || input.cost_price === null) {
    errors.push('ราคาต้นทุนเป็นข้อมูลที่จำเป็น')
  } else {
    const costPrice = Number(input.cost_price)
    if (isNaN(costPrice)) {
      errors.push('ราคาต้นทุนต้องเป็นตัวเลข')
    } else if (costPrice <= 0) {
      errors.push('ราคาต้นทุนต้องมากกว่า 0')
    } else if (costPrice > 999999999.99) {
      errors.push('ราคาต้นทุนต้องไม่เกิน 999,999,999.99')
    } else {
      // Check decimal places
      const costPriceStr = costPrice.toString()
      const decimalPart = costPriceStr.split('.')[1]
      if (decimalPart && decimalPart.length > 2) {
        errors.push('ราคาต้นทุนสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง')
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize raw material input
 */
export function sanitizeRawMaterialInput(input: Partial<RawMaterialInput>): Partial<RawMaterialInput> {
  const sanitized: Partial<RawMaterialInput> = {}

  if (input.name) {
    sanitized.name = input.name.toString().trim()
  }

  if (input.unit) {
    sanitized.unit = input.unit.toString().trim()
  }

  if (input.cost_price !== undefined && input.cost_price !== null) {
    const costPrice = Number(input.cost_price)
    if (!isNaN(costPrice)) {
      // Round to 2 decimal places
      sanitized.cost_price = Math.round(costPrice * 100) / 100
    }
  }

  return sanitized
}

/**
 * Common Thai units for raw materials
 */
export const COMMON_UNITS = [
  'กิโลกรัม',
  'กรัม',
  'ลิตร',
  'มิลลิลิตร',
  'ชิ้น',
  'ถุง',
  'กล่อง',
  'แผ่น',
  'ห่อ',
  'ขวด',
  'กระป๋อง',
  'ซอง',
  'แพ็ค',
  'เมตร',
  'เซนติเมตร',
  'ชุด',
  'หลอด',
  'แผง'
]

/**
 * Get unit suggestions based on input
 */
export function getUnitSuggestions(input: string): string[] {
  if (!input) return COMMON_UNITS.slice(0, 5)

  const query = input.toLowerCase().trim()
  const matched = COMMON_UNITS.filter(unit => 
    unit.toLowerCase().includes(query)
  )

  // Return matched units first, then remaining common units
  const remaining = COMMON_UNITS.filter(unit => 
    !unit.toLowerCase().includes(query)
  ).slice(0, 5 - matched.length)

  return [...matched, ...remaining].slice(0, 8)
}

/**
 * Format cost price with proper Thai currency formatting
 */
export function formatCostPrice(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Parse cost price from Thai currency string
 */
export function parseCostPrice(priceString: string): number | null {
  if (!priceString) return null

  // Remove currency symbols and thousands separators
  const cleanString = priceString
    .replace(/[฿,\s]/g, '')
    .replace(/[,\s]/g, '')

  const parsed = parseFloat(cleanString)
  return isNaN(parsed) ? null : parsed
}

/**
 * Generate search keywords for raw material
 */
export function generateSearchKeywords(name: string, unit: string): string[] {
  const keywords = new Set<string>()

  // Add name words
  name.toLowerCase().split(/\s+/).forEach(word => {
    if (word.length > 1) {
      keywords.add(word)
    }
  })

  // Add unit
  if (unit && unit.length > 1) {
    keywords.add(unit.toLowerCase())
  }

  // Add partial matches for Thai text
  if (/[\u0E00-\u0E7F]/.test(name)) {
    for (let i = 0; i < name.length - 1; i++) {
      const substr = name.substring(i, i + 2)
      if (/[\u0E00-\u0E7F]/.test(substr)) {
        keywords.add(substr)
      }
    }
  }

  return Array.from(keywords)
}

/**
 * Compare raw materials for sorting
 */
export function compareRawMaterials(
  a: { name: string; cost_per_unit: number; created_at: string },
  b: { name: string; cost_per_unit: number; created_at: string },
  sortBy: 'name' | 'cost_per_unit' | 'created_at',
  ascending = true
): number {
  let comparison = 0

  switch (sortBy) {
    case 'name':
      comparison = a.name.localeCompare(b.name, 'th')
      break
    case 'cost_per_unit':
      comparison = a.cost_per_unit - b.cost_per_unit
      break
    case 'created_at':
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      break
    default:
      comparison = 0
  }

  return ascending ? comparison : -comparison
}
import { describe, it, expect } from 'vitest'
import {
  validateMaterialUsageItem,
  validateMaterialUsageItems,
  formatQuantity,
  calculateItemCost,
  calculateTotalCost,
  groupMaterialUsageByMaterial,
  isValidQuantity,
  parseQuantityInput,
  formatUnit,
  formatMaterialName
} from '@/lib/utils/material-usage.utils'
import type { MaterialUsageRecord } from '@/lib/services/material-usage.service'

describe('Material Usage Utils', () => {
  describe('validateMaterialUsageItem', () => {
    it('should validate correct material usage item', () => {
      const item = {
        material_id: 'material-1',
        quantity_used: 2.5
      }

      const result = validateMaterialUsageItem(item, 0)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing material_id', () => {
      const item = {
        material_id: '',
        quantity_used: 2.5
      }

      const result = validateMaterialUsageItem(item, 0)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('วัตถุดิบลำดับที่ 1: ต้องเลือกวัตถุดิบ')
    })

    it('should reject invalid quantity', () => {
      const item = {
        material_id: 'material-1',
        quantity_used: -1
      }

      const result = validateMaterialUsageItem(item, 0)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('วัตถุดิบลำดับที่ 1: จำนวนต้องมากกว่า 0')
    })

    it('should reject quantity that is too high', () => {
      const item = {
        material_id: 'material-1',
        quantity_used: 10000
      }

      const result = validateMaterialUsageItem(item, 0)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('วัตถุดิบลำดับที่ 1: จำนวนสูงสุด 9,999.99')
    })

    it('should reject NaN quantity', () => {
      const item = {
        material_id: 'material-1',
        quantity_used: NaN
      }

      const result = validateMaterialUsageItem(item, 0)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('วัตถุดิบลำดับที่ 1: จำนวนต้องเป็นตัวเลข')
    })
  })

  describe('validateMaterialUsageItems', () => {
    it('should validate correct material usage items', () => {
      const items = [
        { material_id: 'material-1', quantity_used: 2.5 },
        { material_id: 'material-2', quantity_used: 1.0 }
      ]

      const result = validateMaterialUsageItems(items)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty array', () => {
      const result = validateMaterialUsageItems([])
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ')
    })

    it('should reject non-array input', () => {
      const result = validateMaterialUsageItems(null as any)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ข้อมูลวัตถุดิบไม่ถูกต้อง')
    })

    it('should reject too many items', () => {
      const items = Array(51).fill(null).map((_, i) => ({
        material_id: `material-${i}`,
        quantity_used: 1.0
      }))

      const result = validateMaterialUsageItems(items)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('สามารถเลือกวัตถุดิบได้สูงสุด 50 รายการต่อครั้ง')
    })

    it('should reject duplicate materials', () => {
      const items = [
        { material_id: 'material-1', quantity_used: 2.5 },
        { material_id: 'material-1', quantity_used: 1.0 }
      ]

      const result = validateMaterialUsageItems(items)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ไม่สามารถเลือกวัตถุดิบซ้ำได้')
    })
  })

  describe('formatQuantity', () => {
    it('should format quantity with unit', () => {
      const formatted = formatQuantity(2.5, 'ลิตร')
      expect(formatted).toBe('2.5 ลิตร')
    })

    it('should format whole number without decimals', () => {
      const formatted = formatQuantity(3, 'กิโลกรัม')
      expect(formatted).toBe('3 กิโลกรัม')
    })

    it('should format with proper Thai number formatting', () => {
      const formatted = formatQuantity(1234.56, 'ชิ้น')
      expect(formatted).toBe('1,234.56 ชิ้น')
    })
  })

  describe('calculateItemCost', () => {
    it('should calculate item cost correctly', () => {
      const cost = calculateItemCost(2.5, 25.50)
      expect(cost).toBe(63.75)
    })

    it('should handle zero quantity', () => {
      const cost = calculateItemCost(0, 25.50)
      expect(cost).toBe(0)
    })

    it('should handle zero cost per unit', () => {
      const cost = calculateItemCost(2.5, 0)
      expect(cost).toBe(0)
    })
  })

  describe('calculateTotalCost', () => {
    it('should calculate total cost for multiple records (admin)', () => {
      const records: MaterialUsageRecord[] = [
        {
          id: 'usage-1',
          time_entry_id: 'time-entry-1',
          material_id: 'material-1',
          quantity_used: 2.5,
          created_at: '2025-01-01T10:00:00Z',
          raw_materials: {
            id: 'material-1',
            name: 'น้ำมันพืช',
            unit: 'ลิตร',
            cost_per_unit: 25.50
          }
        },
        {
          id: 'usage-2',
          time_entry_id: 'time-entry-1',
          material_id: 'material-2',
          quantity_used: 1.0,
          created_at: '2025-01-01T10:05:00Z',
          raw_materials: {
            id: 'material-2',
            name: 'เกลือ',
            unit: 'กิโลกรัม',
            cost_per_unit: 15.00
          }
        }
      ]

      const totalCost = calculateTotalCost(records, 'admin')
      expect(totalCost).toBe(78.75) // (2.5 * 25.50) + (1.0 * 15.00)
    })

    it('should return 0 for empty records', () => {
      const totalCost = calculateTotalCost([], 'admin')
      expect(totalCost).toBe(0)
    })

    it('should return 0 for employee role', () => {
      const records: MaterialUsageRecord[] = [
        {
          id: 'usage-1',
          time_entry_id: 'time-entry-1',
          material_id: 'material-1',
          quantity_used: 2.5,
          created_at: '2025-01-01T10:00:00Z',
          raw_materials: {
            id: 'material-1',
            name: 'น้ำมันพืช',
            unit: 'ลิตร',
            cost_per_unit: 25.50
          }
        }
      ]

      const totalCost = calculateTotalCost(records, 'employee')
      expect(totalCost).toBe(0)
    })
  })

  describe('groupMaterialUsageByMaterial', () => {
    it('should group materials correctly (admin)', () => {
      const records: MaterialUsageRecord[] = [
        {
          id: 'usage-1',
          time_entry_id: 'time-entry-1',
          material_id: 'material-1',
          quantity_used: 2.5,
          created_at: '2025-01-01T10:00:00Z',
          raw_materials: {
            id: 'material-1',
            name: 'น้ำมันพืช',
            unit: 'ลิตร',
            cost_per_unit: 25.50
          }
        },
        {
          id: 'usage-2',
          time_entry_id: 'time-entry-1',
          material_id: 'material-1',
          quantity_used: 1.5,
          created_at: '2025-01-01T10:05:00Z',
          raw_materials: {
            id: 'material-1',
            name: 'น้ำมันพืช',
            unit: 'ลิตร',
            cost_per_unit: 25.50
          }
        }
      ]

      const grouped = groupMaterialUsageByMaterial(records, 'admin')
      
      expect(grouped).toHaveLength(1)
      expect(grouped[0].material_id).toBe('material-1')
      expect(grouped[0].total_quantity).toBe(4.0) // 2.5 + 1.5
      expect(grouped[0].usage_count).toBe(2)
      expect(grouped[0].total_cost).toBe(102.0) // (2.5 + 1.5) * 25.50
    })

    it('should handle empty records', () => {
      const grouped = groupMaterialUsageByMaterial([], 'admin')
      expect(grouped).toHaveLength(0)
    })

    it('should sort materials by name', () => {
      const records: MaterialUsageRecord[] = [
        {
          id: 'usage-1',
          time_entry_id: 'time-entry-1',
          material_id: 'material-1',
          quantity_used: 1.0,
          created_at: '2025-01-01T10:00:00Z',
          raw_materials: {
            id: 'material-1',
            name: 'เกลือ', // Comes after น้ำมันพืช alphabetically
            unit: 'กิโลกรัม',
            cost_per_unit: 15.00
          }
        },
        {
          id: 'usage-2',
          time_entry_id: 'time-entry-1',
          material_id: 'material-2',
          quantity_used: 1.0,
          created_at: '2025-01-01T10:05:00Z',
          raw_materials: {
            id: 'material-2',
            name: 'น้ำมันพืช',
            unit: 'ลิตร',
            cost_per_unit: 25.50
          }
        }
      ]

      const grouped = groupMaterialUsageByMaterial(records, 'admin')
      
      expect(grouped[0].material_name).toBe('เกลือ')
      expect(grouped[1].material_name).toBe('น้ำมันพืช')
    })
  })

  describe('isValidQuantity', () => {
    it('should accept valid quantities', () => {
      expect(isValidQuantity(1)).toBe(true)
      expect(isValidQuantity(0.01)).toBe(true)
      expect(isValidQuantity(9999.99)).toBe(true)
      expect(isValidQuantity(123.45)).toBe(true)
    })

    it('should reject invalid quantities', () => {
      expect(isValidQuantity(0)).toBe(false)
      expect(isValidQuantity(-1)).toBe(false)
      expect(isValidQuantity(10000)).toBe(false)
      expect(isValidQuantity(NaN)).toBe(false)
      expect(isValidQuantity(Infinity)).toBe(false)
      expect(isValidQuantity(-Infinity)).toBe(false)
    })

    it('should reject non-numbers', () => {
      expect(isValidQuantity('1' as any)).toBe(false)
      expect(isValidQuantity(null as any)).toBe(false)
      expect(isValidQuantity(undefined as any)).toBe(false)
    })
  })

  describe('parseQuantityInput', () => {
    it('should parse valid quantity strings', () => {
      const result = parseQuantityInput('2.5')
      expect(result.value).toBe(2.5)
      expect(result.error).toBeNull()
    })

    it('should parse whole numbers', () => {
      const result = parseQuantityInput('5')
      expect(result.value).toBe(5)
      expect(result.error).toBeNull()
    })

    it('should handle empty input', () => {
      const result = parseQuantityInput('')
      expect(result.value).toBeNull()
      expect(result.error).toBe('จำนวนเป็นข้อมูลที่จำเป็น')
    })

    it('should handle whitespace', () => {
      const result = parseQuantityInput('  2.5  ')
      expect(result.value).toBe(2.5)
      expect(result.error).toBeNull()
    })

    it('should reject invalid number strings', () => {
      const result = parseQuantityInput('abc')
      expect(result.value).toBeNull()
      expect(result.error).toBe('จำนวนต้องเป็นตัวเลข')
    })

    it('should reject negative numbers', () => {
      const result = parseQuantityInput('-1')
      expect(result.value).toBeNull()
      expect(result.error).toBe('จำนวนต้องมากกว่า 0')
    })

    it('should reject numbers that are too large', () => {
      const result = parseQuantityInput('10000')
      expect(result.value).toBeNull()
      expect(result.error).toBe('จำนวนสูงสุด 9,999.99')
    })

    it('should reject too many decimal places', () => {
      const result = parseQuantityInput('1.234')
      expect(result.value).toBeNull()
      expect(result.error).toBe('จำนวนสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง')
    })
  })

  describe('formatUnit', () => {
    it('should format unit by trimming whitespace', () => {
      expect(formatUnit('  ลิตร  ')).toBe('ลิตร')
      expect(formatUnit('กิโลกรัม')).toBe('กิโลกรัม')
    })
  })

  describe('formatMaterialName', () => {
    it('should format material name by trimming whitespace', () => {
      expect(formatMaterialName('  น้ำมันพืช  ')).toBe('น้ำมันพืช')
      expect(formatMaterialName('เกลือ')).toBe('เกลือ')
    })
  })
})
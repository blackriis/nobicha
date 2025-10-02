import { describe, it, expect } from 'vitest'
import {
  validateMaterialUsageItem,
  validateMaterialUsageItems,
  calculateItemCost,
  calculateTotalCost,
  isValidQuantity,
  parseQuantityInput,
  formatQuantity,
  groupMaterialUsageByMaterial
} from '@/lib/utils/material-usage.utils'
import type { MaterialUsageRecord, MaterialUsageItem } from '@/lib/services/material-usage.service'

describe('Material Usage Logic Tests', () => {
  describe('Validation Logic', () => {
    it('should validate material usage item correctly', () => {
      const validItem: MaterialUsageItem = {
        material_id: 'material-1',
        quantity_used: 2.5
      }
      
      const result = validateMaterialUsageItem(validItem, 0)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid material usage item', () => {
      const invalidItem: MaterialUsageItem = {
        material_id: '',
        quantity_used: -1
      }
      
      const result = validateMaterialUsageItem(invalidItem, 0)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate multiple material usage items', () => {
      const items: MaterialUsageItem[] = [
        { material_id: 'material-1', quantity_used: 2.5 },
        { material_id: 'material-2', quantity_used: 1.0 }
      ]
      
      const result = validateMaterialUsageItems(items)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject duplicate materials', () => {
      const items: MaterialUsageItem[] = [
        { material_id: 'material-1', quantity_used: 2.5 },
        { material_id: 'material-1', quantity_used: 1.0 }
      ]
      
      const result = validateMaterialUsageItems(items)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ไม่สามารถเลือกวัตถุดิบซ้ำได้')
    })
  })

  describe('Quantity Validation', () => {
    it('should validate positive quantities', () => {
      expect(isValidQuantity(1.0)).toBe(true)
      expect(isValidQuantity(0.01)).toBe(true)
      expect(isValidQuantity(9999.99)).toBe(true)
    })

    it('should reject invalid quantities', () => {
      expect(isValidQuantity(0)).toBe(false)
      expect(isValidQuantity(-1)).toBe(false)
      expect(isValidQuantity(10000)).toBe(false)
      expect(isValidQuantity(NaN)).toBe(false)
    })

    it('should parse quantity input correctly', () => {
      expect(parseQuantityInput('2.5').value).toBe(2.5)
      expect(parseQuantityInput('2.5').error).toBeNull()
      
      expect(parseQuantityInput('').value).toBeNull()
      expect(parseQuantityInput('').error).toBe('จำนวนเป็นข้อมูลที่จำเป็น')
      
      expect(parseQuantityInput('abc').value).toBeNull()
      expect(parseQuantityInput('abc').error).toBe('จำนวนต้องเป็นตัวเลข')
    })
  })

  describe('Cost Calculations', () => {
    it('should calculate item cost correctly', () => {
      expect(calculateItemCost(2.5, 25.50)).toBe(63.75)
      expect(calculateItemCost(0, 25.50)).toBe(0)
      expect(calculateItemCost(2.5, 0)).toBe(0)
    })

    it('should calculate total cost for admin only', () => {
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

      // Admin should see cost
      expect(calculateTotalCost(records, 'admin')).toBe(63.75)
      
      // Employee should not see cost
      expect(calculateTotalCost(records, 'employee')).toBe(0)
      expect(calculateTotalCost(records, 'user')).toBe(0)
    })
  })

  describe('Formatting', () => {
    it('should format quantity with unit', () => {
      expect(formatQuantity(2.5, 'ลิตร')).toBe('2.5 ลิตร')
      expect(formatQuantity(3, 'กิโลกรัม')).toBe('3 กิโลกรัม')
    })

    it('should format large quantities with commas', () => {
      expect(formatQuantity(1234.56, 'ชิ้น')).toBe('1,234.56 ชิ้น')
    })
  })

  describe('Grouping Logic', () => {
    it('should group materials by ID correctly', () => {
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
      expect(grouped[0].total_quantity).toBe(4.0)
      expect(grouped[0].usage_count).toBe(2)
      expect(grouped[0].total_cost).toBe(102.0)
    })

    it('should hide costs from non-admin users', () => {
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

      const grouped = groupMaterialUsageByMaterial(records, 'employee')
      
      expect(grouped).toHaveLength(1)
      expect(grouped[0].cost_per_unit).toBe(0)
      expect(grouped[0].total_cost).toBe(0)
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
            name: 'เกลือ',
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
      
      // Should be sorted by Thai alphabet
      expect(grouped[0].material_name).toBe('เกลือ')
      expect(grouped[1].material_name).toBe('น้ำมันพืช')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty arrays gracefully', () => {
      expect(validateMaterialUsageItems([]).isValid).toBe(false)
      expect(calculateTotalCost([], 'admin')).toBe(0)
      expect(groupMaterialUsageByMaterial([], 'admin')).toHaveLength(0)
    })

    it('should handle null/undefined values safely', () => {
      expect(calculateItemCost(NaN, 25.50)).toBe(0)
      expect(calculateItemCost(2.5, NaN)).toBe(0)
    })

    it('should validate decimal places correctly', () => {
      const result = parseQuantityInput('1.123')
      expect(result.value).toBeNull()
      expect(result.error).toBe('จำนวนสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง')
    })
  })
})
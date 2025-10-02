import { describe, it, expect } from 'vitest'
import {
  validateRawMaterialInput,
  sanitizeRawMaterialInput,
  getUnitSuggestions,
  formatCostPrice,
  parseCostPrice,
  generateSearchKeywords,
  compareRawMaterials,
  COMMON_UNITS
} from '@/lib/utils/raw-materials.utils'

describe('Raw Materials Utils', () => {
  describe('validateRawMaterialInput', () => {
    it('should validate valid input', () => {
      const input = {
        name: 'น้ำมันพืช',
        unit: 'ลิตร',
        cost_price: 25.50
      }

      const result = validateRawMaterialInput(input)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty name', () => {
      const input = {
        name: '',
        unit: 'ลิตร',
        cost_price: 25.50
      }

      const result = validateRawMaterialInput(input)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ชื่อวัตถุดิบไม่สามารถเป็นช่องว่างได้')
    })

    it('should reject name that is too long', () => {
      const input = {
        name: 'a'.repeat(101), // 101 characters
        unit: 'ลิตร',
        cost_price: 25.50
      }

      const result = validateRawMaterialInput(input)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ชื่อวัตถุดิบต้องมีความยาวไม่เกิน 100 ตัวอักษร')
    })

    it('should reject invalid characters in name', () => {
      const input = {
        name: 'น้ำมัน@พืช#', // Contains invalid characters
        unit: 'ลิตร',
        cost_price: 25.50
      }

      const result = validateRawMaterialInput(input)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ชื่อวัตถุดิบมีเฉพาะตัวอักษรไทย อังกฤษ ตัวเลข เว้นวรรค จุด และ เครื่องหมายขีด')
    })

    it('should reject empty unit', () => {
      const input = {
        name: 'น้ำมันพืช',
        unit: '',
        cost_price: 25.50
      }

      const result = validateRawMaterialInput(input)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('หน่วยนับไม่สามารถเป็นช่องว่างได้')
    })

    it('should reject unit that is too long', () => {
      const input = {
        name: 'น้ำมันพืช',
        unit: 'a'.repeat(21), // 21 characters
        cost_price: 25.50
      }

      const result = validateRawMaterialInput(input)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('หน่วยนับต้องมีความยาวไม่เกิน 20 ตัวอักษร')
    })

    it('should reject negative cost price', () => {
      const input = {
        name: 'น้ำมันพืช',
        unit: 'ลิตร',
        cost_price: -5
      }

      const result = validateRawMaterialInput(input)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ราคาต้นทุนต้องมากกว่า 0')
    })

    it('should reject zero cost price', () => {
      const input = {
        name: 'น้ำมันพืช',
        unit: 'ลิตร',
        cost_price: 0
      }

      const result = validateRawMaterialInput(input)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ราคาต้นทุนต้องมากกว่า 0')
    })

    it('should reject cost price that is too high', () => {
      const input = {
        name: 'น้ำมันพืช',
        unit: 'ลิตร',
        cost_price: 1000000000 // 1 billion
      }

      const result = validateRawMaterialInput(input)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ราคาต้นทุนต้องไม่เกิน 999,999,999.99')
    })

    it('should reject cost price with too many decimal places', () => {
      const input = {
        name: 'น้ำมันพืช',
        unit: 'ลิตร',
        cost_price: 25.555 // 3 decimal places
      }

      const result = validateRawMaterialInput(input)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ราคาต้นทุนสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง')
    })

    it('should reject missing fields', () => {
      const input = {}

      const result = validateRawMaterialInput(input)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ชื่อวัตถุดิบเป็นข้อมูลที่จำเป็น')
      expect(result.errors).toContain('หน่วยนับเป็นข้อมูลที่จำเป็น')
      expect(result.errors).toContain('ราคาต้นทุนเป็นข้อมูลที่จำเป็น')
    })
  })

  describe('sanitizeRawMaterialInput', () => {
    it('should trim whitespace from strings', () => {
      const input = {
        name: '  น้ำมันพืช  ',
        unit: '  ลิตร  ',
        cost_price: 25.50
      }

      const result = sanitizeRawMaterialInput(input)
      
      expect(result.name).toBe('น้ำมันพืช')
      expect(result.unit).toBe('ลิตร')
      expect(result.cost_price).toBe(25.50)
    })

    it('should round cost price to 2 decimal places', () => {
      const input = {
        name: 'น้ำมันพืช',
        unit: 'ลิตร',
        cost_price: 25.555
      }

      const result = sanitizeRawMaterialInput(input)
      
      expect(result.cost_price).toBe(25.56)
    })

    it('should handle partial input', () => {
      const input = {
        name: 'น้ำมันพืช'
      }

      const result = sanitizeRawMaterialInput(input)
      
      expect(result.name).toBe('น้ำมันพืช')
      expect(result.unit).toBeUndefined()
      expect(result.cost_price).toBeUndefined()
    })

    it('should handle invalid cost price gracefully', () => {
      const input = {
        name: 'น้ำมันพืช',
        unit: 'ลิตร',
        cost_price: 'invalid' as any
      }

      const result = sanitizeRawMaterialInput(input)
      
      expect(result.name).toBe('น้ำมันพืช')
      expect(result.unit).toBe('ลิตร')
      expect(result.cost_price).toBeUndefined()
    })
  })

  describe('getUnitSuggestions', () => {
    it('should return common units for empty input', () => {
      const suggestions = getUnitSuggestions('')
      
      expect(suggestions).toHaveLength(5)
      expect(suggestions).toEqual(COMMON_UNITS.slice(0, 5))
    })

    it('should filter units based on input', () => {
      const suggestions = getUnitSuggestions('กิ')
      
      expect(suggestions).toContain('กิโลกรัม')
      expect(suggestions.length).toBeLessThanOrEqual(8)
    })

    it('should return up to 8 suggestions', () => {
      const suggestions = getUnitSuggestions('ก')
      
      expect(suggestions.length).toBeLessThanOrEqual(8)
    })

    it('should prioritize exact matches', () => {
      const suggestions = getUnitSuggestions('ลิตร')
      
      expect(suggestions[0]).toBe('ลิตร')
    })
  })

  describe('formatCostPrice', () => {
    it('should format cost price in Thai currency', () => {
      expect(formatCostPrice(25.50)).toBe('฿25.50')
      expect(formatCostPrice(1000)).toBe('฿1,000.00')
      expect(formatCostPrice(0.99)).toBe('฿0.99')
    })

    it('should handle large numbers', () => {
      const formatted = formatCostPrice(1000000)
      expect(formatted).toContain('฿')
      expect(formatted).toContain('1,000,000')
    })
  })

  describe('parseCostPrice', () => {
    it('should parse Thai currency string', () => {
      expect(parseCostPrice('฿25.50')).toBe(25.50)
      expect(parseCostPrice('฿1,000.00')).toBe(1000)
      expect(parseCostPrice('25.50')).toBe(25.50)
    })

    it('should handle invalid input', () => {
      expect(parseCostPrice('')).toBe(null)
      expect(parseCostPrice('invalid')).toBe(null)
      expect(parseCostPrice('abc฿123')).toBe(123)
    })

    it('should remove currency symbols and separators', () => {
      expect(parseCostPrice('฿ 1,234.56')).toBe(1234.56)
      expect(parseCostPrice('1,000')).toBe(1000)
    })
  })

  describe('generateSearchKeywords', () => {
    it('should extract keywords from name and unit', () => {
      const keywords = generateSearchKeywords('น้ำมันพืช คุณภาพดี', 'ลิตร')
      
      expect(keywords).toContain('น้ำมันพืช')
      expect(keywords).toContain('คุณภาพดี')
      expect(keywords).toContain('ลิตร')
    })

    it('should handle Thai text partial matches', () => {
      const keywords = generateSearchKeywords('น้ำมัน', 'ลิตร')
      
      expect(keywords.length).toBeGreaterThan(2) // Should include partial matches
    })

    it('should filter out single characters', () => {
      const keywords = generateSearchKeywords('น้ำมัน พ', 'ล')
      
      expect(keywords).not.toContain('พ')
      expect(keywords).not.toContain('ล')
    })
  })

  describe('compareRawMaterials', () => {
    const materialA = {
      name: 'น้ำมันพืช',
      cost_per_unit: 25.50,
      created_at: '2025-01-01T00:00:00Z'
    }

    const materialB = {
      name: 'แป้งสาลี',
      cost_per_unit: 15.00,
      created_at: '2025-01-02T00:00:00Z'
    }

    it('should sort by name ascending', () => {
      const result = compareRawMaterials(materialA, materialB, 'name', true)
      
      // Thai sorting: น comes after แ
      expect(result).toBeGreaterThan(0)
    })

    it('should sort by name descending', () => {
      const result = compareRawMaterials(materialA, materialB, 'name', false)
      
      // Thai sorting: น comes after แ, but descending
      expect(result).toBeLessThan(0)
    })

    it('should sort by cost_per_unit ascending', () => {
      const result = compareRawMaterials(materialA, materialB, 'cost_per_unit', true)
      
      // 25.50 > 15.00
      expect(result).toBeGreaterThan(0)
    })

    it('should sort by cost_per_unit descending', () => {
      const result = compareRawMaterials(materialA, materialB, 'cost_per_unit', false)
      
      // 25.50 > 15.00, but descending
      expect(result).toBeLessThan(0)
    })

    it('should sort by created_at ascending', () => {
      const result = compareRawMaterials(materialA, materialB, 'created_at', true)
      
      // 2025-01-01 < 2025-01-02
      expect(result).toBeLessThan(0)
    })

    it('should sort by created_at descending', () => {
      const result = compareRawMaterials(materialA, materialB, 'created_at', false)
      
      // 2025-01-01 < 2025-01-02, but descending
      expect(result).toBeGreaterThan(0)
    })
  })

  describe('COMMON_UNITS', () => {
    it('should contain expected Thai units', () => {
      expect(COMMON_UNITS).toContain('กิโลกรัม')
      expect(COMMON_UNITS).toContain('ลิตร')
      expect(COMMON_UNITS).toContain('ชิ้น')
      expect(COMMON_UNITS).toContain('ถุง')
      expect(COMMON_UNITS.length).toBeGreaterThan(10)
    })

    it('should not contain duplicate units', () => {
      const uniqueUnits = [...new Set(COMMON_UNITS)]
      expect(uniqueUnits.length).toBe(COMMON_UNITS.length)
    })
  })
})
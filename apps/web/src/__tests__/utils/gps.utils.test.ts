import { describe, it, expect } from 'vitest'
import { 
  calculateDistance, 
  validateGPSCoordinates, 
  findNearbyBranches,
  isWithinAllowedRadius,
  formatGPSCoordinates,
  dmsToDecimal,
  generateThailandTestCoordinates
} from '@/lib/utils/gps.utils'
import type { Database } from '@employee-management/database'

type Branch = Database['public']['Tables']['branches']['Row']

describe('GPS Utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between Bangkok and Chiang Mai correctly', () => {
      const bangkok = { latitude: 13.7563, longitude: 100.5018 }
      const chiangmai = { latitude: 18.7883, longitude: 98.9853 }
      
      const distance = calculateDistance(bangkok, chiangmai)
      
      // Distance should be approximately 583km (583000 meters)
      expect(distance).toBeGreaterThan(580000)
      expect(distance).toBeLessThan(590000)
    })

    it('should return 0 for identical coordinates', () => {
      const point = { latitude: 13.7563, longitude: 100.5018 }
      
      const distance = calculateDistance(point, point)
      
      expect(distance).toBe(0)
    })

    it('should calculate short distances accurately', () => {
      const point1 = { latitude: 13.7563, longitude: 100.5018 }
      const point2 = { latitude: 13.7564, longitude: 100.5019 }
      
      const distance = calculateDistance(point1, point2)
      
      // Should be about 15 meters
      expect(distance).toBeGreaterThan(10)
      expect(distance).toBeLessThan(20)
    })
  })

  describe('validateGPSCoordinates', () => {
    it('should accept valid GPS coordinates', () => {
      const result = validateGPSCoordinates(13.7563, 100.5018)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject latitude out of range', () => {
      const result = validateGPSCoordinates(91, 100.5018)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Latitude must be between -90 and 90 degrees')
    })

    it('should reject longitude out of range', () => {
      const result = validateGPSCoordinates(13.7563, 181)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Longitude must be between -180 and 180 degrees')
    })

    it('should reject non-numeric values', () => {
      const result = validateGPSCoordinates(NaN, 100.5018)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Latitude must be a valid number')
    })

    it('should reject excessive precision', () => {
      const result = validateGPSCoordinates(13.12345678, 100.5018)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Latitude precision should not exceed 7 decimal places')
    })

    it('should accept valid precision', () => {
      const result = validateGPSCoordinates(13.1234567, 100.5018123)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('findNearbyBranches', () => {
    const mockBranches: Branch[] = [
      {
        id: '1',
        name: 'Close Branch',
        latitude: 13.7563,
        longitude: 100.5018,
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Far Branch', 
        latitude: 18.7883, // Chiang Mai - ~583km away
        longitude: 98.9853,
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '3',
        name: 'Very Close Branch',
        latitude: 13.7564, // ~15m away
        longitude: 100.5019,
        created_at: '2025-01-01T00:00:00Z'
      }
    ]

    const userLocation = { latitude: 13.7563, longitude: 100.5018 }

    it('should find branches within 100m radius by default', () => {
      const nearby = findNearbyBranches(userLocation, mockBranches)
      
      expect(nearby).toHaveLength(2) // Close Branch (0m) + Very Close Branch (~15m)
      expect(nearby[0].name).toBe('Close Branch') // Closest first
      expect(nearby[1].name).toBe('Very Close Branch')
    })

    it('should respect custom radius', () => {
      const nearby = findNearbyBranches(userLocation, mockBranches, 10)
      
      expect(nearby).toHaveLength(1) // Only Close Branch (0m)
      expect(nearby[0].name).toBe('Close Branch')
    })

    it('should include distance property', () => {
      const nearby = findNearbyBranches(userLocation, mockBranches)
      
      expect(nearby[0]).toHaveProperty('distance')
      expect(nearby[0].distance).toBe(0)
      expect(nearby[1].distance).toBeGreaterThan(10)
      expect(nearby[1].distance).toBeLessThan(20)
    })

    it('should sort by distance (nearest first)', () => {
      const nearby = findNearbyBranches(userLocation, mockBranches)
      
      for (let i = 1; i < nearby.length; i++) {
        expect(nearby[i].distance).toBeGreaterThanOrEqual(nearby[i-1].distance)
      }
    })
  })

  describe('isWithinAllowedRadius', () => {
    const mockBranches: Branch[] = [
      {
        id: '1',
        name: 'Close Branch',
        latitude: 13.7564,
        longitude: 100.5019,
        created_at: '2025-01-01T00:00:00Z'
      }
    ]

    const userLocation = { latitude: 13.7563, longitude: 100.5018 }

    it('should return true when user is within radius', () => {
      const result = isWithinAllowedRadius(userLocation, mockBranches, 100)
      
      expect(result).toBe(true)
    })

    it('should return false when user is outside radius', () => {
      const result = isWithinAllowedRadius(userLocation, mockBranches, 10)
      
      expect(result).toBe(false)
    })

    it('should return false when no branches exist', () => {
      const result = isWithinAllowedRadius(userLocation, [], 100)
      
      expect(result).toBe(false)
    })
  })

  describe('formatGPSCoordinates', () => {
    it('should format coordinates with direction indicators', () => {
      const formatted = formatGPSCoordinates(13.7563, 100.5018)
      
      expect(formatted).toBe('13.7563°N, 100.5018°E')
    })

    it('should handle negative coordinates', () => {
      const formatted = formatGPSCoordinates(-13.7563, -100.5018)
      
      expect(formatted).toBe('13.7563°S, 100.5018°W')
    })

    it('should respect precision parameter', () => {
      const formatted = formatGPSCoordinates(13.7563, 100.5018, 2)
      
      expect(formatted).toBe('13.76°N, 100.5°E')
    })
  })

  describe('dmsToDecimal', () => {
    it('should convert DMS to decimal degrees for North/East', () => {
      const decimal = dmsToDecimal(13, 45, 22.68, 'N')
      
      expect(decimal).toBeCloseTo(13.7563, 4)
    })

    it('should convert DMS to decimal degrees for South/West', () => {
      const decimal = dmsToDecimal(13, 45, 22.68, 'S')
      
      expect(decimal).toBeCloseTo(-13.7563, 4)
    })
  })

  describe('generateThailandTestCoordinates', () => {
    it('should generate coordinates within Thailand bounds', () => {
      const coords = generateThailandTestCoordinates()
      
      // Thailand bounds: lat 5.6-20.5, lng 97.3-105.6
      expect(coords.latitude).toBeGreaterThan(5.6)
      expect(coords.latitude).toBeLessThan(20.5)
      expect(coords.longitude).toBeGreaterThan(97.3)
      expect(coords.longitude).toBeLessThan(105.6)
    })

    it('should generate different coordinates on multiple calls', () => {
      const coords1 = generateThailandTestCoordinates()
      const coords2 = generateThailandTestCoordinates()
      
      // Should be different (very low probability of collision)
      expect(coords1.latitude).not.toBe(coords2.latitude)
      expect(coords1.longitude).not.toBe(coords2.longitude)
    })
  })
})
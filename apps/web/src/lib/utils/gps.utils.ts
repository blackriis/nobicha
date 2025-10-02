import type { Database } from '@employee-management/database'

type Branch = Database['public']['Tables']['branches']['Row']

export interface GPSCoordinate {
  latitude: number
  longitude: number
}

export interface GPSValidationResult {
  valid: boolean
  errors: string[]
}

export interface NearbyBranch extends Branch {
  distance: number // in meters
}

// Haversine formula to calculate distance between two GPS points
export function calculateDistance(
  point1: GPSCoordinate,
  point2: GPSCoordinate
): number {
  const R = 6371000 // Earth's radius in meters
  
  const φ1 = (point1.latitude * Math.PI) / 180
  const φ2 = (point2.latitude * Math.PI) / 180
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

// Validate GPS coordinates format and range
export function validateGPSCoordinates(
  latitude: number,
  longitude: number
): GPSValidationResult {
  const errors: string[] = []

  // Latitude validation (-90 to 90)
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    errors.push('Latitude must be a valid number')
  } else if (latitude < -90 || latitude > 90) {
    errors.push('Latitude must be between -90 and 90 degrees')
  }

  // Longitude validation (-180 to 180)
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    errors.push('Longitude must be a valid number')
  } else if (longitude < -180 || longitude > 180) {
    errors.push('Longitude must be between -180 and 180 degrees')
  }

  // Precision validation (7 decimal places max for GPS accuracy)
  const latPrecision = latitude.toString().split('.')[1]?.length || 0
  const lngPrecision = longitude.toString().split('.')[1]?.length || 0
  
  if (latPrecision > 7) {
    errors.push('Latitude precision should not exceed 7 decimal places')
  }
  
  if (lngPrecision > 7) {
    errors.push('Longitude precision should not exceed 7 decimal places')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Find branches within specified radius (default 100 meters)
export function findNearbyBranches(
  userLocation: GPSCoordinate,
  branches: Branch[],
  radiusMeters: number = 100
): NearbyBranch[] {
  return branches
    .map(branch => {
      const branchLocation: GPSCoordinate = {
        latitude: parseFloat(branch.latitude.toString()),
        longitude: parseFloat(branch.longitude.toString())
      }
      
      const distance = calculateDistance(userLocation, branchLocation)
      
      return {
        ...branch,
        distance
      }
    })
    .filter(branch => branch.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance) // Sort by distance (nearest first)
}

// Check if user is within allowed radius of any branch
export function isWithinAllowedRadius(
  userLocation: GPSCoordinate,
  branches: Branch[],
  radiusMeters: number = 100
): boolean {
  return findNearbyBranches(userLocation, branches, radiusMeters).length > 0
}

// Format GPS coordinates for display
export function formatGPSCoordinates(
  latitude: number,
  longitude: number,
  precision: number = 6
): string {
  const lat = latitude.toFixed(precision)
  const lng = longitude.toFixed(precision)
  const latDir = latitude >= 0 ? 'N' : 'S'
  const lngDir = longitude >= 0 ? 'E' : 'W'
  
  return `${Math.abs(parseFloat(lat))}°${latDir}, ${Math.abs(parseFloat(lng))}°${lngDir}`
}

// Convert DMS (Degrees, Minutes, Seconds) to decimal degrees
export function dmsToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  direction: 'N' | 'S' | 'E' | 'W'
): number {
  let decimal = degrees + minutes / 60 + seconds / 3600
  
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal
  }
  
  return decimal
}

// Generate test coordinates within Thailand bounds for testing
export function generateThailandTestCoordinates(): GPSCoordinate {
  // Thailand bounds: lat 5.6-20.5, lng 97.3-105.6
  const latitude = 13.7563 + (Math.random() - 0.5) * 0.01 // Around Bangkok
  const longitude = 100.5018 + (Math.random() - 0.5) * 0.01
  
  return { latitude, longitude }
}
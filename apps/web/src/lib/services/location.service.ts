import type { Database } from '@employee-management/database'
import { createClient } from '../supabase'
import { 
  calculateDistance, 
  findNearbyBranches,
  type GPSCoordinate,
  type NearbyBranch 
} from '../utils/gps.utils'

type Branch = Database['public']['Tables']['branches']['Row']

export interface LocationServiceResult<T = unknown> {
  data: T | null
  error: string | null
  success: boolean
}

export interface GeolocationPosition {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export interface GeolocationError {
  code: number
  message: string
}

class LocationService {
  private supabase = createClient()

  // Detect if running on iOS Safari
  private isIOSSafari(): boolean {
    const userAgent = navigator.userAgent.toLowerCase()
    return /iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent)
  }

  // iOS-optimized location request with retry mechanism to handle CoreLocation errors
  private async getLocationWithRetry(options: PositionOptions, maxRetries: number = 3): Promise<GeolocationPosition> {
    let lastError: any
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await new Promise<GeolocationPosition>((resolve, reject) => {
          // For iOS, try with progressive enhancement approach
          const iosOptimizedOptions = this.isIOSSafari() ? {
            ...options,
            // First attempt: Fast but less accurate
            // Subsequent attempts: More accurate but slower
            enableHighAccuracy: attempt === 1 ? false : true,
            timeout: attempt === 1 ? 10000 : (attempt === 2 ? 20000 : 30000),
            maximumAge: attempt === 1 ? 300000 : (attempt === 2 ? 60000 : 30000) // 5min, 1min, 30sec
          } : {
            ...options,
            // For non-iOS devices, use consistent settings but increase timeout per attempt
            timeout: Math.min((options.timeout || 15000) * attempt, 30000)
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              // Additional validation for CoreLocation issues
              if (!position || !position.coords) {
                reject(new Error('ข้อมูลตำแหน่งไม่ถูกต้อง'))
                return
              }
              
              const { latitude, longitude } = position.coords
              
              // Check for invalid coordinates (common with CoreLocation errors)
              if (isNaN(latitude) || isNaN(longitude) || 
                  latitude === 0 || longitude === 0 ||
                  Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
                reject(new Error('พิกัดตำแหน่งไม่ถูกต้อง'))
                return
              }
              
              resolve(position)
            },
            (error) => {
              // Log CoreLocation specific errors for debugging
              if (error.code === 2) { // POSITION_UNAVAILABLE
                console.warn(`CoreLocation attempt ${attempt} failed:`, error.message)
              }
              reject(error)
            },
            iosOptimizedOptions
          )
        })
      } catch (error) {
        lastError = error
        
        // Don't retry for permission denied
        if (error && typeof error === 'object' && 'code' in error && 
            (error as GeolocationPositionError).code === 1) {
          throw error
        }
        
        if (attempt === maxRetries) {
          throw lastError
        }
        
        // Progressive backoff: 1s, 2s, 3s
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        console.warn(`GPS retry ${attempt}/${maxRetries} after error:`, error)
      }
    }
    
    throw lastError || new Error('Max retries exceeded')
  }

  // Get current user location using HTML5 Geolocation API with iOS Safari optimization
  async getCurrentPosition(options?: PositionOptions): Promise<LocationServiceResult<GeolocationPosition>> {
    if (!navigator.geolocation) {
      return {
        data: null,
        error: 'GPS ไม่รองรับในเบราว์เซอร์นี้',
        success: false
      }
    }

    // Enhanced options for iOS Safari compatibility
    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 25000, // Increased timeout for iOS Safari
      maximumAge: 30000 // Reduced maximumAge for more accurate positioning
    }

    const finalOptions = { ...defaultOptions, ...options }

    try {
      const position = await this.getLocationWithRetry(finalOptions)
      
      // Validate position data to handle CoreLocation errors
      if (!position || !position.coords) {
        throw new Error('ข้อมูลตำแหน่งไม่ถูกต้อง')
      }
      
      const { latitude, longitude, accuracy } = position.coords
      
      // Check for valid coordinates (handle kCLErrorLocationUnknown)
      if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
        throw new Error('ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS')
      }
      
      // Warn if accuracy is poor (but still proceed)
      if (accuracy > 1000) {
        console.warn('ตำแหน่งไม่แม่นยำ (ความแม่นยำ:', accuracy, 'เมตร)')
      }
      
      return {
        data: {
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp
        },
        error: null,
        success: true
      }
    } catch (error: unknown) {
      let errorMessage: string
      
      // Handle GeolocationPositionError
      if (error && typeof error === 'object' && 'code' in error) {
        const geolocationError = error as GeolocationPositionError
        
        switch (geolocationError.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์'
            break
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS และลองใหม่อีกครั้ง'
            break
          case 3: // TIMEOUT
            errorMessage = 'หมดเวลาการค้นหาตำแหน่ง กรุณาลองใหม่อีกครั้ง'
            break
          default:
            errorMessage = `เกิดข้อผิดพลาดตำแหน่ง: ${geolocationError.message || 'ไม่ทราบสาเหตุ'}`
            break
        }
      } else if (error instanceof Error) {
        // Handle custom error messages from our validation
        if (error.message.includes('ข้อมูลตำแหน่งไม่ถูกต้อง')) {
          errorMessage = 'ข้อมูลตำแหน่งไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
        } else if (error.message.includes('ไม่สามารถระบุตำแหน่งได้')) {
          errorMessage = 'ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS และลองใหม่อีกครั้ง'
        } else {
          errorMessage = error.message
        }
      } else {
        errorMessage = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง'
      }

      return {
        data: null,
        error: errorMessage,
        success: false
      }
    }
  }

  // Watch user position for continuous tracking
  watchPosition(
    successCallback: (position: GeolocationPosition) => void,
    errorCallback: (error: GeolocationError) => void,
    options?: PositionOptions
  ): number | null {
    if (!navigator.geolocation) {
      errorCallback({
        code: -1,
        message: 'GPS ไม่รองรับในเบราว์เซอร์นี้'
      })
      return null
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000 // 30 seconds for continuous tracking
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        successCallback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
      },
      (error) => {
        let errorMessage: string

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'การเข้าถึงตำแหน่งถูกปฏิเสธ'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'ไม่สามารถระบุตำแหน่งได้'
            break
          case error.TIMEOUT:
            errorMessage = 'หมดเวลาในการค้นหาตำแหน่ง'
            break
          default:
            errorMessage = 'เกิดข้อผิดพลาดในการค้นหาตำแหน่ง'
            break
        }

        errorCallback({
          code: error.code,
          message: errorMessage
        })
      },
      { ...defaultOptions, ...options }
    )
  }

  // Stop watching position
  clearWatch(watchId: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  // Find nearby branches within specified radius
  async findNearbyBranches(
    userLocation: GPSCoordinate, 
    radiusMeters: number = 100
  ): Promise<LocationServiceResult<NearbyBranch[]>> {
    try {
      // Fetch all branches from database
      const { data: branches, error } = await this.supabase
        .from('branches')
        .select('*')

      if (error) {
        console.error('Error fetching branches for location check:', error)
        return {
          data: null,
          error: 'ไม่สามารถดึงข้อมูลสาขาได้',
          success: false
        }
      }

      if (!branches || branches.length === 0) {
        return {
          data: [],
          error: null,
          success: true
        }
      }

      // Find nearby branches using GPS utilities
      const nearbyBranches = findNearbyBranches(userLocation, branches, radiusMeters)

      return {
        data: nearbyBranches,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in findNearbyBranches:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการค้นหาสาขาใกล้เคียง',
        success: false
      }
    }
  }

  // Check if user can check-in at current location
  async canCheckInAtLocation(
    userLocation: GPSCoordinate,
    radiusMeters: number = 100
  ): Promise<LocationServiceResult<{
    canCheckIn: boolean
    nearbyBranches: NearbyBranch[]
    closestBranch?: NearbyBranch
  }>> {
    try {
      const result = await this.findNearbyBranches(userLocation, radiusMeters)

      if (!result.success) {
        return {
          data: null,
          error: result.error,
          success: false
        }
      }

      const nearbyBranches = result.data || []
      const canCheckIn = nearbyBranches.length > 0
      const closestBranch = nearbyBranches[0] // Already sorted by distance

      return {
        data: {
          canCheckIn,
          nearbyBranches,
          closestBranch
        },
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in canCheckInAtLocation:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการตรวจสอบตำแหน่ง',
        success: false
      }
    }
  }

  // Get available branches for an employee (based on current location)
  async getAvailableBranchesForEmployee(
    userId: string,
    userLocation: GPSCoordinate,
    radiusMeters: number = 100
  ): Promise<LocationServiceResult<{
    homeBranch: Branch | null
    nearbyBranches: NearbyBranch[]
    canCheckInBranches: NearbyBranch[]
  }>> {
    try {
      // Get employee's home branch
      const { data: employee } = await this.supabase
        .from('users')
        .select(`
          branch_id,
          home_branch:branches!users_branch_id_fkey (*)
        `)
        .eq('id', userId)
        .single()

      const homeBranch = employee?.home_branch || null

      // Find nearby branches
      const nearbyResult = await this.findNearbyBranches(userLocation, radiusMeters)

      if (!nearbyResult.success) {
        return {
          data: null,
          error: nearbyResult.error,
          success: false
        }
      }

      const nearbyBranches = nearbyResult.data || []
      
      // All nearby branches are available for check-in (cross-branch support)
      const canCheckInBranches = nearbyBranches

      return {
        data: {
          homeBranch,
          nearbyBranches,
          canCheckInBranches
        },
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in getAvailableBranchesForEmployee:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสาขา',
        success: false
      }
    }
  }

  // Calculate distance between two points
  calculateDistanceBetweenPoints(point1: GPSCoordinate, point2: GPSCoordinate): number {
    return calculateDistance(point1, point2)
  }

  // Validate if a location is within allowed radius of any branch
  async isLocationValid(
    userLocation: GPSCoordinate,
    radiusMeters: number = 100
  ): Promise<LocationServiceResult<{
    valid: boolean
    nearestDistance: number
    nearestBranch?: Branch
  }>> {
    try {
      const result = await this.findNearbyBranches(userLocation, radiusMeters)

      if (!result.success) {
        return {
          data: null,
          error: result.error,
          success: false
        }
      }

      const nearbyBranches = result.data || []
      
      if (nearbyBranches.length > 0) {
        return {
          data: {
            valid: true,
            nearestDistance: nearbyBranches[0].distance,
            nearestBranch: nearbyBranches[0]
          },
          error: null,
          success: true
        }
      }

      // If no nearby branches, find the nearest one to show distance
      const { data: allBranches } = await this.supabase
        .from('branches')
        .select('*')

      if (!allBranches || allBranches.length === 0) {
        return {
          data: {
            valid: false,
            nearestDistance: Infinity
          },
          error: null,
          success: true
        }
      }

      // Find nearest branch (outside radius)
      let nearestBranch = allBranches[0]
      let nearestDistance = calculateDistance(
        userLocation,
        {
          latitude: parseFloat(nearestBranch.latitude.toString()),
          longitude: parseFloat(nearestBranch.longitude.toString())
        }
      )

      for (const branch of allBranches) {
        const distance = calculateDistance(
          userLocation,
          {
            latitude: parseFloat(branch.latitude.toString()),
            longitude: parseFloat(branch.longitude.toString())
          }
        )
        
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestBranch = branch
        }
      }

      return {
        data: {
          valid: false,
          nearestDistance,
          nearestBranch
        },
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected error in isLocationValid:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการตรวจสอบตำแหน่ง',
        success: false
      }
    }
  }

  // Get location permission status
  async getLocationPermissionStatus(): Promise<LocationServiceResult<{
    permission: PermissionState
    supported: boolean
  }>> {
    try {
      if (!navigator.geolocation) {
        return {
          data: {
            permission: 'denied' as PermissionState,
            supported: false
          },
          error: null,
          success: true
        }
      }

      if (!navigator.permissions) {
        // If permissions API is not supported, we can't check but geolocation might still work
        return {
          data: {
            permission: 'prompt' as PermissionState,
            supported: true
          },
          error: null,
          success: true
        }
      }

      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' })

      return {
        data: {
          permission: permissionStatus.state,
          supported: true
        },
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Error checking location permission:', error)
      return {
        data: {
          permission: 'prompt' as PermissionState,
          supported: true
        },
        error: null,
        success: true
      }
    }
  }
}

// Export singleton instance
export const locationService = new LocationService()
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatGPSCoordinates } from '@/lib/utils/gps.utils'
import type { Database } from '@employee-management/database'

type Branch = Database['public']['Tables']['branches']['Row']

interface NearbyBranch extends Branch {
  distance: number
}

interface AvailableBranchesData {
  home_branch: Branch | null
  nearby_branches: NearbyBranch[]
  can_check_in_branches: NearbyBranch[]
  check_in_allowed: boolean
  radius_meters: number
  user_location: {
    latitude: number
    longitude: number
  }
}

interface AvailableBranchesListProps {
  onCheckIn: (branchId: string, branchName: string) => void
  refreshTrigger?: number
}

export function AvailableBranchesList({ onCheckIn, refreshTrigger = 0 }: AvailableBranchesListProps) {
  const [data, setData] = useState<AvailableBranchesData | null>(null)
  const [allBranches, setAllBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')

  // Load initial data without location
  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/employee/available-branches')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถดึงข้อมูลสาขาได้')
      }

      setAllBranches(result.data.all_branches || [])
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  // Load branches with location data
  const loadNearbyBranches = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ไม่รองรับ GPS')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch('/api/employee/available-branches', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'ไม่สามารถดึงข้อมูลสาขาใกล้เคียงได้')
          }

          setData(result.data)
          setLocationPermission('granted')
        } catch (error) {
          console.error('Error loading nearby branches:', error)
          setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล')
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        // ลบการแสดงข้อความ error เกี่ยวกับการเข้าถึงตำแหน่ง
        // ไม่แสดงข้อความแจ้งเตือนการเข้าถึงตำแหน่งให้ผู้ใช้
        console.log('Location error:', error)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    )
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (refreshTrigger > 0) {
      if (data) {
        loadNearbyBranches()
      } else {
        loadInitialData()
      }
    }
  }, [refreshTrigger, data, loadNearbyBranches])

  const handleCheckIn = (branchId: string, branchName: string) => {
    if (window.confirm(`คุณต้องการลงเวลาทำงานที่ "${branchName}" หรือไม่?`)) {
      onCheckIn(branchId, branchName)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">กำลังโหลดข้อมูลสาขา...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="mb-2">{error}</p>
            <div className="space-x-2">
              <Button 
                onClick={() => data ? loadNearbyBranches() : loadInitialData()} 
                variant="outline" 
                size="sm"
              >
                ลองใหม่
              </Button>
              {!data && (
                <Button 
                  onClick={loadNearbyBranches} 
                  variant="outline" 
                  size="sm"
                >
                  เปิดใช้งาน GPS
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show initial view without location data
  if (!data) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>สาขาที่สามารถลงเวลาได้</span>
              <Button onClick={loadNearbyBranches} size="sm">
                ตรวจสอบตำแหน่ง
              </Button>
            </CardTitle>
            <CardDescription>
              เปิดใช้งาน GPS เพื่อตรวจสอบสาขาที่คุณสามารถลงเวลาทำงานได้
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allBranches.length === 0 ? (
              <p className="text-center text-gray-500">ยังไม่มีสาขาในระบบ</p>
            ) : (
              <div>
                <h3 className="text-sm font-medium mb-3">สาขาทั้งหมดในระบบ ({allBranches.length} สาขา)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allBranches.map((branch) => (
                    <div key={branch.id} className="border rounded-lg p-3 bg-gray-50">
                      <h4 className="font-medium">{branch.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatGPSCoordinates(
                          parseFloat(branch.latitude.toString()),
                          parseFloat(branch.longitude.toString())
                        )}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 mb-2">
                    กรุณาเปิดใช้งาน GPS เพื่อตรวจสอบว่าคุณอยู่ใกล้สาขาไหน
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show location-based data
  return (
    <div className="space-y-4">
      {/* Check-in Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>สถานะการลงเวลา</span>
            <Button onClick={loadNearbyBranches} variant="outline" size="sm">
              รีเฟรช
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.check_in_allowed ? (
            <div className="text-green-600">
              <p className="font-medium">✓ สามารถลงเวลาได้</p>
              <p className="text-sm">พบ {data.can_check_in_branches.length} สาขาในรัศมี {data.radius_meters} เมตร</p>
            </div>
          ) : (
            <div className="text-red-600">
              <p className="font-medium">✗ ไม่สามารถลงเวลาได้</p>
              <p className="text-sm">ไม่มีสาขาในรัศมี {data.radius_meters} เมตร</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Home Branch */}
      {data.home_branch && (
        <Card>
          <CardHeader>
            <CardTitle>สาขาหลักของคุณ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">{data.home_branch.name}</h4>
                <p className="text-sm text-gray-600">
                  {formatGPSCoordinates(
                    parseFloat(data.home_branch.latitude.toString()),
                    parseFloat(data.home_branch.longitude.toString())
                  )}
                </p>
              </div>
              {data.can_check_in_branches.some(b => b.id === data.home_branch!.id) && (
                <Button 
                  onClick={() => handleCheckIn(data.home_branch!.id, data.home_branch!.name)}
                  className="bg-primary hover:bg-primary/90"
                >
                  ลงเวลา
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Branches for Check-in */}
      {data.can_check_in_branches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>สาขาที่สามารถลงเวลาได้</CardTitle>
            <CardDescription>
              สาขาในรัศมี {data.radius_meters} เมตรจากตำแหน่งของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.can_check_in_branches.map((branch) => (
                <div key={branch.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                  <div>
                    <h4 className="font-medium text-green-800">{branch.name}</h4>
                    <p className="text-sm text-green-600">
                      ระยะทาง: {Math.round(branch.distance)} เมตร
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatGPSCoordinates(
                        parseFloat(branch.latitude.toString()),
                        parseFloat(branch.longitude.toString())
                      )}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleCheckIn(branch.id, branch.name)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    ลงเวลา
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nearby Branches (outside range) */}
      {data.nearby_branches.length === 0 && data.can_check_in_branches.length === 0 && allBranches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>สาขาทั้งหมด</CardTitle>
            <CardDescription>
              สาขาทั้งหมดในระบบ (อยู่นอกรัศมีที่อนุญาต)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allBranches.map((branch) => (
                <div key={branch.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{branch.name}</h4>
                    <p className="text-sm text-gray-600">
                      {formatGPSCoordinates(
                        parseFloat(branch.latitude.toString()),
                        parseFloat(branch.longitude.toString())
                      )}
                    </p>
                  </div>
                  <span className="text-sm text-red-600">นอกรัศมี</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Info */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลตำแหน่งของคุณ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {formatGPSCoordinates(data.user_location.latitude, data.user_location.longitude)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            รัศมีการตรวจสอบ: {data.radius_meters} เมตร
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
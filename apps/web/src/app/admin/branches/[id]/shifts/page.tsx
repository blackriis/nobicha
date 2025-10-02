'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { WorkShiftForm } from '@/components/admin/WorkShiftForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '@employee-management/database'

type Branch = Database['public']['Tables']['branches']['Row']
type WorkShift = Database['public']['Tables']['work_shifts']['Row']

interface WorkShiftFormData {
  name: string
  start_time: string
}

export default function BranchShiftsPage() {
  const params = useParams()
  const branchId = params.id as string

  const [branch, setBranch] = useState<Branch | null>(null)
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list')
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load branch and shifts data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load branch info
      const branchResponse = await fetch(`/api/admin/branches/${branchId}`)
      const branchResult = await branchResponse.json()

      if (!branchResponse.ok) {
        throw new Error(branchResult.error || 'ไม่สามารถดึงข้อมูลสาขาได้')
      }

      setBranch(branchResult.data)

      // Load shifts for this branch
      const shiftsResponse = await fetch(`/api/admin/branches/${branchId}/shifts`)
      const shiftsResult = await shiftsResponse.json()

      if (!shiftsResponse.ok) {
        throw new Error(shiftsResult.error || 'ไม่สามารถดึงข้อมูลกะการทำงานได้')
      }

      setShifts(shiftsResult.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    if (branchId) {
      loadData()
    }
  }, [branchId, loadData])

  const handleAddShift = () => {
    setEditingShift(null)
    setCurrentView('add')
  }

  const handleEditShift = (shift: WorkShift) => {
    setEditingShift(shift)
    setCurrentView('edit')
  }

  const handleDeleteShift = async (shift: WorkShift) => {
    if (!window.confirm(`คุณต้องการลบกะ "${shift.name}" หรือไม่?`)) {
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/admin/shifts/${shift.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถลบกะการทำงานได้')
      }

      alert('ลบกะการทำงานเรียบร้อยแล้ว')
      loadData()
    } catch (error) {
      console.error('Error deleting shift:', error)
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบกะการทำงาน')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = async (data: WorkShiftFormData) => {
    try {
      setIsSubmitting(true)

      let url: string
      let method: string

      if (editingShift) {
        url = `/api/admin/shifts/${editingShift.id}`
        method = 'PUT'
      } else {
        url = `/api/admin/branches/${branchId}/shifts`
        method = 'POST'
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถบันทึกข้อมูลกะการทำงานได้')
      }

      alert(editingShift ? 'แก้ไขกะการทำงานเรียบร้อยแล้ว' : 'เพิ่มกะการทำงานเรียบร้อยแล้ว')
      setCurrentView('list')
      loadData()
    } catch (error) {
      console.error('Error saving shift:', error)
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setCurrentView('list')
    setEditingShift(null)
  }

  const formatTime = (timeString: string) => {
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('th-TH', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return timeString
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center">กำลังโหลดข้อมูล...</div>
      </div>
    )
  }

  if (error || !branch) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error || 'ไม่พบข้อมูลสาขา'}</p>
              <Button 
                onClick={loadData} 
                variant="outline" 
                className="mt-2"
              >
                ลองใหม่
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/admin/branches'}
              >
                ← กลับ
              </Button>
              <h1 className="text-3xl font-bold">จัดการกะการทำงาน</h1>
            </div>
            <p className="text-gray-600">
              สาขา: <span className="font-medium">{branch.name}</span>
            </p>
            <p className="text-sm text-gray-500">
              จัดการกะการทำงานสำหรับสาขานี้
            </p>
          </div>
          
          {currentView !== 'list' && (
            <Button variant="outline" onClick={handleCancel}>
              กลับไปรายการกะ
            </Button>
          )}
        </div>
      </div>

      {currentView === 'list' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">กะการทำงาน</h2>
              <p className="text-gray-600">จำนวนกะทั้งหมด: {shifts.length} กะ</p>
            </div>
            <Button onClick={handleAddShift}>
              เพิ่มกะใหม่
            </Button>
          </div>

          {shifts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500 mb-4">ยังไม่มีกะการทำงานสำหรับสาขานี้</p>
                <Button onClick={handleAddShift}>เพิ่มกะแรก</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <Card key={shift.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{shift.name}</CardTitle>
                    <CardDescription>
                      เริ่มงาน: {formatTime(shift.start_time)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <p>เวลาเริ่มต้น: <span className="font-mono">{shift.start_time}</span></p>
                      </div>

                      <div className="text-xs text-gray-500">
                        สร้างเมื่อ: {new Date(shift.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditShift(shift)}
                        >
                          แก้ไข
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteShift(shift)}
                          disabled={isSubmitting}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          ลบ
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {(currentView === 'add' || currentView === 'edit') && (
        <WorkShiftForm
          branchId={branchId}
          branchName={branch.name}
          shift={editingShift}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
'use client'

import { useState, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { BranchList } from '@/components/admin/BranchList'
import { BranchForm } from '@/components/admin/BranchForm'
import { Button } from '@/components/ui/button'
import type { Database } from '@employee-management/database'

type Branch = Database['public']['Tables']['branches']['Row']

interface BranchFormData {
  name: string
  address: string
  latitude: string
  longitude: string
}

export default function BranchesPage() {
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list')
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleAddBranch = () => {
    setEditingBranch(null)
    setCurrentView('add')
  }

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch)
    setCurrentView('edit')
  }

  const handleDeleteBranch = async (branch: Branch) => {
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/admin/branches/${branch.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถลบสาขาได้')
      }

      alert('ลบสาขาเรียบร้อยแล้ว')
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting branch:', error)
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบสาขา')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = async (data: BranchFormData) => {
    try {
      setIsSubmitting(true)

      const url = editingBranch 
        ? `/api/admin/branches/${editingBranch.id}`
        : '/api/admin/branches'
      
      const method = editingBranch ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: data.name,
          address: data.address,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถบันทึกข้อมูลสาขาได้')
      }

      alert(editingBranch ? 'แก้ไขสาขาเรียบร้อยแล้ว' : 'เพิ่มสาขาเรียบร้อยแล้ว')
      setCurrentView('list')
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error saving branch:', error)
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setCurrentView('list')
    setEditingBranch(null)
  }

  const handleManageShifts = (branchId: string, branchName: string) => {
    // Navigate to shifts management page
    window.location.href = `/admin/branches/${branchId}/shifts`
  }

  return (
    <AdminLayout>
      <div className="mb-8" data-testid="branches-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">จัดการสาขา</h1>
            <p className="text-muted-foreground mt-2">
              จัดการข้อมูลสาขาและพิกัด GPS สำหรับระบบลงเวลาทำงาน
            </p>
          </div>
          
          {currentView !== 'list' && (
            <Button variant="outline" onClick={handleCancel}>
              กลับไปรายการสาขา
            </Button>
          )}
        </div>
      </div>

      {currentView === 'list' && (
        <BranchList
          onEditBranch={handleEditBranch}
          onDeleteBranch={handleDeleteBranch}
          onAddBranch={handleAddBranch}
          onManageShifts={handleManageShifts}
          refreshTrigger={refreshTrigger}
        />
      )}

      {(currentView === 'add' || currentView === 'edit') && (
        <BranchForm
          branch={editingBranch}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      )}
    </AdminLayout>
  )
}
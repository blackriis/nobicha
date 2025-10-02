'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth'

interface AdminStats {
  branchesCount: number
  employeesCount: number
  materialsCount: number
  payrollCyclesCount: number
  notificationsCount: number
  loading: boolean
  error: string | null
}

export function useAdminStats(): AdminStats {
  const { user, session } = useAuth()
  const [stats, setStats] = useState<AdminStats>({
    branchesCount: 0,
    employeesCount: 0,
    materialsCount: 0,
    payrollCyclesCount: 0,
    notificationsCount: 0,
    loading: true,
    error: null
  })

  useEffect(() => {
    async function fetchStats() {
      // Skip if no user or not admin or no session token
      if (!user || user.profile?.role !== 'admin' || !session?.access_token) {
        console.log('Admin stats: User not authenticated or not admin, using default values')
        setStats(prev => ({
          ...prev,
          loading: false,
          error: null
        }))
        return
      }
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }))

        // Fetch all stats in parallel with proper headers including Authorization
        const authHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }

        const [branchesRes, employeesRes, materialsRes, payrollRes] = await Promise.all([
          fetch('/api/admin/branches', { 
            credentials: 'include',
            headers: authHeaders
          }),
          fetch('/api/admin/employees', { 
            credentials: 'include',
            headers: authHeaders
          }),
          fetch('/api/admin/raw-materials', { 
            credentials: 'include',
            headers: authHeaders
          }),
          fetch('/api/admin/payroll-cycles', { 
            credentials: 'include',
            headers: authHeaders
          })
        ])

        // Check if all requests succeeded
        if (!branchesRes.ok || !employeesRes.ok || !materialsRes.ok || !payrollRes.ok) {
          // Check for auth errors specifically
          const authErrors = [branchesRes, employeesRes, materialsRes, payrollRes]
            .filter(res => res.status === 401)
          
          if (authErrors.length > 0) {
            // For auth errors, set default values instead of throwing
            console.warn('Admin stats: Authentication required - using default values')
            setStats({
              branchesCount: 0,
              employeesCount: 0,
              materialsCount: 0,
              payrollCyclesCount: 0,
              notificationsCount: 0,
              loading: false,
              error: null // Don't show error for auth issues in sidebar
            })
            return
          }
          
          throw new Error('Failed to fetch admin stats')
        }

        const [branchesData, employeesData, materialsData, payrollData] = await Promise.all([
          branchesRes.json(),
          employeesRes.json(),
          materialsRes.json(),
          payrollRes.json()
        ])

        setStats({
          branchesCount: branchesData.total || branchesData.data?.length || 0,
          employeesCount: employeesData.total || employeesData.data?.length || 0,
          materialsCount: materialsData.total || materialsData.data?.length || 0,
          payrollCyclesCount: payrollData.payroll_cycles?.length || payrollData.total || 0,
          notificationsCount: 0, // TODO: Implement notifications API
          loading: false,
          error: null
        })

      } catch (error) {
        console.error('Error fetching admin stats:', error)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }

    fetchStats()
  }, [user])

  return stats
}
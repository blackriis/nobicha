'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth'
import { adminReportsService, type ReportSummary } from '@/lib/services/admin-reports.service'

export interface AdminStatsResult {
  stats: ReportSummary | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useAdminStats(): AdminStatsResult {
  const { user, isAdmin } = useAuth()
  const isAuthenticated = !!(user && isAdmin)

  const [stats, setStats] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await adminReportsService.getSummaryReport({ type: 'today' })

      if (result.success && result.data) {
        setStats(result.data)
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการดึงข้อมูล')
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err)
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    let isMounted = true

    // Only fetch if authenticated
    if (isAuthenticated) {
      // Fetch immediately
      fetchStats()

      // Auto-refresh disabled - users can manually refresh using the refresh button
      // const interval = setInterval(() => {
      //   if (isMounted) {
      //     fetchStats()
      //   }
      // }, 30000)

      return () => {
        isMounted = false
        // clearInterval(interval)
      }
    }
  }, [fetchStats, refreshTrigger, isAuthenticated])

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return { stats, loading, error, refresh }
}
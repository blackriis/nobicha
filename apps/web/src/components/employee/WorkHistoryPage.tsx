'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import DateRangeFilterComponent from './DateRangeFilter'
import { TimeEntryCard } from './TimeEntryCard'
import { EmptyStateMessage } from './EmptyStateMessage'
import { WorkingHoursDisplay } from './WorkingHoursDisplay'
import { TimeEntryDetailModal } from './TimeEntryDetailModal'
import { EmployeeDashboardHeader } from '@/components/dashboard/EmployeeDashboardHeader'
import { ProtectedRoute } from '@/components/auth'
import { 
  DateRangeFilter, 
  TimeEntryHistory,
  timeEntryService 
} from '@/lib/services/time-entry.service'

export function WorkHistoryPage() {
  const [selectedRange, setSelectedRange] = useState<DateRangeFilter>('today')
  const [timeEntries, setTimeEntries] = useState<TimeEntryHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state for time entry detail
  const [selectedTimeEntryId, setSelectedTimeEntryId] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const fetchTimeEntries = async (dateRange: DateRangeFilter) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await timeEntryService.getTimeEntryHistory(dateRange)
      
      if (result.success) {
        setTimeEntries(result.data)
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการดึงข้อมูล')
        setTimeEntries([])
      }
    } catch (err) {
      console.error('Fetch time entries error:', err)
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
      setTimeEntries([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTimeEntries(selectedRange)
  }, [selectedRange])

  const handleRangeChange = (newRange: DateRangeFilter) => {
    setSelectedRange(newRange)
  }

  const handleRefresh = () => {
    fetchTimeEntries(selectedRange)
  }

  // Modal handlers
  const handleViewDetails = (timeEntryId: string) => {
    setSelectedTimeEntryId(timeEntryId)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedTimeEntryId(null)
  }

  return (
    <ProtectedRoute allowedRoles={['employee']}>
      <div className="min-h-screen bg-gray-50 dark:bg-black" data-testid="work-history-page">
        <EmployeeDashboardHeader />
        
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ประวัติการทำงาน</h1>
              <p className="text-sm text-gray-600 mt-1">
                รายงานการ check-in/check-out ของคุณ
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              data-testid="refresh-button"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>

      {/* Date Range Filter */}
      <DateRangeFilterComponent
        value={selectedRange}
        onChange={handleRangeChange}
        disabled={isLoading}
      />

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" data-testid="loading-spinner" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <div className="text-destructive mb-4">
              <h3 className="font-medium">เกิดข้อผิดพลาด</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              ลองอีกครั้ง
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Working Hours Summary */}
          {timeEntries.length > 0 && (
            <WorkingHoursDisplay timeEntries={timeEntries} />
          )}

          {/* Time Entries List */}
          {timeEntries.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">
                  รายการทั้งหมด ({timeEntries.length} รายการ)
                </h2>
              </div>
              <div className="space-y-0">
                {timeEntries.map((entry) => (
                  <TimeEntryCard 
                    key={entry.id} 
                    timeEntry={entry} 
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </div>
          ) : (
            <EmptyStateMessage dateRange={selectedRange} />
          )}
          </>
        )}
        </div>

        {/* Time Entry Detail Modal */}
        {selectedTimeEntryId && (
          <TimeEntryDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleCloseDetailModal}
            timeEntryId={selectedTimeEntryId}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

export default WorkHistoryPage
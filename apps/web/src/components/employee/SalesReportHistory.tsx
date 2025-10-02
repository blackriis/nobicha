'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  SalesReportsService,
  type SalesReportListResponse 
} from '@/lib/services/sales-reports.service'
import { 
  formatThaiCurrency,
  formatThaiDate,
  formatThaiTime 
} from '@/lib/utils/sales-reports.utils'
import { History, ExternalLink, Calendar, MapPin, RefreshCw } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import type { SalesReport } from '@employee-management/database'

type SalesReportWithBranch = SalesReport & {
  branches: {
    id: string
    name: string
    latitude: number
    longitude: number
  }
}

interface SalesReportHistoryProps {
  refreshTrigger?: number // Used to trigger refresh from parent
  onReportClick?: (report: SalesReportWithBranch) => void
  showTodayOnly?: boolean
}

export function SalesReportHistory({ 
  refreshTrigger = 0, 
  onReportClick,
  showTodayOnly = false 
}: SalesReportHistoryProps) {
  const { user, loading: authLoading } = useAuth()
  const [reports, setReports] = useState<SalesReportWithBranch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load sales reports
  const loadReports = async () => {
    try {
      setLoading(true)
      setError(null)

      let response: SalesReportListResponse
      if (showTodayOnly) {
        response = await SalesReportsService.getTodaysReport()
      } else {
        response = await SalesReportsService.getReports()
      }

      if (response.success && response.data) {
        setReports(response.data)
      } else {
        setError(response.error || 'ไม่สามารถโหลดประวัติรายงานได้')
      }
    } catch (error) {
      console.error('Load sales reports error:', error)
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setLoading(false)
    }
  }

  // Load reports on mount and when refresh trigger changes
  useEffect(() => {
    // Only load reports if user is authenticated and not loading
    if (!authLoading && user) {
      loadReports()
    } else if (!authLoading && !user) {
      // User is not authenticated, reset state
      setReports([])
      setLoading(false)
      setError(null)
    }
  }, [refreshTrigger, showTodayOnly, user, authLoading])

  // Handle report item click
  const handleReportClick = (report: SalesReportWithBranch) => {
    if (onReportClick) {
      onReportClick(report)
    } else {
      // Default behavior: open slip image in new tab
      window.open(report.slip_image_url, '_blank')
    }
  }

  if (authLoading || loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600" />
            <span className="text-sm">กำลังโหลดประวัติรายงาน...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-gray-500">
            <span className="text-sm">กรุณาเข้าสู่ระบบเพื่อดูประวัติรายงาน</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={loadReports}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              ลองใหม่
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-medium">
              {showTodayOnly ? 'รายงานวันนี้' : 'ประวัติรายงานยอดขาย'}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadReports}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {showTodayOnly 
                ? 'ยังไม่มีรายงานในวันนี้' 
                : 'ยังไม่มีประวัติรายงานยอดขาย'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <ReportItem
                key={report.id}
                report={report}
                onClick={() => handleReportClick(report)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ReportItemProps {
  report: SalesReportWithBranch
  onClick: () => void
}

function ReportItem({ report, onClick }: ReportItemProps) {
  const reportDate = new Date(report.report_date)
  const createdAt = new Date(report.created_at)
  const isToday = reportDate.toDateString() === new Date().toDateString()

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="font-medium text-sm">
            {formatThaiDate(report.report_date)}
          </span>
          {isToday && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              วันนี้
            </span>
          )}
        </div>
        <ExternalLink className="h-4 w-4 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-gray-600">สาขา{report.branches.name}</span>
        </div>
        <div className="text-right sm:text-left">
          <span className="font-medium text-green-600">
            {formatThaiCurrency(report.total_sales)}
          </span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          บันทึกเมื่อ: {formatThaiDate(createdAt)} เวลา {formatThaiTime(createdAt)}
        </p>
      </div>
    </div>
  )
}
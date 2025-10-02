'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface RateLimitStatus {
  count: number
  limit: number
  remaining: number
  resetTime: number
  blocked: boolean
  timeUntilReset: number
  usagePercentage: number
  isNearLimit: boolean
  isAtLimit: boolean
}

interface RateLimitAnalytics {
  totalRequests: number
  blockedRequests: number
  averageRequestsPerMinute: number
  peakRequestsPerMinute: number
  mostFrequentEndpoints: Array<{ endpoint: string; count: number }>
}

interface RateLimitRecommendation {
  type: 'increase' | 'decrease' | 'maintain'
  endpoint: string
  currentLimit: number
  recommendedLimit: number
  reason: string
}

export function RateLimitMonitor() {
  const [status, setStatus] = useState<RateLimitStatus | null>(null)
  const [analytics, setAnalytics] = useState<RateLimitAnalytics | null>(null)
  const [recommendations, setRecommendations] = useState<RateLimitRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch current status
      const statusResponse = await fetch('/api/rate-limit/status')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setStatus(statusData.data.current)
      }

      // Fetch analytics (admin only)
      const analyticsResponse = await fetch('/api/admin/rate-limit/analytics')
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData.data.analytics)
        setRecommendations(analyticsData.data.recommendations)
      }
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้')
      console.error('Error fetching rate limit data:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/rate-limit/analytics', {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchData() // Refresh data
      }
    } catch (err) {
      console.error('Error resetting analytics:', err)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return minutes > 0 ? `${minutes}น ${seconds}ว` : `${seconds}ว`
  }

  const getStatusColor = (percentage: number, blocked: boolean) => {
    if (blocked) return 'destructive'
    if (percentage >= 90) return 'destructive'
    if (percentage >= 70) return 'warning'
    return 'default'
  }

  const getStatusIcon = (percentage: number, blocked: boolean) => {
    if (blocked) return <AlertTriangle className="h-4 w-4" />
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4" />
    if (percentage >= 70) return <Clock className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Monitor</CardTitle>
          <CardDescription>กำลังโหลดข้อมูล...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(status.usagePercentage, status.blocked)}
              สถานะ Rate Limiting ปัจจุบัน
            </CardTitle>
            <CardDescription>
              ข้อมูลการใช้งาน API แบบเรียลไทม์
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">การใช้งาน</p>
                <p className="text-2xl font-bold">{status.count}/{status.limit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">คงเหลือ</p>
                <p className="text-2xl font-bold text-green-600">{status.remaining}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เปอร์เซ็นต์</p>
                <p className="text-2xl font-bold">{status.usagePercentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รีเซ็ตใน</p>
                <p className="text-2xl font-bold">{formatTime(status.timeUntilReset)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>การใช้งาน</span>
                <span>{status.usagePercentage}%</span>
              </div>
              <Progress 
                value={status.usagePercentage} 
                className="h-2"
              />
            </div>

            <div className="flex gap-2">
              <Badge variant={getStatusColor(status.usagePercentage, status.blocked)}>
                {status.blocked ? 'ถูกบล็อก' : status.isAtLimit ? 'เต็ม' : status.isNearLimit ? 'ใกล้เต็ม' : 'ปกติ'}
              </Badge>
              {status.blocked && (
                <Badge variant="outline">
                  รีเซ็ตใน {formatTime(status.timeUntilReset)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>สถิติการใช้งาน</CardTitle>
            <CardDescription>
              ข้อมูลการใช้งาน API และการบล็อก
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">คำขอทั้งหมด</p>
                <p className="text-2xl font-bold">{analytics.totalRequests.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ถูกบล็อก</p>
                <p className="text-2xl font-bold text-red-600">{analytics.blockedRequests.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เฉลี่ย/นาที</p>
                <p className="text-2xl font-bold">{analytics.averageRequestsPerMinute.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">สูงสุด/นาที</p>
                <p className="text-2xl font-bold">{analytics.peakRequestsPerMinute.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">API ที่ใช้บ่อยที่สุด</h4>
              {analytics.mostFrequentEndpoints.slice(0, 5).map((endpoint, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm font-mono">{endpoint.endpoint}</span>
                  <Badge variant="secondary">{endpoint.count}</Badge>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button onClick={resetAnalytics} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                รีเซ็ตข้อมูล
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>คำแนะนำการปรับแต่ง</CardTitle>
            <CardDescription>
              คำแนะนำสำหรับการปรับปรุงการตั้งค่า rate limiting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm">{rec.endpoint}</span>
                    <Badge 
                      variant={
                        rec.type === 'increase' ? 'default' : 
                        rec.type === 'decrease' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {rec.type === 'increase' ? 'เพิ่ม' : 
                       rec.type === 'decrease' ? 'ลด' : 
                       'คงเดิม'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {rec.currentLimit} → {rec.recommendedLimit}
                  </p>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

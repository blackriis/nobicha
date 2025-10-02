'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

export class AdminReportsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Reports Error Boundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  handleGoHome = () => {
    window.location.href = '/admin'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-600">เกิดข้อผิดพลาด</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    ระบบรายงานเกิดข้อผิดพลาดไม่คาดคิด กรุณาลองใหม่อีกครั้ง หากปัญหายังคงอยู่ 
                    กรุณาติดต่อผู้ดูแลระบบ
                  </span>
                </div>
              </div>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-gray-100 rounded-lg text-xs">
                  <p className="font-medium text-gray-700 mb-2">รายละเอียดข้อผิดพลาด:</p>
                  <pre className="text-red-600 whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-gray-600 whitespace-pre-wrap break-words mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={this.handleReset}
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  ลองใหม่
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  กลับหน้าหลัก
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500">
                หากปัญหายังคงอยู่ กรุณาติดต่อทีม IT
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for easier usage
interface ReportsErrorFallbackProps {
  error: Error
  resetError: () => void
}

export function ReportsErrorFallback({ error, resetError }: ReportsErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/admin'
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-lg text-red-600">เกิดข้อผิดพลาดในการโหลดรายงาน</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                ไม่สามารถโหลดข้อมูลรายงานได้ กรุณาลองใหม่อีกครั้ง
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={resetError}
              className="flex-1 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              ลองใหม่
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGoHome}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              กลับหน้าหลัก
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for handling async errors
export function useAsyncError() {
  const [error, setError] = React.useState<Error | null>(null)
  
  const resetError = React.useCallback(() => {
    setError(null)
  }, [])
  
  const throwError = React.useCallback((error: Error) => {
    setError(error)
  }, [])
  
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])
  
  return { throwError, resetError }
}
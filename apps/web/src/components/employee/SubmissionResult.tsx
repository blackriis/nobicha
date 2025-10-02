'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'

interface SubmissionResultProps {
  success: boolean
  title: string
  message: string
  details?: string[]
  onClose: () => void
  showCloseButton?: boolean
}

export function SubmissionResult({
  success,
  title,
  message,
  details,
  onClose,
  showCloseButton = true
}: SubmissionResultProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {success ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              )}
              <CardTitle className={`text-lg ${success ? 'text-green-800' : 'text-red-800'}`}>
                {title}
              </CardTitle>
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Message */}
          <div className={`p-4 rounded-lg ${
            success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${success ? 'text-green-800' : 'text-red-800'}`}>
              {message}
            </p>
          </div>

          {/* Details */}
          {details && details.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">รายละเอียด:</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <ul className="text-sm text-gray-700 space-y-1">
                  {details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={onClose}
              variant={success ? 'default' : 'outline'}
              size="sm"
            >
              {success ? 'ปิด' : 'ลองใหม่'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
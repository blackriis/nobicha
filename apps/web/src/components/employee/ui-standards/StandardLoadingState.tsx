'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface StandardLoadingStateProps {
  message?: string
  variant?: 'card' | 'inline'
  size?: 'sm' | 'md' | 'lg'
}

export function StandardLoadingState({ 
  message = 'กำลังโหลด...', 
  variant = 'card',
  size = 'md'
}: StandardLoadingStateProps) {
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  }

  const LoadingContent = () => (
    <div className="flex items-center justify-center gap-3">
      <Loader2 className={`${iconSizes[size]} animate-spin text-muted-foreground`} />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  )

  if (variant === 'inline') {
    return <LoadingContent />
  }

  return (
    <Card>
      <CardContent className="p-6">
        <LoadingContent />
      </CardContent>
    </Card>
  )
}
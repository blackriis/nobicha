'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StandardStatusAlertProps {
 type: 'success' | 'warning' | 'info' | 'error'
 title?: string
 children: ReactNode
 action?: ReactNode
 className?: string
}

export function StandardStatusAlert({ 
 type, 
 title, 
 children, 
 action,
 className
}: StandardStatusAlertProps) {
 const configs = {
  success: {
   icon: CheckCircle2,
   variant: 'default' as const,
   className: 'border-green-500/20 bg-green-50/50 text-green-800 dark:border-green-500/30 dark:bg-green-950/50 dark:text-green-200'
  },
  warning: {
   icon: AlertTriangle,
   variant: 'default' as const,
   className: 'border-amber-500/20 bg-amber-50/50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-200'
  },
  info: {
   icon: Info,
   variant: 'default' as const,
   className: 'border-blue-500/20 bg-blue-50/50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-950/50 dark:text-blue-200'
  },
  error: {
   icon: AlertCircle,
   variant: 'destructive' as const,
   className: ''
  }
 }

 const config = configs[type]
 const Icon = config.icon

 return (
  <Alert variant={config.variant} className={cn(config.className, className)}>
   <Icon className="h-4 w-4" />
   <AlertDescription>
    {title && <div className="font-semibold mb-1">{title}</div>}
    <div className="text-sm">{children}</div>
    {action && <div className="mt-3">{action}</div>}
   </AlertDescription>
  </Alert>
 )
}
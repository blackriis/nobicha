'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StandardCardProps {
 title?: string
 children: ReactNode
 actions?: ReactNode
 variant?: 'default' | 'mobile-first' | 'outline' | 'ghost'
 icon?: ReactNode
 className?: string
}

export function StandardCard({ 
 title, 
 children, 
 actions, 
 variant = 'default',
 icon,
 className
}: StandardCardProps) {
 const cardClasses = cn(
  variant === 'mobile-first' && ' sm: border-0 sm:border rounded-xl sm:rounded-lg',
  variant === 'outline' && 'border-2',
  variant === 'ghost' && 'border-0 shadow-none',
  className
 )

 const contentClasses = cn(
  'space-y-4',
  variant === 'mobile-first' && 'space-y-6 sm:space-y-4 px-6 sm:px-4'
 )

 const headerClasses = cn(
  variant === 'mobile-first' && 'px-6 sm:px-4'
 )

 return (
  <Card className={cardClasses}>
   {(title || actions) && (
    <CardHeader className={headerClasses}>
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
       {icon}
       {title && (
        <CardTitle className="text-lg font-semibold">
         {title}
        </CardTitle>
       )}
      </div>
      {actions && <div>{actions}</div>}
     </div>
    </CardHeader>
   )}
   <CardContent className={contentClasses}>
    {children}
   </CardContent>
  </Card>
 )
}
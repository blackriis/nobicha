'use client';

import React from 'react';
import { Loader2, Clock, Camera, Upload } from 'lucide-react';
import { designTokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
 size?: 'sm' | 'md' | 'lg' | 'xl';
 variant?: 'default' | 'dots' | 'bars' | 'pulse';
 color?: 'primary' | 'success' | 'warning' | 'error';
 message?: string;
 icon?: 'default' | 'clock' | 'camera' | 'upload';
 showProgress?: boolean;
 progress?: number; // 0-100
 className?: string;
}

export function LoadingSpinner({
 size = 'md',
 variant = 'default',
 color = 'primary',
 message,
 icon = 'default',
 showProgress = false,
 progress = 0,
 className
}: LoadingSpinnerProps) {
 const getSizeClasses = () => {
  switch (size) {
   case 'sm':
    return 'w-4 h-4';
   case 'md':
    return 'w-6 h-6';
   case 'lg':
    return 'w-8 h-8';
   case 'xl':
    return 'w-12 h-12';
   default:
    return 'w-6 h-6';
  }
 };

 const getColorClasses = () => {
  switch (color) {
   case 'success':
    return 'text-green-500';
   case 'warning':
    return 'text-amber-500';
   case 'error':
    return 'text-red-500';
   default:
    return 'text-blue-500';
  }
 };

 const getIcon = () => {
  const iconSize = getSizeClasses();
  const iconColor = getColorClasses();
  
  switch (icon) {
   case 'clock':
    return <Clock className={cn(iconSize, iconColor, 'animate-pulse')} />;
   case 'camera':
    return <Camera className={cn(iconSize, iconColor, 'animate-pulse')} />;
   case 'upload':
    return <Upload className={cn(iconSize, iconColor, 'animate-bounce')} />;
   default:
    return <Loader2 className={cn(iconSize, iconColor, 'animate-spin')} />;
  }
 };

 const renderSpinner = () => {
  switch (variant) {
   case 'dots':
    return (
     <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
       <div
        key={index}
        className={cn(
         'rounded-full',
         size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2',
         getColorClasses().replace('text-', 'bg-'),
         'animate-bounce'
        )}
        style={{
         animationDelay: `${index * 0.2}s`,
         animationDuration: '1s'
        }}
       />
      ))}
     </div>
    );

   case 'bars':
    return (
     <div className="flex space-x-1 items-end">
      {[0, 1, 2, 3].map((index) => (
       <div
        key={index}
        className={cn(
         'rounded-sm',
         size === 'sm' ? 'w-1' : size === 'lg' ? 'w-2' : 'w-1.5',
         getColorClasses().replace('text-', 'bg-'),
         'animate-pulse'
        )}
        style={{
         height: `${12 + (index % 2) * 8}px`,
         animationDelay: `${index * 0.1}s`,
         animationDuration: '1.2s'
        }}
       />
      ))}
     </div>
    );

   case 'pulse':
    return (
     <div className="relative">
      <div
       className={cn(
        'rounded-full border-2 border-current opacity-25',
        getSizeClasses()
       )}
      />
      <div
       className={cn(
        'absolute inset-0 rounded-full border-2 border-current border-t-transparent animate-spin',
        getSizeClasses(),
        getColorClasses()
       )}
      />
     </div>
    );

   default:
    return getIcon();
  }
 };

 return (
  <div className={cn('flex flex-col items-center justify-center space-y-3', className)}>
   {/* Spinner */}
   <div className="relative">
    {renderSpinner()}
    
    {/* Progress ring */}
    {showProgress && (
     <div className="absolute inset-0 flex items-center justify-center">
      <svg className={cn('transform -rotate-90', getSizeClasses())} viewBox="0 0 24 24">
       <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="opacity-25"
       />
       <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeDasharray={`${2 * Math.PI * 10}`}
        strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
        className={cn('transition-all duration-300', getColorClasses())}
        strokeLinecap="round"
       />
      </svg>
     </div>
    )}
   </div>

   {/* Message */}
   {message && (
    <div className="text-center space-y-1">
     <p className={cn(
      designTokens.typography.fontSize.sm,
      designTokens.colors.gray.text.secondary,
      'animate-pulse'
     )}>
      {message}
     </p>
     {showProgress && (
      <p className={cn(
       designTokens.typography.fontSize.xs,
       designTokens.colors.gray.text.tertiary
      )}>
       {progress}%
      </p>
     )}
    </div>
   )}
  </div>
 );
}

// Predefined loading states for common use cases
export function CheckInLoading() {
 return (
  <LoadingSpinner
   size="lg"
   variant="pulse"
   color="primary"
   icon="clock"
   message="กำลังบันทึกเวลาเข้างาน..."
  />
 );
}

export function CheckOutLoading() {
 return (
  <LoadingSpinner
   size="lg"
   variant="pulse"
   color="success"
   icon="clock"
   message="กำลังบันทึกเวลาออกงาน..."
  />
 );
}

export function SelfieUploadLoading({ progress }: { progress?: number }) {
 return (
  <LoadingSpinner
   size="xl"
   variant="default"
   color="primary"
   icon="upload"
   message="กำลังอัพโหลดรูปภาพ..."
   showProgress={progress !== undefined}
   progress={progress}
  />
 );
}

export function StatusLoading() {
 return (
  <LoadingSpinner
   size="md"
   variant="dots"
   color="primary"
   message="กำลังโหลดสถานะ..."
  />
 );
}

export default LoadingSpinner;
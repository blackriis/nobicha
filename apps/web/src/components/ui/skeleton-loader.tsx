'use client';

import React from 'react';
import { designTokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
 className?: string;
 variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'button';
 animation?: 'pulse' | 'wave' | 'none';
 width?: string;
 height?: string;
 lines?: number; // For text variant
}

export function SkeletonLoader({
 className,
 variant = 'rectangular',
 animation = 'pulse',
 width,
 height,
 lines = 1
}: SkeletonLoaderProps) {
 const getAnimationClass = () => {
  switch (animation) {
   case 'pulse':
    return 'animate-pulse';
   case 'wave':
    return 'animate-shimmer';
   case 'none':
    return '';
   default:
    return 'animate-pulse';
  }
 };

 const getVariantClasses = () => {
  switch (variant) {
   case 'text':
    return `h-4 ${designTokens.borderRadius.default} bg-gray-200`;
   case 'circular':
    return 'rounded-full bg-gray-200';
   case 'rectangular':
    return `${designTokens.borderRadius.default} bg-gray-200`;
   case 'card':
    return `${designTokens.borderRadius.lg} bg-gray-200 p-4`;
   case 'button':
    return `${designTokens.borderRadius.md} bg-gray-200 h-10`;
   default:
    return `${designTokens.borderRadius.default} bg-gray-200`;
  }
 };

 const style = {
  width: width || (variant === 'circular' ? '40px' : '100%'),
  height: height || (variant === 'circular' ? '40px' : variant === 'text' ? '16px' : '20px')
 };

 // For text variant with multiple lines
 if (variant === 'text' && lines > 1) {
  return (
   <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
     <div
      key={index}
      className={cn(
       getVariantClasses(),
       getAnimationClass(),
       index === lines - 1 ? 'w-3/4' : 'w-full' // Last line is shorter
      )}
      style={{ height: style.height }}
     />
    ))}
   </div>
  );
 }

 return (
  <div
   className={cn(
    getVariantClasses(),
    getAnimationClass(),
    className
   )}
   style={style}
  />
 );
}

// Predefined skeleton components for common use cases
export function CardSkeleton({ className }: { className?: string }) {
 return (
  <div className={cn(`${designTokens.components.card.padding.default} space-y-4 ${designTokens.components.card.border} ${designTokens.borderRadius.lg}`, className)}>
   <div className="flex items-center space-x-3">
    <SkeletonLoader variant="circular" width="40px" height="40px" />
    <div className="flex-1 space-y-2">
     <SkeletonLoader variant="text" width="60%" />
     <SkeletonLoader variant="text" width="40%" />
    </div>
   </div>
   <SkeletonLoader variant="text" lines={3} />
   <div className="flex space-x-2 pt-2">
    <SkeletonLoader variant="button" width="80px" />
    <SkeletonLoader variant="button" width="80px" />
   </div>
  </div>
 );
}

export function StatusSkeleton({ className }: { className?: string }) {
 return (
  <div className={cn(`${designTokens.components.card.padding.default} space-y-3 ${designTokens.components.card.border} ${designTokens.borderRadius.lg}`, className)}>
   <div className="flex items-center justify-between">
    <SkeletonLoader variant="text" width="120px" />
    <SkeletonLoader variant="circular" width="12px" height="12px" />
   </div>
   <SkeletonLoader variant="text" width="80%" />
   <div className="flex items-center space-x-2">
    <SkeletonLoader variant="circular" width="16px" height="16px" />
    <SkeletonLoader variant="text" width="60%" />
   </div>
  </div>
 );
}

export function ButtonSkeleton({ 
 className, 
 size = 'default' 
}: { 
 className?: string;
 size?: 'sm' | 'default' | 'lg';
}) {
 const sizeClasses = {
  sm: 'h-8 w-20',
  default: 'h-10 w-24', 
  lg: 'h-12 w-28'
 };

 return (
  <SkeletonLoader
   variant="button"
   className={cn(sizeClasses[size], className)}
  />
 );
}

// Add shimmer animation CSS
if (typeof document !== 'undefined') {
 const style = document.createElement('style');
 style.textContent = `
  @keyframes shimmer {
   0% {
    background-position: -1000px 0;
   }
   100% {
    background-position: 1000px 0;
   }
  }
  
  .animate-shimmer {
   background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
   background-size: 1000px 100%;
   animation: shimmer 2s infinite;
  }
 `;
 document.head.appendChild(style);
}

export default SkeletonLoader;
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { designTokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
 children: React.ReactNode;
 variant?: 'default' | 'success' | 'warning' | 'danger';
 size?: 'sm' | 'default' | 'lg' | 'xl';
 isLoading?: boolean;
 loadingText?: string;
 onClick?: () => void | Promise<void>;
 disabled?: boolean;
 className?: string;
 icon?: React.ReactNode;
 successFeedback?: boolean;
}

export function ActionButton({
 children,
 variant = 'default',
 size = 'default',
 isLoading = false,
 loadingText,
 onClick,
 disabled,
 className,
 icon,
 successFeedback = true
}: ActionButtonProps) {
 const [isClicked, setIsClicked] = useState(false);
 const [showSuccess, setShowSuccess] = useState(false);

 const handleClick = async () => {
  if (disabled || isLoading) return;

  // Immediate visual feedback
  setIsClicked(true);
  
  try {
   if (onClick) {
    await onClick();
    
    // Show success feedback
    if (successFeedback) {
     setShowSuccess(true);
     setTimeout(() => setShowSuccess(false), 1000);
    }
   }
  } catch (error) {
   console.error('Button action failed:', error);
  } finally {
   setTimeout(() => setIsClicked(false), 150);
  }
 };

 const getVariantClasses = () => {
  if (showSuccess) {
   return 'bg-green-500 hover:bg-green-600 text-white border-green-500';
  }
  
  switch (variant) {
   case 'success':
    return 'bg-green-500 hover:bg-green-600 text-white border-green-500';
   case 'warning':
    return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500';
   case 'danger':
    return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive';
   default:
    return 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary';
  }
 };

 const getSizeClasses = () => {
  switch (size) {
   case 'sm':
    return designTokens.components.button.height.sm + ' ' + designTokens.components.button.padding.sm;
   case 'lg':
    return designTokens.components.button.height.lg + ' ' + designTokens.components.button.padding.lg;
   case 'xl':
    return designTokens.components.button.height.xl + ' ' + designTokens.components.button.padding.xl;
   default:
    return designTokens.components.button.height.default + ' ' + designTokens.components.button.padding.default;
  }
 };

 return (
  <Button
   onClick={handleClick}
   disabled={disabled || isLoading}
   className={cn(
    // Base styles
    `relative overflow-hidden ${designTokens.borderRadius.md}`,
    getSizeClasses(),
    getVariantClasses(),
    designTokens.animations.transition.default,
    
    // Animation states
    isClicked && !isLoading ? designTokens.animations.scale.active : '',
    !disabled && !isLoading ? 'hover: ' + designTokens.animations.scale.hover : '',
    
    // Success animation
    showSuccess ? 'animate-pulse' : '',
    
    className
   )}
  >
   {/* Background ripple effect */}
   {isClicked && (
    <div className="absolute inset-0 bg-white opacity-25 animate-ping rounded-md" />
   )}
   
   {/* Button content */}
   <div className="relative flex items-center justify-center gap-2">
    {isLoading ? (
     <>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{loadingText || 'กำลังดำเนินการ...'}</span>
     </>
    ) : (
     <>
      {icon && (
       <span className={`${designTokens.animations.transition.default} ${showSuccess ? 'scale-110' : ''}`}>
        {icon}
       </span>
      )}
      <span className={`${designTokens.animations.transition.default} ${showSuccess ? 'scale-105' : ''}`}>
       {showSuccess ? 'สำเร็จ!' : children}
      </span>
     </>
    )}
   </div>

   {/* Success overlay */}
   {showSuccess && (
    <div className="absolute inset-0 bg-green-400 opacity-20 animate-pulse rounded-md" />
   )}
  </Button>
 );
}

export default ActionButton;
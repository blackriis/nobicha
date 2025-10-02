'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { designTokens, getStatusColor } from '@/lib/design-tokens';

interface EnhancedToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function EnhancedToast({
  type,
  title,
  message,
  action,
  onClose,
  autoClose = true,
  duration = 5000
}: EnhancedToastProps) {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'info':
        return 'bg-blue-500';
    }
  };

  return (
    <div
      className={`
        relative max-w-sm w-full mx-auto 
        ${getStatusColor(type, 'bg')} 
        ${designTokens.borderRadius.lg} 
        ${designTokens.shadows.lg}
        border ${getStatusColor(type, 'border')}
        overflow-hidden
        transform transition-all duration-300 ease-out
        hover:scale-105
      `}
      role="alert"
    >
      {/* Progress bar */}
      {autoClose && (
        <div className="absolute top-0 left-0 h-1 w-full bg-gray-200">
          <div
            className={`h-full ${getProgressColor()} transition-all ease-linear`}
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`${designTokens.typography.fontSize.sm} ${designTokens.typography.fontWeight.semibold} ${getStatusColor(type, 'text')}`}>
              {title}
            </h4>
            {message && (
              <p className={`mt-1 ${designTokens.typography.fontSize.sm} ${designTokens.colors.gray.text.secondary}`}>
                {message}
              </p>
            )}
            
            {/* Action button */}
            {action && (
              <button
                onClick={action.onClick}
                className={`
                  mt-2 ${designTokens.typography.fontSize.sm} ${designTokens.typography.fontWeight.medium}
                  ${getStatusColor(type, 'text')} hover:underline
                  ${designTokens.animations.transition.fast}
                `}
              >
                {action.label}
              </button>
            )}
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className={`
                flex-shrink-0 p-1 -m-1 rounded-md
                ${designTokens.colors.gray.text.tertiary} 
                hover:${designTokens.colors.gray.text.primary}
                ${designTokens.animations.transition.fast}
              `}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Add CSS animation for progress bar
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
  `;
  document.head.appendChild(style);
}

export default EnhancedToast;
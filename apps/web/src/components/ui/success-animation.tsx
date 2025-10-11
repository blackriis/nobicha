'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Camera } from 'lucide-react';
import { designTokens } from '@/lib/design-tokens';

interface SuccessAnimationProps {
 type: 'checkin' | 'checkout' | 'upload' | 'default';
 message: string;
 onComplete?: () => void;
 duration?: number;
}

export function SuccessAnimation({ 
 type, 
 message, 
 onComplete, 
 duration = 3000 
}: SuccessAnimationProps) {
 const [isVisible, setIsVisible] = useState(false);
 const [isAnimating, setIsAnimating] = useState(false);

 useEffect(() => {
  // Start animation sequence
  const timer1 = setTimeout(() => setIsVisible(true), 100);
  const timer2 = setTimeout(() => setIsAnimating(true), 200);
  
  // Complete animation
  const timer3 = setTimeout(() => {
   setIsAnimating(false);
   setIsVisible(false);
   if (onComplete) onComplete();
  }, duration);

  return () => {
   clearTimeout(timer1);
   clearTimeout(timer2);
   clearTimeout(timer3);
  };
 }, [duration, onComplete]);

 const getIcon = () => {
  switch (type) {
   case 'checkin':
    return <Clock className="h-8 w-8 text-green-500" />;
   case 'checkout':
    return <Clock className="h-8 w-8 text-blue-500" />;
   case 'upload':
    return <Camera className="h-8 w-8 text-purple-500" />;
   default:
    return <CheckCircle2 className="h-8 w-8 text-green-500" />;
  }
 };

 const getColor = () => {
  switch (type) {
   case 'checkin':
    return 'from-green-400 to-green-600';
   case 'checkout':
    return 'from-blue-400 to-blue-600';
   case 'upload':
    return 'from-purple-400 to-purple-600';
   default:
    return 'from-green-400 to-green-600';
  }
 };

 if (!isVisible) return null;

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
   <div
    className={`
     relative p-8 bg-white rounded-2xl shadow-2xl
     transform transition-all duration-500 ease-out
     ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
    `}
   >
    {/* Animated Background Circle */}
    <div
     className={`
      absolute inset-0 rounded-2xl bg-gradient-to-br ${getColor()}
      opacity-10 transform transition-transform duration-1000 ease-out
      ${isAnimating ? 'scale-110' : 'scale-100'}
     `}
    />
    
    {/* Success Content */}
    <div className="relative text-center space-y-4">
     {/* Animated Icon */}
     <div className="mx-auto w-16 h-16 relative">
      <div
       className={`
        absolute inset-0 rounded-full bg-gradient-to-br ${getColor()}
        opacity-20 transform transition-all duration-700 ease-out
        ${isAnimating ? 'scale-125 rotate-180' : 'scale-100 rotate-0'}
       `}
      />
      <div className="relative flex items-center justify-center w-full h-full">
       <div
        className={`
         transform transition-all duration-500 ease-out
         ${isAnimating ? 'scale-110 rotate-12' : 'scale-100 rotate-0'}
        `}
       >
        {getIcon()}
       </div>
      </div>
     </div>

     {/* Success Message */}
     <div className="space-y-2">
      <h3 className={`${designTokens.typography.fontSize.lg} ${designTokens.typography.fontWeight.semibold} ${designTokens.colors.gray.text.primary}`}>
       สำเร็จ!
      </h3>
      <p className={`${designTokens.typography.fontSize.sm} ${designTokens.colors.gray.text.secondary} max-w-sm`}>
       {message}
      </p>
     </div>

     {/* Progress Dots */}
     <div className="flex justify-center space-x-1">
      {[0, 1, 2].map((index) => (
       <div
        key={index}
        className={`
         w-2 h-2 rounded-full bg-gradient-to-r ${getColor()}
         transform transition-all duration-300 ease-out
         ${isAnimating ? 'scale-110' : 'scale-100'}
        `}
        style={{
         animationDelay: `${index * 0.2}s`,
         animation: isAnimating ? 'pulse 1.5s infinite' : 'none'
        }}
       />
      ))}
     </div>
    </div>
   </div>
  </div>
 );
}

export default SuccessAnimation;
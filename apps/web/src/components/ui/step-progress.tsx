'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
 id: string;
 title: string;
 description?: string;
}

interface StepProgressProps {
 steps: Step[];
 currentStep: number;
 className?: string;
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
 return (
  <div className={cn("w-full", className)}>
   <div className="flex items-center justify-between">
    {steps.map((step, index) => (
     <React.Fragment key={step.id}>
      {/* Step Circle */}
      <div className="flex flex-col items-center relative">
       <div
        className={cn(
         "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-200",
         {
          // Completed steps
          "bg-green-500 border-green-500 text-white": index < currentStep,
          // Current step
          "bg-blue-500 border-blue-500 text-white": index === currentStep,
          // Future steps
          "bg-gray-100 border-gray-300 text-gray-400": index > currentStep,
         }
        )}
       >
        {index < currentStep ? (
         <Check className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
         <span className="text-sm sm:text-base font-semibold">{index + 1}</span>
        )}
       </div>
       
       {/* Step Label */}
       <div className="mt-2 text-center">
        <div
         className={cn(
          "text-xs sm:text-sm font-medium transition-colors duration-200",
          {
           "text-green-600": index < currentStep,
           "text-blue-600": index === currentStep,
           "text-gray-400": index > currentStep,
          }
         )}
        >
         {step.title}
        </div>
        {step.description && (
         <div
          className={cn(
           "text-xs text-gray-500 mt-1 hidden sm:block",
           {
            "text-green-500": index < currentStep,
            "text-blue-500": index === currentStep,
           }
          )}
         >
          {step.description}
         </div>
        )}
       </div>
      </div>

      {/* Connector Line */}
      {index < steps.length - 1 && (
       <div
        className={cn(
         "flex-1 h-0.5 mx-2 sm:mx-4 transition-colors duration-200",
         {
          "bg-green-500": index < currentStep,
          "bg-gray-300": index >= currentStep,
         }
        )}
       />
      )}
     </React.Fragment>
    ))}
   </div>
  </div>
 );
}

export default StepProgress;
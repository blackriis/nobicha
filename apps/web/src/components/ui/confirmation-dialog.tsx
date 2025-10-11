'use client';

import React from 'react';
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface ConfirmationDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 title: string;
 description: string;
 confirmText?: string;
 cancelText?: string;
 variant?: 'default' | 'warning' | 'danger';
 onConfirm: () => void;
 onCancel?: () => void;
 isLoading?: boolean;
 additionalInfo?: string;
}

export function ConfirmationDialog({
 open,
 onOpenChange,
 title,
 description,
 confirmText = 'ยืนยัน',
 cancelText = 'ยกเลิก',
 variant = 'default',
 onConfirm,
 onCancel,
 isLoading = false,
 additionalInfo
}: ConfirmationDialogProps) {
 const handleConfirm = () => {
  onConfirm();
  onOpenChange(false);
 };

 const handleCancel = () => {
  if (onCancel) onCancel();
  onOpenChange(false);
 };

 const getIcon = () => {
  switch (variant) {
   case 'warning':
    return <AlertTriangle className="h-6 w-6 text-amber-500" />;
   case 'danger':
    return <AlertTriangle className="h-6 w-6 text-red-500" />;
   default:
    return <CheckCircle2 className="h-6 w-6 text-blue-500" />;
  }
 };

 const getButtonStyle = () => {
  switch (variant) {
   case 'warning':
    return 'bg-amber-500 hover:bg-amber-600 text-white';
   case 'danger':
    return 'bg-red-500 hover:bg-red-600 text-white';
   default:
    return 'bg-blue-500 hover:bg-blue-600 text-white';
  }
 };

 return (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
   <AlertDialogContent className="sm:max-w-md">
    <AlertDialogHeader>
     <div className="flex items-center gap-3 mb-2">
      {getIcon()}
      <AlertDialogTitle className="text-lg font-semibold">
       {title}
      </AlertDialogTitle>
     </div>
     <AlertDialogDescription className="text-base text-gray-600">
      {description}
     </AlertDialogDescription>
     {additionalInfo && (
      <div className="mt-3 p-3 bg-gray-50 rounded-md">
       <div className="flex items-center gap-2 text-sm text-gray-700">
        <Clock className="h-4 w-4 text-gray-500" />
        <span>{additionalInfo}</span>
       </div>
      </div>
     )}
    </AlertDialogHeader>
    <AlertDialogFooter className="flex gap-2">
     <AlertDialogCancel 
      onClick={handleCancel}
      disabled={isLoading}
      className="flex-1"
     >
      {cancelText}
     </AlertDialogCancel>
     <AlertDialogAction 
      onClick={handleConfirm}
      disabled={isLoading}
      className={`flex-1 ${getButtonStyle()}`}
     >
      {isLoading ? 'กำลังดำเนินการ...' : confirmText}
     </AlertDialogAction>
    </AlertDialogFooter>
   </AlertDialogContent>
  </AlertDialog>
 );
}

export default ConfirmationDialog;
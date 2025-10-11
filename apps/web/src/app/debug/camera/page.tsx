'use client';

import { CameraDebug } from '@/components/debug/CameraDebug';
import { MinimalCamera } from '@/components/debug/MinimalCamera';

export default function CameraDebugPage() {
 return (
  <div className="min-h-screen bg-gray-50 py-8">
   <div className="space-y-8">
    <MinimalCamera />
    <CameraDebug />
   </div>
  </div>
 );
}
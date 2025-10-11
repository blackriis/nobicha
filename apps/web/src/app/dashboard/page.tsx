'use client';

import { ProtectedRoute } from '@/components/auth'
import { EmployeeDashboardHeader } from '@/components/dashboard/EmployeeDashboardHeader'
import { CheckInOutCard } from '@/components/employee/CheckInOutCard'
import { useState, useEffect } from 'react'
import { createSupabaseClientSide } from '@/lib/supabase'

export default function EmployeeDashboard() {
 const [refreshTrigger, setRefreshTrigger] = useState(0);
 const [employeeId, setEmployeeId] = useState<string | null>(null);

 useEffect(() => {
  const getEmployeeId = async () => {
   const supabase = createSupabaseClientSide();
   const { data: { user } } = await supabase.auth.getUser();
   if (user) {
    setEmployeeId(user.id);
   }
  };

  getEmployeeId();
 }, []);

 const handleStatusChange = () => {
  setRefreshTrigger(prev => prev + 1);
 };


 return (
  <ProtectedRoute allowedRoles={['employee']}>
   <div className="min-h-screen bg-gray-50 dark:bg-black" data-testid="employee-dashboard">
    <EmployeeDashboardHeader />
    
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
     {/* Ultra Minimal Layout - CheckInOut Card Only */}
     <CheckInOutCard 
      onStatusChange={handleStatusChange}
      employeeId={employeeId || undefined}
      key={refreshTrigger}
     />
    </div>
   </div>
  </ProtectedRoute>
 )
}
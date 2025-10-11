'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import { timeEntryService } from '@/lib/services/time-entry.service';

interface Branch {
 id: string;
 name: string;
 distance: number;
 canCheckIn: boolean;
}

interface BranchCheckInRequest {
 branchId: string;
 latitude: number;
 longitude: number;
}

interface BranchSelectorProps {
 onCheckIn: (request: BranchCheckInRequest) => void;
 onCancel: () => void;
 isLoading?: boolean;
}

export function BranchSelector({ onCheckIn, onCancel, isLoading = false }: BranchSelectorProps) {
 const [branches, setBranches] = useState<Branch[]>([]);
 const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
 const [isLoadingBranches, setIsLoadingBranches] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);

 // Load available branches when component mounts
 useEffect(() => {
  loadAvailableBranches();
 }, []);

 const loadAvailableBranches = async () => {
  setIsLoadingBranches(true);
  setError(null);

  try {
   // Get current location first
   const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
     reject(new Error('เบราว์เซอร์ไม่รองรับ GPS'));
     return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
     enableHighAccuracy: true,
     timeout: 10000,
     maximumAge: 60000
    });
   });

   setCurrentPosition(position);

   // Get available branches
   const availableBranches = await timeEntryService.getAvailableBranches();
   setBranches(availableBranches);

   // Auto-select first available branch that can check-in
   const firstAvailable = availableBranches.find(branch => branch.canCheckIn);
   if (firstAvailable) {
    setSelectedBranchId(firstAvailable.id);
    
    // Auto-proceed if only one branch available and position is ready
    if (availableBranches.filter(b => b.canCheckIn).length === 1 && position) {
     setTimeout(() => {
      const checkInRequest: BranchCheckInRequest = {
       branchId: firstAvailable.id,
       latitude: position.coords.latitude,
       longitude: position.coords.longitude
      };
      onCheckIn(checkInRequest);
     }, 1000); // Small delay to show the selection
    }
   }

  } catch (error) {
   // Enhanced error handling with specific error messages
   let errorMessage = 'ไม่สามารถโหลดข้อมูลสาขาได้';
   
   if (error instanceof Error) {
    errorMessage = error.message;
   } else if (typeof error === 'object' && error !== null) {
    // Handle objects with message property
    const errorObj = error as { message?: string; error?: string };
    errorMessage = errorObj.message || errorObj.error || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
   } else if (typeof error === 'string') {
    errorMessage = error;
   }
   
   setError(errorMessage);
  } finally {
   setIsLoadingBranches(false);
  }
 };

 const handleCheckIn = () => {
  if (!selectedBranchId || !currentPosition) {
   setError('กรุณาเลือกสาขา');
   return;
  }

  const checkInRequest: BranchCheckInRequest = {
   branchId: selectedBranchId,
   latitude: currentPosition.coords.latitude,
   longitude: currentPosition.coords.longitude
  };

  onCheckIn(checkInRequest);
 };

 const getDistanceColor = (distance: number, canCheckIn: boolean) => {
  if (canCheckIn) {
   return 'text-green-600';
  } else if (distance <= 200) {
   return 'text-yellow-600';
  } else {
   return 'text-destructive';
  }
 };

 const getDistanceText = (distance: number) => {
  if (distance < 1000) {
   return `${Math.round(distance)} ม.`;
  } else {
   return `${(distance / 1000).toFixed(1)} กม.`;
  }
 };

 return (
  <Card className="border-primary/20 bg-primary/5">
   <CardHeader>
    <CardTitle className="flex items-center gap-2 text-primary">
     <Navigation className="h-5 w-5" />
     เลือกสาขาสำหรับ Check-In
    </CardTitle>
    <CardDescription>
     เลือกสาขาที่คุณต้องการ check-in (อนุญาตเฉพาะสาขาในรัศมี 100 เมตร)
    </CardDescription>
   </CardHeader>

   <CardContent className="space-y-4">
    {/* Error Display */}
    {error && (
     <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
       <span>{error}</span>
       <Button
        variant="link"
        size="sm"
        onClick={loadAvailableBranches}
        className="ml-auto text-destructive underline p-0 h-auto"
       >
        ลองใหม่
       </Button>
      </AlertDescription>
     </Alert>
    )}

    {/* Loading State */}
    {isLoadingBranches && (
     <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      <span className="text-muted-foreground">กำลังค้นหาสาขาใกล้เคียง...</span>
     </div>
    )}

    {/* Branch List */}
    {!isLoadingBranches && branches.length > 0 && (
     <div className="space-y-2">
      {branches.map((branch) => (
       <div
        key={branch.id}
        className={`p-3 rounded-md border cursor-pointer transition-colors ${
         selectedBranchId === branch.id
          ? 'bg-primary/10 border-primary/30'
          : 'bg-card border-border hover:bg-muted/50'
        } ${
         !branch.canCheckIn ? 'opacity-60' : ''
        }`}
        onClick={() => setSelectedBranchId(branch.id)}
       >
        <div className="flex items-start justify-between">
         <div className="flex-1">
          <div className="flex items-center gap-2">
           <input
            type="radio"
            name="branch"
            value={branch.id}
            checked={selectedBranchId === branch.id}
            onChange={() => setSelectedBranchId(branch.id)}
            disabled={!branch.canCheckIn}
            className="text-primary"
           />
           <span className={`font-medium ${!branch.canCheckIn ? 'text-muted-foreground' : 'text-foreground'}`}>
            {branch.name}
           </span>
          </div>
         </div>
         
         <div className="text-right">
          <div className={`text-sm font-medium ${getDistanceColor(branch.distance, branch.canCheckIn)}`}>
           <MapPin className="h-3 w-3 inline mr-1" />
           {getDistanceText(branch.distance)}
          </div>
          {branch.canCheckIn ? (
           <div className="text-xs text-green-600">สามารถ check-in ได้</div>
          ) : (
           <div className="text-xs text-destructive">นอกเขตอนุญาต</div>
          )}
         </div>
        </div>
       </div>
      ))}
     </div>
    )}

    {/* No Branches Found */}
    {!isLoadingBranches && branches.length === 0 && !error && (
     <div className="text-center py-8 text-muted-foreground">
      <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
      <div className="text-sm">ไม่พบสาขาใกล้เคียง</div>
      <Button
       variant="link"
       size="sm"
       onClick={loadAvailableBranches}
       className="mt-2"
      >
       ลองค้นหาใหม่
      </Button>
     </div>
    )}

    {/* Action Buttons */}
    <div className="flex gap-3 pt-4 border-t">
     <Button
      onClick={handleCheckIn}
      disabled={
       !selectedBranchId || 
       !currentPosition || 
       isLoading || 
       isLoadingBranches ||
       !branches.find(b => b.id === selectedBranchId && b.canCheckIn)
      }
      className="flex-1"
     >
      {isLoading ? (
       <>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        กำลัง Check-In...
       </>
      ) : (
       <>
        <MapPin className="h-4 w-4 mr-2" />
        ยืนยัน Check-In
       </>
      )}
     </Button>
     
     <Button
      onClick={onCancel}
      disabled={isLoading}
      variant="outline"
      className="flex-1"
     >
      ยกเลิก
     </Button>
    </div>
   </CardContent>
  </Card>
 );
}
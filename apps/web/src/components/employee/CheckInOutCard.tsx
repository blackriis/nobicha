'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Camera, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
// Removed unused imports - now using shadcn/ui components
import { timeEntryService, type CheckInRequest, type CheckOutRequest } from '@/lib/services/time-entry.service';
import { BranchSelector } from './BranchSelector';

interface BranchCheckInRequest {
  branchId: string;
  latitude: number;
  longitude: number;
}
import { TimeEntryStatus } from './TimeEntryStatus';
// import { LocationPermissionHandler } from '@/components/location/LocationPermissionHandler'; // ลบออกแล้ว
import { SelfieCapture } from './SelfieCapture';
import { TimeEntryActionButtons } from './TimeEntryActionButtons';
import { StepProgress } from '@/components/ui/step-progress';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { SuccessAnimation } from '@/components/ui/success-animation';
// Removed unused UI components - now using shadcn/ui components

interface CheckInOutCardProps {
  onStatusChange?: () => void;
  employeeId?: string;
}

interface UIState {
  isProcessing: boolean;
  error: string | null;
  success: string | null;
  showBranchSelector: boolean;
  showSelfieCapture: boolean;
  captureAction: 'checkin' | 'checkout' | null;
  selectedBranchForCheckin: string | null;
  currentPosition: GeolocationPosition | null;
  showConfirmation: boolean;
  confirmationType: 'short-work' | 'long-work' | 'checkout-early' | null;
  confirmationData?: {
    workingHours?: number;
    action: 'checkin' | 'checkout';
    message?: string;
  };
  showSuccessAnimation: boolean;
  successAnimationType: 'checkin' | 'checkout' | 'upload' | 'default';
  successMessage: string;
}

export function CheckInOutCard({ onStatusChange, employeeId }: CheckInOutCardProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const [uiState, setUIState] = useState<UIState>({
    isProcessing: false,
    error: null,
    success: null,
    showBranchSelector: false,
    showSelfieCapture: false,
    captureAction: null,
    selectedBranchForCheckin: null,
    currentPosition: null,
    showConfirmation: false,
    confirmationType: null,
    confirmationData: undefined,
    showSuccessAnimation: false,
    successAnimationType: 'default',
    successMessage: ''
  });

  // Steps for check-in process
  const checkInSteps = [
    { id: 'branch', title: 'เลือกสาขา', description: 'เลือกสาขาที่ต้องการเช็คอิน', icon: MapPin },
    { id: 'selfie', title: 'ถ่าย Selfie', description: 'ถ่ายรูปยืนยันตัวตน', icon: Camera },
    { id: 'confirm', title: 'ยืนยัน', description: 'บันทึกเวลาเข้างาน', icon: CheckCircle }
  ];

  // Steps for check-out process  
  const checkOutSteps = [
    { id: 'selfie', title: 'ถ่าย Selfie', description: 'ถ่ายรูปยืนยันตัวตน', icon: Camera },
    { id: 'confirm', title: 'ยืนยัน', description: 'บันทึกเวลาออกงาน', icon: CheckCircle }
  ];

  // Calculate current step
  const getCurrentStep = () => {
    if (uiState.captureAction === 'checkin') {
      if (uiState.showBranchSelector) return 0;
      if (uiState.showSelfieCapture) return 1;
      if (uiState.isProcessing) return 2;
    } else if (uiState.captureAction === 'checkout') {
      if (uiState.showSelfieCapture) return 0;
      if (uiState.isProcessing) return 1;
    }
    return 0;
  };

  // Check working hours and show confirmation if needed
  const checkWorkingHoursAndProceed = async (action: 'checkout') => {
    try {
      // Get current time entry status to check working hours
      const status = await timeEntryService.getStatus();
      
      if (status.isCheckedIn && status.activeEntry?.checkInTime) {
        const checkInTime = new Date(status.activeEntry.checkInTime);
        const now = new Date();
        const workingHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        
        // Show confirmation for unusual working hours
        if (workingHours < 2) {
          setUIState(prev => ({
            ...prev,
            showConfirmation: true,
            confirmationType: 'short-work',
            confirmationData: {
              workingHours,
              action,
              message: `คุณทำงานเพียง ${workingHours.toFixed(1)} ชั่วโมง`
            }
          }));
          return;
        } else if (workingHours > 12) {
          setUIState(prev => ({
            ...prev,
            showConfirmation: true,
            confirmationType: 'long-work', 
            confirmationData: {
              workingHours,
              action,
              message: `คุณทำงานมาแล้ว ${workingHours.toFixed(1)} ชั่วโมง`
            }
          }));
          return;
        }
      }

      // Proceed normally if no unusual hours
      handleCheckOutInitiated();
    } catch (error) {
      // If can't check hours, proceed normally
      handleCheckOutInitiated();
    }
  };

  // Handle confirmation dialog
  const handleConfirmationProceed = () => {
    setUIState(prev => ({
      ...prev,
      showConfirmation: false,
      confirmationType: null,
      confirmationData: undefined
    }));
    
    if (uiState.confirmationData?.action === 'checkout') {
      handleCheckOutInitiated();
    }
  };

  const handleConfirmationCancel = () => {
    setUIState(prev => ({
      ...prev,
      showConfirmation: false,
      confirmationType: null,
      confirmationData: undefined
    }));
  };

  // Auto-hide success/error messages
  useEffect(() => {
    if (uiState.success || uiState.error) {
      const timer = setTimeout(() => {
        setUIState(prev => ({ 
          ...prev, 
          success: null, 
          error: null 
        }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uiState.success, uiState.error]);

  const handleBranchSelected = async (request: BranchCheckInRequest) => {
    // Store branch and position for selfie capture
    setUIState({ 
      ...uiState, 
      showBranchSelector: false,
      showSelfieCapture: true,
      captureAction: 'checkin',
      selectedBranchForCheckin: request.branchId,
      currentPosition: {
        coords: {
          latitude: request.latitude,
          longitude: request.longitude
        }
      } as GeolocationPosition
    });
  };

  const handleCheckOutInitiated = async () => {
    try {
      setUIState({ 
        ...uiState, 
        isProcessing: true, 
        error: null, 
        success: null 
      });

      // Get current location first with enhanced error handling
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('เบราว์เซอร์ไม่รองรับ GPS'));
          return;
        }

        // Enhanced options for better compatibility with iOS/macOS
        const options: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout for iOS CoreLocation
          maximumAge: 30000 // Reduced maximumAge for more accurate positioning
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Validate position data
            if (!position || !position.coords) {
              reject(new Error('ข้อมูลตำแหน่งไม่ถูกต้อง'));
              return;
            }
            
            const { latitude, longitude, accuracy } = position.coords;
            
            // Check for valid coordinates
            if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
              reject(new Error('ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS'));
              return;
            }
            
            // Check accuracy (if too inaccurate, warn but still proceed)
            if (accuracy > 1000) {
              console.warn('ตำแหน่งไม่แม่นยำ (ความแม่นยำ:', accuracy, 'เมตร)');
            }
            
            resolve(position);
          },
          (error) => {
            // Enhanced error handling for iOS CoreLocation issues
            let errorMessage = 'ไม่สามารถเข้าถึงตำแหน่งได้';
            
            switch (error.code) {
              case 1: // PERMISSION_DENIED
                errorMessage = 'กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์';
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = 'ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS และลองใหม่อีกครั้ง';
                break;
              case 3: // TIMEOUT
                errorMessage = 'หมดเวลาการค้นหาตำแหน่ง กรุณาลองใหม่อีกครั้ง';
                break;
              default:
                errorMessage = `เกิดข้อผิดพลาดตำแหน่ง: ${error.message || 'ไม่ทราบสาเหตุ'}`;
            }
            
            reject(new Error(errorMessage));
          },
          options
        );
      });
      // Proceed to selfie capture
      setUIState({
        ...uiState,
        isProcessing: false,
        showSelfieCapture: true,
        captureAction: 'checkout',
        currentPosition: position
      });

    } catch (error) {
      let errorMessage = 'ไม่สามารถเข้าถึงตำแหน่งได้';
      
      // Enhanced error handling for various error types
      if (error && typeof error === 'object' && 'code' in error) {
        // Handle GeolocationPositionError
        const geoError = error as GeolocationPositionError;
        
        switch (geoError.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS และลองใหม่อีกครั้ง';
            break;
          case 3: // TIMEOUT
            errorMessage = 'หมดเวลาการค้นหาตำแหน่ง กรุณาลองใหม่อีกครั้ง';
            break;
          default:
            errorMessage = `เกิดข้อผิดพลาดตำแหน่ง: ${geoError.message || 'ไม่ทราบสาเหตุ'}`;
        }
      } else if (error instanceof Error) {
        // Handle custom error messages from our validation
        if (error.message.includes('ข้อมูลตำแหน่งไม่ถูกต้อง')) {
          errorMessage = 'ข้อมูลตำแหน่งไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';
        } else if (error.message.includes('ไม่สามารถระบุตำแหน่งได้')) {
          errorMessage = 'ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS และลองใหม่อีกครั้ง';
        } else {
          errorMessage = error.message;
        }
      } else {
        // Default message for any other error types (including serialization issues)
        errorMessage = 'ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาตรวจสอบการอนุญาต GPS และลองใหม่อีกครั้ง';
      }
      
      setUIState({
        ...uiState,
        isProcessing: false,
        error: errorMessage
      });
    }
  };

  const handleSelfieSuccess = async (imageUrl: string) => {
    if (!employeeId || !uiState.currentPosition) {
      setUIState({
        ...uiState,
        error: 'ข้อมูลไม่ครบถ้วน',
        showSelfieCapture: false
      });
      return;
    }

    setUIState({ 
      ...uiState, 
      isProcessing: true 
    });

    try {
      if (uiState.captureAction === 'checkin' && uiState.selectedBranchForCheckin) {
        // Perform check-in
        const checkInRequest: CheckInRequest = {
          branchId: uiState.selectedBranchForCheckin,
          latitude: uiState.currentPosition.coords.latitude,
          longitude: uiState.currentPosition.coords.longitude,
          selfieUrl: imageUrl
        };

        const result = await timeEntryService.checkIn(checkInRequest);
        
        setUIState({
          isProcessing: false,
          error: null,
          success: result.message,
          showBranchSelector: false,
          showSelfieCapture: false,
          captureAction: null,
          selectedBranchForCheckin: null,
          currentPosition: null,
          showSuccessAnimation: true,
          successAnimationType: 'checkin',
          successMessage: result.message,
          showConfirmation: false,
          confirmationType: null,
          confirmationData: undefined
        });

      } else if (uiState.captureAction === 'checkout') {
        // Perform check-out
        const checkOutRequest: CheckOutRequest = {
          latitude: uiState.currentPosition.coords.latitude,
          longitude: uiState.currentPosition.coords.longitude,
          selfieUrl: imageUrl
        };

        const result = await timeEntryService.checkOut(checkOutRequest);
        
        setUIState({
          isProcessing: false,
          error: null,
          success: result.message,
          showBranchSelector: false,
          showSelfieCapture: false,
          captureAction: null,
          selectedBranchForCheckin: null,
          currentPosition: null,
          showSuccessAnimation: true,
          successAnimationType: 'checkout',
          successMessage: result.message,
          showConfirmation: false,
          confirmationType: null,
          confirmationData: undefined
        });
      }

      // Notify parent component of status change
      if (onStatusChange) {
        onStatusChange();
      }

    } catch (error) {
      // Enhanced error logging with proper object serialization
      if (error instanceof Error) {
        console.error('Time entry error (Error):', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error('Time entry error (Non-Error):', {
          type: typeof error,
          value: error,
          toString: error?.toString?.() || 'No toString method'
        });
      }
      
      // Enhanced error handling with better user messages
      let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกเวลา';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'ปัญหาการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ต';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง';
        } else if (error.message.includes('upload')) {
          errorMessage = 'ไม่สามารถอัพโหลดรูปภาพได้ กรุณาตรวจสอบการเชื่อมต่อ';
        } else {
          errorMessage = error.message;
        }
      } else {
        errorMessage = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุในการบันทึกเวลา';
      }
      
      setUIState({
        ...uiState,
        isProcessing: false,
        error: errorMessage,
        showSelfieCapture: false
      });
    }
  };

  const handleSelfieCancel = () => {
    setUIState({
      ...uiState,
      showSelfieCapture: false,
      captureAction: null,
      selectedBranchForCheckin: null,
      currentPosition: null,
      error: null
    });
  };

  const showCheckInSelector = () => {
    setUIState({ 
      ...uiState, 
      showBranchSelector: true,
      error: null,
      success: null 
    });
  };

  const hideCheckInSelector = () => {
    setUIState({ 
      ...uiState, 
      showBranchSelector: false,
      error: null 
    });
  };

  // Show selfie capture if in that mode
  if (uiState.showSelfieCapture && uiState.captureAction && employeeId) {
    const steps = uiState.captureAction === 'checkin' ? checkInSteps : checkOutSteps;
    const currentStep = getCurrentStep();

    return (
      <div className="space-y-6">
        <TimeEntryStatus />
        
        {/* Step Progress Indicator */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              {uiState.captureAction === 'checkin' ? 'กระบวนการเช็คอิน' : 'กระบวนการเช็คเอาท์'}
            </CardTitle>
            <CardDescription>
              {uiState.captureAction === 'checkin' ? 'ทำตามขั้นตอนเพื่อเช็คอิน' : 'ทำตามขั้นตอนเพื่อเช็คเอาท์'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StepProgress 
              steps={steps} 
              currentStep={currentStep}
              className="mb-4"
            />
            
            {/* Step Details */}
            <div className="space-y-3">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div 
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-primary/10 border border-primary/20' 
                        : isCompleted 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        isActive ? 'text-primary' : isCompleted ? 'text-green-700' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                    {isCompleted && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <SelfieCapture
          employeeId={employeeId}
          action={uiState.captureAction}
          onSuccess={handleSelfieSuccess}
          onCancel={handleSelfieCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Entry Status Display */}
      <TimeEntryStatus />

      {/* Main Check-In/Check-Out Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-6 w-6 text-primary" />
            บันทึกเวลาทำงาน
          </CardTitle>
          <CardDescription className="text-center">
            ระบบ check-in และ check-out พร้อมการยืนยันตัวตนด้วยเซลฟี่
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Network Status Warning */}
          {!isOnline && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                <strong>ไม่มีการเชื่อมต่ออินเทอร์เน็ต</strong>
                <br />
                กรุณาตรวจสอบการเชื่อมต่อของคุณ
              </AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {uiState.success && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                {uiState.success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display with Recovery Options */}
          {uiState.error && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <div className="font-medium">{uiState.error}</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUIState(prev => ({
                        ...prev,
                        error: null,
                        showBranchSelector: false,
                        showSelfieCapture: false,
                        captureAction: null,
                        isProcessing: false
                      }));
                      if (onStatusChange) onStatusChange();
                    }}
                    className="text-xs"
                  >
                    ลองใหม่
                  </Button>
                  {uiState.error.includes('ตำแหน่ง') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUIState(prev => ({ ...prev, error: null }));
                        if (uiState.captureAction === 'checkout') {
                          handleCheckOutInitiated();
                        }
                      }}
                      className="text-xs"
                    >
                      ลอง GPS อีกครั้ง
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Branch Selector (shown when checking in) */}
          {uiState.showBranchSelector && !uiState.isProcessing && (
            <div className="space-y-6">
              {/* Step Progress for Branch Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">เลือกสาขา</h3>
                  <Badge variant="secondary" className="text-xs">
                    ขั้นตอนที่ 1
                  </Badge>
                </div>
                <StepProgress 
                  steps={checkInSteps} 
                  currentStep={0}
                  className="mb-4"
                />
              </div>
              
              <BranchSelector
                onCheckIn={handleBranchSelected}
                onCancel={hideCheckInSelector}
                isLoading={uiState.isProcessing}
              />
            </div>
          )}

          {/* Main Action Area */}
          {!uiState.showBranchSelector && !uiState.showSelfieCapture && (
            <div className="relative">
              {/* Smart State-Driven Action Buttons */}
              <TimeEntryActionButtons 
                isProcessing={uiState.isProcessing}
                employeeId={employeeId}
                onCheckIn={showCheckInSelector}
                onCheckOut={() => checkWorkingHoursAndProceed('checkout')}
              />

              {!employeeId && (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลผู้ใช้...</p>
                </div>
              )}

              {/* Processing Overlay */}
              {uiState.isProcessing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">
                      {uiState.captureAction === 'checkin' ? 'กำลังเช็คอิน...' : 
                       uiState.captureAction === 'checkout' ? 'กำลังเช็คเอาท์...' : 
                       'กำลังดำเนินการ...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={uiState.showConfirmation}
        onOpenChange={(open) => !open && handleConfirmationCancel()}
        title={getConfirmationTitle()}
        description={getConfirmationDescription()}
        confirmText="ดำเนินการต่อ"
        cancelText="ยกเลิก"
        variant={getConfirmationVariant()}
        onConfirm={handleConfirmationProceed}
        onCancel={handleConfirmationCancel}
        isLoading={uiState.isProcessing}
        additionalInfo={uiState.confirmationData?.message}
      />

      {/* Success Animation */}
      {uiState.showSuccessAnimation && (
        <SuccessAnimation
          type={uiState.successAnimationType}
          message={uiState.successMessage}
          onComplete={() => {
            setUIState(prev => ({
              ...prev,
              showSuccessAnimation: false,
              success: null
            }));
          }}
        />
      )}
    </div>
  );

  // Helper functions for confirmation dialog
  function getConfirmationTitle() {
    switch (uiState.confirmationType) {
      case 'short-work':
        return 'เช็คเอาท์ก่อนเวลา?';
      case 'long-work':
        return 'เช็คเอาท์หลังทำงานนาน?';
      default:
        return 'ยืนยันการดำเนินการ';
    }
  }

  function getConfirmationDescription() {
    switch (uiState.confirmationType) {
      case 'short-work':
        return 'คุณทำงานน้อยกว่า 2 ชั่วโมง คุณแน่ใจหรือไม่ว่าต้องการเช็คเอาท์?';
      case 'long-work':
        return 'คุณทำงานเกิน 12 ชั่วโมงแล้ว ควรพักผ่อน คุณแน่ใจหรือไม่ว่าพร้อมเช็คเอาท์?';
      default:
        return 'กรุณายืนยันการดำเนินการ';
    }
  }

  function getConfirmationVariant() {
    switch (uiState.confirmationType) {
      case 'short-work':
        return 'warning' as const;
      case 'long-work':
        return 'warning' as const;
      default:
        return 'default' as const;
    }
  }
}
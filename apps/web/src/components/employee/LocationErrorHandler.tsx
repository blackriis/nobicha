'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, MapPin, RefreshCw, Settings, Navigation } from 'lucide-react';

type LocationErrorType = 
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE' 
  | 'TIMEOUT'
  | 'NOT_SUPPORTED'
  | 'NO_ERROR';

interface LocationState {
  error: LocationErrorType;
  isChecking: boolean;
  position: GeolocationPosition | null;
  lastChecked: Date | null;
}

export function LocationErrorHandler() {
  const [locationState, setLocationState] = useState<LocationState>({
    error: 'NO_ERROR',
    isChecking: false,
    position: null,
    lastChecked: null
  });

  // Check location permissions and availability on component mount
  useEffect(() => {
    checkLocationStatus();
  }, []);

  const checkLocationStatus = async () => {
    setLocationState(prev => ({ ...prev, isChecking: true }));

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setLocationState(prev => ({
          ...prev,
          error: 'NOT_SUPPORTED',
          isChecking: false,
          lastChecked: new Date()
        }));
        return;
      }

      // Try to get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error('PERMISSION_DENIED'));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error('POSITION_UNAVAILABLE'));
                break;
              case error.TIMEOUT:
                reject(new Error('TIMEOUT'));
                break;
              default:
                reject(new Error('POSITION_UNAVAILABLE'));
                break;
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });

      setLocationState({
        error: 'NO_ERROR',
        isChecking: false,
        position,
        lastChecked: new Date()
      });

    } catch (error) {
      const errorType = (error as Error).message as LocationErrorType;
      setLocationState(prev => ({
        ...prev,
        error: errorType,
        isChecking: false,
        position: null,
        lastChecked: new Date()
      }));
    }
  };

  const getErrorMessage = (error: LocationErrorType): { title: string; description: string; action: string } => {
    switch (error) {
      case 'PERMISSION_DENIED':
        return {
          title: 'ไม่ได้รับอนุญาตเข้าถึงตำแหน่ง',
          description: 'คุณได้ปฏิเสธการขออนุญาตเข้าถึงตำแหน่ง กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์',
          action: 'เปิดการตั้งค่า'
        };
      case 'POSITION_UNAVAILABLE':
        return {
          title: 'ไม่สามารถระบุตำแหน่งได้',
          description: 'ระบบไม่สามารถหาตำแหน่งของคุณได้ กรุณาตรวจสอบสัญญาณ GPS หรือเชื่อมต่ออินเทอร์เน็ต',
          action: 'ลองอีกครั้ง'
        };
      case 'TIMEOUT':
        return {
          title: 'หมดเวลาในการค้นหาตำแหน่ง',
          description: 'ระบบใช้เวลานานเกินไปในการค้นหาตำแหน่ง กรุณาย้ายไปยังที่เปิดโล่ง',
          action: 'ลองอีกครั้ง'
        };
      case 'NOT_SUPPORTED':
        return {
          title: 'เบราว์เซอร์ไม่รองรับ GPS',
          description: 'เบราว์เซอร์ของคุณไม่รองรับการใช้งาน GPS กรุณาใช้เบราว์เซอร์ที่ทันสมัยกว่านี้',
          action: 'อัพเดทเบราว์เซอร์'
        };
      default:
        return {
          title: '',
          description: '',
          action: ''
        };
    }
  };

  const handleAction = () => {
    switch (locationState.error) {
      case 'PERMISSION_DENIED':
        // Open browser settings (this will vary by browser)
        alert('กรุณาไปที่การตั้งค่าเบราว์เซอร์ > ความเป็นส่วนตัวและความปลอดภัย > การตั้งค่าเว็บไซต์ > ตำแหน่ง และอนุญาตให้เว็บไซต์นี้เข้าถึงตำแหน่งของคุณ');
        break;
      case 'NOT_SUPPORTED':
        window.open('https://www.google.com/chrome/', '_blank');
        break;
      default:
        checkLocationStatus();
        break;
    }
  };

  // Don't show anything if there's no error
  if (locationState.error === 'NO_ERROR') {
    return null;
  }

  const { title, description, action } = getErrorMessage(locationState.error);

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-yellow-800 mb-1">
              {title}
            </div>
            <div className="text-sm text-yellow-700 mb-3">
              {description}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAction}
                size="sm"
                variant="outline"
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                disabled={locationState.isChecking}
              >
                {locationState.isChecking ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    {locationState.error === 'PERMISSION_DENIED' && <Settings className="h-3 w-3 mr-1" />}
                    {locationState.error === 'NOT_SUPPORTED' && <Navigation className="h-3 w-3 mr-1" />}
                    {(locationState.error === 'POSITION_UNAVAILABLE' || locationState.error === 'TIMEOUT') && <RefreshCw className="h-3 w-3 mr-1" />}
                    {action}
                  </>
                )}
              </Button>
              
              {locationState.lastChecked && (
                <div className="text-xs text-yellow-600">
                  ตรวจสอบล่าสุด: {locationState.lastChecked.toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success state when position is available */}
        {locationState.position && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>
                ตำแหน่งพร้อมใช้งาน (ความแม่นยำ: ±{Math.round(locationState.position.coords.accuracy)} ม.)
              </span>
            </div>
          </div>
        )}

        {/* Tips for better GPS accuracy */}
        <div className="mt-3 text-xs text-yellow-600 space-y-1">
          <div className="font-medium">เคล็ดลับการใช้ GPS:</div>
          <ul className="space-y-0.5 ml-4">
            <li>• ออกไปยังที่เปิดโล่งเพื่อรับสัญญาณ GPS ที่ดีขึ้น</li>
            <li>• เปิด Wi-Fi และ Mobile Data เพื่อช่วยระบุตำแหน่ง</li>
            <li>• รอสักครู่เพื่อให้ระบบระบุตำแหน่งที่แม่นยำ</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
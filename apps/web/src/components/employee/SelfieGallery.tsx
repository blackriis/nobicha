'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Eye, AlertCircle } from 'lucide-react';
import { timeEntryService } from '@/lib/services/time-entry.service';

interface SelfieGalleryProps {
  checkInSelfieUrl: string;
  checkOutSelfieUrl?: string;
  branchName: string;
  employeeName?: string;
}

interface SelfieImageProps {
  url: string;
  type: 'check-in' | 'check-out';
  alt: string;
  onImageError: (url: string) => void;
}

function SelfieImage({ url, type, alt, onImageError }: SelfieImageProps) {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleImageError = () => {
    console.error(`❌ SelfieImage Error: ${type}`, url);
    setImageError(true);
    setLoading(false);
    onImageError(url);
  };

  const handleImageLoad = () => {
    console.log(`✅ SelfieImage Loaded: ${type}`, url);
    setLoading(false);
  };

  const optimizedUrl = timeEntryService.optimizeSelfieUrl(url, 'medium');
  
  // Debug logging
  console.log(`🔍 SelfieImage Debug: ${type}`, {
    originalUrl: url,
    optimizedUrl: optimizedUrl,
    imageError: imageError,
    loading: loading
  });

  // Check if URL is empty or invalid before rendering
  if (!url || !optimizedUrl || imageError) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300">
        <img
          src="/placeholder-selfie.svg"
          alt="ไม่มีรูปภาพ"
          className="w-16 h-16 mb-2 opacity-50"
        />
        <span className="text-xs text-gray-500 text-center">
          {!url ? 'ไม่มีรูปภาพ' : 'ไม่สามารถโหลดรูปภาพได้'}
        </span>
        <div className="text-xs text-red-500 mt-1">
          Debug: {!url ? 'No URL' : !optimizedUrl ? 'No optimized URL' : 'Image error'}
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 w-full h-full"></div>
        </div>
      )}
      <img
        src={optimizedUrl}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ opacity: loading ? 0 : 1 }}
      />
      {!loading && (
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
          <Eye className="h-6 w-6 text-white" />
        </div>
      )}
    </div>
  );
}

export function SelfieGallery({
  checkInSelfieUrl,
  checkOutSelfieUrl,
  branchName,
  employeeName,
}: SelfieGalleryProps) {
  const [errorUrls, setErrorUrls] = useState<string[]>([]);

  // Debug logging
  console.log('🔍 SelfieGallery Debug:', {
    checkInSelfieUrl,
    checkOutSelfieUrl,
    branchName,
    employeeName,
    errorUrls
  });

  const handleImageError = (url: string) => {
    console.error('❌ SelfieGallery Image Error:', url);
    const fallbackUrl = timeEntryService.handleImageError(url);
    setErrorUrls(prev => [...prev, url]);
  };

  const checkInAltText = timeEntryService.formatSelfieAltText(
    'check-in',
    employeeName,
    branchName
  );

  const checkOutAltText = timeEntryService.formatSelfieAltText(
    'check-out',
    employeeName,
    branchName
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Camera className="h-5 w-5 text-purple-600" />
          <span>รูปภาพยืนยันตัวตน</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-in Selfie */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                รูปเซลฟี่เช็คอิน
              </h4>
              <span className="text-xs text-gray-500">จำเป็น</span>
            </div>
            <SelfieImage
              url={checkInSelfieUrl}
              type="check-in"
              alt={checkInAltText}
              onImageError={handleImageError}
            />
          </div>

          {/* Check-out Selfie */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                รูปเซลฟี่เช็คเอาท์
              </h4>
              <span className="text-xs text-gray-500">
                {checkOutSelfieUrl ? 'มีแล้ว' : 'ยังไม่มี'}
              </span>
            </div>
            {checkOutSelfieUrl ? (
              <SelfieImage
                url={checkOutSelfieUrl}
                type="check-out"
                alt={checkOutAltText}
                onImageError={handleImageError}
              />
            ) : (
              <div className="aspect-square bg-gray-50 rounded-lg flex flex-col items-center justify-center p-4 border border-gray-200">
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 text-center">
                  ยังไม่ได้เช็คเอาท์
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <Eye className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <strong>หมายเหตุด้านความเป็นส่วนตัว:</strong> รูปภาพเหล่านี้ใช้เพื่อยืนยันตัวตนในการลงเวลาทำงานเท่านั้น 
              และจะถูกเก็บรักษาอย่างปลอดภัยตามนโยบายความเป็นส่วนตัวของบริษัท
            </div>
          </div>
        </div>

        {/* Image Load Errors */}
        {errorUrls.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ไม่สามารถโหลดรูปภาพได้ {errorUrls.length} รูป 
              กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือลองใหม่อีกครั้ง
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
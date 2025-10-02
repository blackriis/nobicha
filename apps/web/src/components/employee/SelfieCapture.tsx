'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, RotateCcw, X, Check } from 'lucide-react';
import { cameraService, uploadService } from '@/lib/services';
import type { CapturedImage, CameraError, UploadError } from '@/lib/services/camera.service';
import { CameraPermissionRequest } from './CameraPermissionRequest';
import { UploadStatusIndicator } from './UploadStatusIndicator';
import { SelfieRetakeDialog } from './SelfieRetakeDialog';

interface SelfieCaptureProps {
  employeeId: string;
  action: 'checkin' | 'checkout';
  onSuccess: (imageUrl: string) => void;
  onCancel: () => void;
}

type CaptureStep = 'permission' | 'camera' | 'preview' | 'uploading' | 'success' | 'error';

export function SelfieCapture({ 
  employeeId, 
  action, 
  onSuccess, 
  onCancel 
}: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [step, setStep] = useState<CaptureStep>('permission');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [showRetakeDialog, setShowRetakeDialog] = useState(false);
  const [autoRetryCount, setAutoRetryCount] = useState(0);

  // ลบการเริ่มกล้องอัตโนมัติ - ให้รอการกดปุ่มจากผู้ใช้เท่านั้น
  // useEffect สำหรับ initialize camera ถูกลบออกแล้ว

  // Handle video stream assignment
  useEffect(() => {
    if (stream && videoRef.current && step === 'camera') {
      console.log('=== Stream Assignment ===');
      console.log('Stream active:', stream.active);
      console.log('Stream tracks:', stream.getTracks().map(t => ({ 
        kind: t.kind, 
        enabled: t.enabled, 
        readyState: t.readyState,
        muted: t.muted 
      })));

      const videoElement = videoRef.current;
      
      // กำหนด stream ให้ video element ทันที
      videoElement.srcObject = stream;
      
      let playAttempted = false;
      
      // Set up event handlers
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded - dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
        if (videoElement && !playAttempted) {
          playAttempted = true;
          videoElement.play().catch(err => {
            console.error('Video play error:', err);
            // ลอง play อีกครั้งหลังจาก delay
            setTimeout(() => {
              if (videoElement && stream) {
                videoElement.play().catch(() => {
                  setError('ไม่สามารถเริ่มการแสดงผลวิดีโอได้ กรุณากด Restart');
                });
              }
            }, 1000);
          });
        }
      };

      const handleCanPlay = () => {
        console.log('Video can play - should be visible now');
        // Force play ถ้ายัง paused อยู่
        if (videoElement.paused && !playAttempted) {
          playAttempted = true;
          videoElement.play().catch(err => console.warn('Auto-play failed:', err));
        }
      };

      const handleVideoError = (e: Event) => {
        console.error('Video element error:', e);
        setError('เกิดข้อผิดพลาดในการแสดงผลวิดีโอ กรุณากด Restart');
      };

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleVideoError);

      // Force การ load metadata ถ้ายังไม่ได้
      if (videoElement.readyState === 0) {
        console.log('Force loading video metadata');
        videoElement.load();
      }

      // Auto-retry mechanism ถ้า video ไม่ start ภายใน 3 วินาที
      const autoRetryTimer = setTimeout(() => {
        // Check if element is still valid and stream is active
        if (videoElement.paused && 
            videoElement.readyState < 3 && 
            autoRetryCount < 2 &&
            stream?.active &&
            videoElement.srcObject === stream) {
          console.log(`Auto-retry attempt ${autoRetryCount + 1}`);
          setAutoRetryCount(prev => prev + 1);
          videoElement.load();
          setTimeout(() => {
            // Double-check stream is still active before attempting play
            if (stream?.active && videoElement.srcObject === stream) {
              videoElement.play().catch(err => console.warn('Auto-retry play failed:', err));
            }
          }, 500);
        }
      }, 3000);

      return () => {
        clearTimeout(autoRetryTimer);
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleVideoError);
      };
    }
  }, [stream, step, autoRetryCount]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        cameraService.stopCamera();
      }
    };
  }, [stream]);

  const requestCameraAccess = async () => {
    try {
      // Cleanup existing stream first
      if (stream) {
        console.log('Cleaning up existing stream');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      if (!cameraService.isCameraSupported()) {
        setError('เบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้อง');
        setStep('error');
        return;
      }

      console.log('Requesting new camera access');
      const mediaStream = await cameraService.requestCameraAccess('user');
      
      console.log('Camera access successful, stream ready');
      
      // Log stream info
      console.log('New stream received:', {
        id: mediaStream.id,
        active: mediaStream.active,
        tracks: mediaStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState
        }))
      });

      setStream(mediaStream);
      setStep('camera');
    } catch (err) {
      console.error('Camera access error:', err);
      const errorMessage = (err as Error).message;
      
      if (errorMessage.includes('Timeout waiting for tracks')) {
        setError('กล้องใช้เวลานานในการเริ่มต้น กรุณาตรวจสอบการอนุญาตและลองใหม่');
      } else {
        const cameraError = errorMessage as CameraError;
        setError(cameraService.getCameraErrorMessage(cameraError));
      }
      
      setStep('error');
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !stream) return;

    try {
      // Capture with original camera aspect ratio (no forced dimensions)
      const image = await cameraService.captureImage(videoRef.current, {
        quality: 0.85
        // ลบ width/height เพื่อใช้ขนาดจริงของวิดีโอ
      });

      setCapturedImage(image);
      setStep('preview');
      
      // Stop video stream for preview
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการถ่ายภาพ กรุณาลองใหม่อีกครั้ง');
      setStep('error');
    }
  };

  const confirmPhoto = async () => {
    if (!capturedImage) return;

    setStep('uploading');
    setUploadProgress(0);

    try {
      // Compress image if needed
      const compressedBlob = await cameraService.compressImage(capturedImage.blob);

      // Upload to Supabase Storage
      const result = await uploadService.uploadSelfie(
        compressedBlob,
        employeeId,
        action,
        {
          maxRetries: 3,
          onProgress: setUploadProgress,
          onRetry: (attempt) => setRetryCount(attempt)
        }
      );

      setStep('success');
      onSuccess(result.url);
    } catch (err) {
      const uploadError = (err as Error).message as UploadError;
      setError(uploadService.getUploadErrorMessage(uploadError));
      setShowRetakeDialog(true);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setStep('permission');
    setError('');
    setUploadProgress(0);
    setRetryCount(0);
    setAutoRetryCount(0);
    setShowRetakeDialog(false);
  };

  const handleRetry = () => {
    setShowRetakeDialog(false);
    confirmPhoto(); // Retry upload
  };

  const handleCancel = () => {
    if (stream) {
      cameraService.stopCamera();
    }
    onCancel();
  };

  if (step === 'permission') {
    return (
      <CameraPermissionRequest
        onRetry={requestCameraAccess}
        onCancel={handleCancel}
      />
    );
  }

  if (step === 'error') {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-medium">
            เกิดข้อผิดพลาด
          </div>
          <p className="text-gray-600">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={retakePhoto}>
              ลองใหม่
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              ยกเลิก
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (step === 'uploading') {
    return (
      <UploadStatusIndicator
        progress={uploadProgress}
        retryCount={retryCount}
        action={action}
      />
    );
  }

  if (step === 'success') {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="text-green-500 text-lg font-medium flex items-center justify-center gap-2">
            <Check className="h-5 w-5" />
            อัปโหลดสำเร็จ
          </div>
          <p className="text-gray-600">
            รูปเซลฟี่ถูกบันทึกเรียบร้อยแล้ว
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 max-w-md mx-auto">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium">
              ถ่ายรูปเซลฟี่สำหรับ {action === 'checkin' ? 'เช็คอิน' : 'เช็คเอาท์'}
            </h3>
          </div>

          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    display: 'block',
                    maxWidth: '280px',
                    maxHeight: '420px',
                    backgroundColor: '#1f2937',
                    borderRadius: '140px',
                    objectFit: 'contain', // เปลี่ยนจาก 'cover' เป็น 'contain' เพื่อไม่ให้ยืด
                    margin: '0 auto'
                  }}
                  className="border-4 border-blue-300"
                  onCanPlay={() => {
                    console.log('Video can play - should show image now');
                    if (videoRef.current) {
                      console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                      console.log('Video readyState:', videoRef.current.readyState);
                      console.log('Video srcObject:', videoRef.current.srcObject);
                    }
                  }}
                  onLoadStart={() => console.log('Video load started')}
                  onLoadedData={() => console.log('Video data loaded')}
                  onPlaying={() => console.log('Video is playing')}
                />
                
                {/* กรอบวงรีนำทาง */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse 130px 200px at center, transparent 70%, rgba(0,0,0,0.3) 71%)',
                    borderRadius: '140px'
                  }}
                />
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    width: '260px',
                    height: '390px',
                    border: '2px dashed rgba(59, 130, 246, 0.6)',
                    borderRadius: '130px',
                  }}
                />
              </div>
              
              <div className="text-center text-sm text-gray-600 mb-4">
                <div className="font-medium text-blue-600 mb-2 flex items-center justify-center gap-2">
                  <Camera className="h-4 w-4" />
                  จัดท่าเซลฟี่
                </div>
                <div>• วางหน้าให้อยู่ในกรอบวงรี</div>
                <div>• ระยะห่างประมาณ 30-40 ซม.</div>
                <div>• แสงสว่างเพียงพอ</div>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button onClick={capturePhoto} size="lg" className="px-6">
                  <Camera className="h-4 w-4 mr-2" />
                  ถ่ายรูป
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  ยกเลิก
                </Button>
              </div>

            </div>
          )}

          {step === 'preview' && capturedImage && (
            <div className="space-y-4">
              <div className="relative flex justify-center">
                <img
                  src={capturedImage.dataUrl}
                  alt="Selfie Preview"
                  style={{
                    maxWidth: '280px',
                    maxHeight: '420px',
                    objectFit: 'contain', // เปลี่ยนจาก 'cover' เป็น 'contain' เพื่อไม่ให้ยืด
                    borderRadius: '20px' // ลดขนาด radius เนื่องจากขนาดอาจเปลี่ยน
                  }}
                  className="border-4 border-blue-300"
                />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  ตรวจสอบรูปภาพและกดยืนยันเพื่อดำเนินการต่อ
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={confirmPhoto} size="lg">
                    <Check className="h-4 w-4 mr-2" />
                    ยืนยัน
                  </Button>
                  <Button variant="outline" onClick={retakePhoto}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    ถ่ายใหม่
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {showRetakeDialog && (
        <SelfieRetakeDialog
          error={error}
          onRetry={handleRetry}
          onRetake={retakePhoto}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
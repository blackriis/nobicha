/**
 * Camera Service
 * Handle camera access, permissions, and image capture
 */

export type CameraError = 
  | 'PERMISSION_DENIED'
  | 'CAMERA_NOT_AVAILABLE'
  | 'DEVICE_NOT_SUPPORTED'
  | 'UNKNOWN_ERROR';

export interface CaptureOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number; // 0-1
}

export interface CapturedImage {
  blob: Blob;
  dataUrl: string;
  size: number;
}

export class CameraService {
  private stream: MediaStream | null = null;

  /**
   * Request camera permission and access
   */
  async requestCameraAccess(facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('DEVICE_NOT_SUPPORTED');
      }

      // Detect platform
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      
      // Log platform detection for debugging
      console.log('Platform detection:', {
        userAgent,
        isIOS,
        isAndroid,
        platform: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Other'
      });

      // Try with ideal constraints first - Portrait orientation for selfies
      // iOS requires specific aspect ratio to force portrait mode
      let constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          aspectRatio: { ideal: 0.5625 }, // 9:16 portrait ratio (inverse of 16:9)
          width: { ideal: 720, max: 1080 },
          height: { ideal: 1280, max: 1920 }
        },
        audio: false
      };

      // iOS-specific constraints for better portrait support
      if (isIOS) {
        constraints = {
          video: {
            facingMode,
            aspectRatio: 0.5625, // 9:16 exact ratio for iOS
            width: { ideal: 720 },
            height: { ideal: 1280 }
          },
          audio: false
        };
        console.log('Using iOS-specific constraints');
      } else if (isAndroid) {
        // Android-specific constraints
        // Android Chrome/WebView may have different capabilities
        // Use ideal constraints (not exact) for better compatibility
        constraints = {
          video: {
            facingMode,
            aspectRatio: { ideal: 0.5625 }, // 9:16 portrait ratio (ideal, not exact)
            width: { ideal: 720, max: 1920 },
            height: { ideal: 1280, max: 2560 }
          },
          audio: false
        };
        console.log('Using Android-specific constraints');
      }

      try {
        console.log('Attempting camera access with ideal constraints:', constraints);
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Log stream info for debugging
        console.log('Camera stream obtained:', {
          streamId: this.stream.id,
          active: this.stream.active,
          tracks: this.stream.getVideoTracks().map(t => ({
            id: t.id,
            label: t.label,
            enabled: t.enabled,
            readyState: t.readyState,
            settings: t.getSettings()
          }))
        });

        // Wait for tracks to be ready with longer timeout
        await this.waitForTracksReady(this.stream, 3000);
        return this.stream;
      } catch (idealError) {
        console.warn('Ideal constraints failed, trying fallback:', idealError);
        
        // Android-specific fallback: Some Android devices don't support aspectRatio
        if (isAndroid) {
          // Try without aspectRatio constraint for Android
          constraints = {
            video: {
              facingMode,
              width: { ideal: 720, min: 480 },
              height: { ideal: 1280, min: 640 }
            },
            audio: false
          };
          console.log('Attempting Android fallback (without aspectRatio):', constraints);
          
          try {
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Android fallback successful');
            await this.waitForTracksReady(this.stream, 3000);
            return this.stream;
          } catch (androidFallbackError) {
            console.warn('Android fallback also failed:', androidFallbackError);
            // Continue to basic fallback below
          }
        }

        // Basic fallback - Minimal constraints for maximum compatibility
        constraints = {
          video: {
            facingMode,
            aspectRatio: { ideal: 0.75 }, // Try 3:4 portrait as fallback
            width: { min: 480 },
            height: { min: 640 }
          },
          audio: false
        };

        console.log('Attempting camera access with basic fallback constraints:', constraints);
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Wait for tracks to be ready with longer timeout
        await this.waitForTracksReady(this.stream, 3000);
        return this.stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('PERMISSION_DENIED');
        }
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('CAMERA_NOT_AVAILABLE');
        }
        if (error.name === 'OverconstrainedError') {
          throw new Error('CAMERA_NOT_AVAILABLE');
        }
        if (error.message === 'DEVICE_NOT_SUPPORTED') {
          throw error;
        }
      }
      throw new Error('UNKNOWN_ERROR');
    }
  }

  /**
   * Wait for MediaStream tracks to be ready
   */
  private async waitForTracksReady(stream: MediaStream, timeout = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = timeout / 100; // 100ms intervals
      const isAndroid = /Android/.test(navigator.userAgent);
      
      const checkTracks = () => {
        const videoTracks = stream.getVideoTracks();
        
        // Check if we have video tracks and they're in a usable state
        if (videoTracks.length === 0) {
          console.log('No video tracks found');
          setTimeout(checkTracks, 100);
          return;
        }
        
        const hasUsableTrack = videoTracks.some(track => {
          const isUsable = track.readyState === 'live' && track.enabled && !track.muted;
          const trackInfo = {
            id: track.id,
            readyState: track.readyState,
            enabled: track.enabled,
            muted: track.muted,
            settings: track.getSettings()
          };
          
          // Enhanced logging for Android debugging
          if (isAndroid) {
            console.log(`[Android] Track ${track.id}:`, trackInfo);
          } else {
            console.log(`Track ${track.id}:`, trackInfo);
          }
          
          return isUsable;
        });
        
        attempts++;
        
        if (hasUsableTrack) {
          console.log('Video tracks are ready');
          resolve();
        } else if (attempts >= maxAttempts) {
          // Android devices may need more time
          if (isAndroid && attempts < maxAttempts * 2) {
            console.log(`[Android] Extended timeout: attempt ${attempts}/${maxAttempts * 2}`);
            setTimeout(checkTracks, 100);
            return;
          }
          console.warn('Timeout waiting for tracks, but proceeding anyway');
          resolve(); // ไม่ reject แต่ให้ proceed ต่อไป
        } else {
          console.log(`Waiting for video tracks to be ready... (attempt ${attempts}/${maxAttempts})`);
          setTimeout(checkTracks, 100);
        }
      };

      // Start checking immediately
      checkTracks();
    });
  }

  /**
   * Check if camera is supported
   */
  isCameraSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Capture image from video element
   */
  captureImage(
    videoElement: HTMLVideoElement, 
    options: CaptureOptions = {}
  ): Promise<CapturedImage> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        // Use actual video dimensions to preserve aspect ratio
        const videoWidth = videoElement.videoWidth || 640;
        const videoHeight = videoElement.videoHeight || 480;
        
        // Set canvas to match video's actual dimensions (no stretching)
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        console.log('Capturing image with original aspect ratio:', {
          videoWidth,
          videoHeight,
          aspectRatio: (videoWidth / videoHeight).toFixed(2)
        });

        // Draw video frame to canvas using actual dimensions
        ctx.drawImage(videoElement, 0, 0, videoWidth, videoHeight);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }

            const dataUrl = canvas.toDataURL('image/jpeg', options.quality || 0.85);
            
            resolve({
              blob,
              dataUrl,
              size: blob.size
            });
          },
          'image/jpeg',
          options.quality || 0.85
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Compress image if it exceeds size limit
   */
  async compressImage(blob: Blob, maxSizeBytes: number = 2 * 1024 * 1024): Promise<Blob> {
    if (blob.size <= maxSizeBytes) {
      return blob;
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        // Calculate new dimensions (reduce by 20% each iteration)
        const scale = Math.sqrt(maxSizeBytes / blob.size);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (compressedBlob) => {
            if (!compressedBlob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            resolve(compressedBlob);
          },
          'image/jpeg',
          0.7
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Stop camera stream
   */
  stopCamera(): void {
    if (this.stream) {
      console.log('Stopping camera service stream');
      this.stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.readyState);
        track.stop();
      });
      this.stream = null;
    }
  }

  /**
   * Get current stream status
   */
  getStreamStatus(): { hasStream: boolean; active: boolean; tracks: Array<{ kind: string; enabled: boolean; readyState: string; muted: boolean }> } {
    if (!this.stream) {
      return { hasStream: false, active: false, tracks: [] };
    }

    return {
      hasStream: true,
      active: this.stream.active,
      tracks: this.stream.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted
      }))
    };
  }

  /**
   * Get camera error message in Thai
   */
  getCameraErrorMessage(error: CameraError): string {
    switch (error) {
      case 'PERMISSION_DENIED':
        return 'ไม่ได้รับอนุญาตให้เข้าถึงกล้อง กรุณาอนุญาตการเข้าถึงกล้องในการตั้งค่าเบราว์เซอร์';
      case 'CAMERA_NOT_AVAILABLE':
        return 'ไม่พบกล้องในอุปกรณ์นี้';
      case 'DEVICE_NOT_SUPPORTED':
        return 'เบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้อง';
      default:
        return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    }
  }
}

// Singleton instance
export const cameraService = new CameraService();
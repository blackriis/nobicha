import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CameraService } from '@/lib/services/camera.service';

// Mock MediaDevices API
const mockGetUserMedia = vi.fn();
const mockMediaDevices = {
  getUserMedia: mockGetUserMedia,
};

// Mock HTML elements
const mockVideoElement = {
  videoWidth: 640,
  videoHeight: 480,
} as HTMLVideoElement;

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
  toBlob: vi.fn(),
  toDataURL: vi.fn(),
} as unknown as HTMLCanvasElement;

const mockCanvasContext = {
  drawImage: vi.fn(),
} as unknown as CanvasRenderingContext2D;

// Mock DOM methods
global.document = {
  createElement: vi.fn(),
} as any;

// Mock URL.createObjectURL
global.URL = {
  createObjectURL: vi.fn(),
} as any;

// Mock Image constructor
global.Image = vi.fn();

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
});

describe('CameraService', () => {
  let cameraService: CameraService;
  let mockStream: MediaStream;

  beforeEach(() => {
    cameraService = new CameraService();
    
    // Mock MediaStream
    mockStream = {
      getTracks: vi.fn(() => [
        { stop: vi.fn() } as MediaStreamTrack
      ])
    } as unknown as MediaStream;

    // Setup DOM mocks
    (document.createElement as any).mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        (mockCanvas.getContext as any).mockReturnValue(mockCanvasContext);
        return mockCanvas;
      }
      return {};
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    cameraService.stopCamera();
  });

  describe('isCameraSupported', () => {
    it('should return true when MediaDevices API is available', () => {
      expect(cameraService.isCameraSupported()).toBe(true);
    });

    it('should return false when MediaDevices API is not available', () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });

      expect(cameraService.isCameraSupported()).toBe(false);
    });
  });

  describe('requestCameraAccess', () => {
    it('should successfully request camera access with default settings', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream);

      const result = await cameraService.requestCameraAccess();

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      expect(result).toBe(mockStream);
    });

    it('should request back camera when specified', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream);

      const result = await cameraService.requestCameraAccess('environment');

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      expect(result).toBe(mockStream);
    });

    it('should throw DEVICE_NOT_SUPPORTED when MediaDevices is not available', async () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });

      await expect(cameraService.requestCameraAccess()).rejects.toThrow('DEVICE_NOT_SUPPORTED');
    });

    it('should throw PERMISSION_DENIED on permission error', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('NotAllowedError'));
      Object.defineProperty(mockGetUserMedia.mock.results[0].value, 'name', {
        value: 'NotAllowedError'
      });

      const error = new Error();
      error.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(error);

      await expect(cameraService.requestCameraAccess()).rejects.toThrow('PERMISSION_DENIED');
    });

    it('should throw CAMERA_NOT_AVAILABLE when no camera found', async () => {
      const error = new Error();
      error.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValue(error);

      await expect(cameraService.requestCameraAccess()).rejects.toThrow('CAMERA_NOT_AVAILABLE');
    });
  });

  describe('captureImage', () => {
    beforeEach(() => {
      (mockCanvas.toBlob as any).mockImplementation((callback: BlobCallback) => {
        const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
        callback(mockBlob);
      });
      
      (mockCanvas.toDataURL as any).mockReturnValue('data:image/jpeg;base64,test');
    });

    it('should capture image from video element', async () => {
      const result = await cameraService.captureImage(mockVideoElement);

      expect(mockCanvasContext.drawImage).toHaveBeenCalledWith(
        mockVideoElement, 
        0, 
        0, 
        640, 
        480
      );
      expect(result.dataUrl).toBe('data:image/jpeg;base64,test');
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('should use custom dimensions when provided', async () => {
      const options = { width: 320, height: 240, quality: 0.7 };
      
      await cameraService.captureImage(mockVideoElement, options);

      expect(mockCanvas.width).toBe(320);
      expect(mockCanvas.height).toBe(240);
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.7);
    });

    it('should reject when canvas context is not available', async () => {
      (mockCanvas.getContext as any).mockReturnValue(null);

      await expect(cameraService.captureImage(mockVideoElement)).rejects.toThrow('Canvas not supported');
    });
  });

  describe('compressImage', () => {
    it('should return original blob if size is within limit', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      Object.defineProperty(mockBlob, 'size', { value: 1000 }); // 1KB

      const result = await cameraService.compressImage(mockBlob, 2000); // 2KB limit

      expect(result).toBe(mockBlob);
    });

    it('should compress image if size exceeds limit', async () => {
      const largeMockBlob = new Blob(['test'], { type: 'image/jpeg' });
      Object.defineProperty(largeMockBlob, 'size', { value: 3000000 }); // 3MB

      const compressedMockBlob = new Blob(['compressed'], { type: 'image/jpeg' });
      Object.defineProperty(compressedMockBlob, 'size', { value: 1000000 }); // 1MB

      (global.URL.createObjectURL as any).mockReturnValue('blob:test-url');
      
      // Mock Image constructor
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        width: 1280,
        height: 720,
      };
      (global.Image as any).mockImplementation(() => mockImage);

      (mockCanvas.toBlob as any).mockImplementation((callback: BlobCallback) => {
        callback(compressedMockBlob);
      });

      const compressionPromise = cameraService.compressImage(largeMockBlob, 2000000);
      
      // Simulate image load
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await compressionPromise;
      expect(result).toBe(compressedMockBlob);
    });
  });

  describe('stopCamera', () => {
    it('should stop all tracks when stream exists', () => {
      const mockTrack = { stop: vi.fn() };
      const stream = {
        getTracks: vi.fn(() => [mockTrack])
      } as unknown as MediaStream;

      // Manually set stream
      (cameraService as any).stream = stream;

      cameraService.stopCamera();

      expect(stream.getTracks).toHaveBeenCalled();
      expect(mockTrack.stop).toHaveBeenCalled();
    });

    it('should handle case when no stream exists', () => {
      expect(() => cameraService.stopCamera()).not.toThrow();
    });
  });

  describe('getCameraErrorMessage', () => {
    it('should return correct Thai messages for each error type', () => {
      expect(cameraService.getCameraErrorMessage('PERMISSION_DENIED'))
        .toBe('ไม่ได้รับอนุญาตให้เข้าถึงกล้อง กรุณาอนุญาตการเข้าถึงกล้องในการตั้งค่าเบราว์เซอร์');
      
      expect(cameraService.getCameraErrorMessage('CAMERA_NOT_AVAILABLE'))
        .toBe('ไม่พบกล้องในอุปกรณ์นี้');
      
      expect(cameraService.getCameraErrorMessage('DEVICE_NOT_SUPPORTED'))
        .toBe('เบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้อง');
      
      expect(cameraService.getCameraErrorMessage('UNKNOWN_ERROR'))
        .toBe('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
    });
  });
});
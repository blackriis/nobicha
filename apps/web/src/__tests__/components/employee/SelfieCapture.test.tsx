import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SelfieCapture } from '@/components/employee/SelfieCapture';

// Component prop types
interface CameraPermissionRequestProps {
  onRetry: () => void
  onCancel: () => void
}

interface UploadStatusIndicatorProps {
  progress: number
  action: string
}

interface SelfieRetakeDialogProps {
  error: string
  onRetry: () => void
  onRetake: () => void
  onCancel: () => void
}

// Mock services
const mockRequestCameraAccess = vi.fn();
const mockCaptureImage = vi.fn();
const mockCompressImage = vi.fn();
const mockStopCamera = vi.fn();
const mockIsCameraSupported = vi.fn();

const mockUploadSelfie = vi.fn();

vi.mock('@/lib/services', () => ({
  cameraService: {
    requestCameraAccess: mockRequestCameraAccess,
    captureImage: mockCaptureImage,
    compressImage: mockCompressImage,
    stopCamera: mockStopCamera,
    isCameraSupported: mockIsCameraSupported,
    getCameraErrorMessage: (error: string) => `Camera error: ${error}`,
  },
  uploadService: {
    uploadSelfie: mockUploadSelfie,
    getUploadErrorMessage: (error: string) => `Upload error: ${error}`,
  },
}));

// Mock child components
vi.mock('@/components/employee/CameraPermissionRequest', () => ({
  CameraPermissionRequest: ({ onRetry, onCancel }: CameraPermissionRequestProps) => (
    <div data-testid="camera-permission">
      <button onClick={onRetry}>Allow Camera</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('@/components/employee/UploadStatusIndicator', () => ({
  UploadStatusIndicator: ({ progress, action }: UploadStatusIndicatorProps) => (
    <div data-testid="upload-status">
      Progress: {progress}% for {action}
    </div>
  ),
}));

vi.mock('@/components/employee/SelfieRetakeDialog', () => ({
  SelfieRetakeDialog: ({ error, onRetry, onRetake, onCancel }: SelfieRetakeDialogProps) => (
    <div data-testid="retake-dialog">
      <div>Error: {error}</div>
      <button onClick={onRetry}>Retry Upload</button>
      <button onClick={onRetake}>Retake Photo</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('SelfieCapture', () => {
  const defaultProps = {
    employeeId: 'emp-123',
    action: 'checkin' as const,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsCameraSupported.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render camera permission request initially', () => {
    render(<SelfieCapture {...defaultProps} />);
    
    expect(screen.getByTestId('camera-permission')).toBeInTheDocument();
  });

  it('should show camera interface after permission granted', async () => {
    const mockStream = {} as MediaStream;
    mockRequestCameraAccess.mockResolvedValue(mockStream);

    render(<SelfieCapture {...defaultProps} />);
    
    const allowButton = screen.getByText('Allow Camera');
    fireEvent.click(allowButton);

    await waitFor(() => {
      expect(screen.getByText('ถ่ายรูปเซลฟี่สำหรับ เช็คอิน')).toBeInTheDocument();
      expect(screen.getByText('📷 ถ่ายรูป')).toBeInTheDocument();
    });
  });

  it('should handle camera permission denied', async () => {
    mockRequestCameraAccess.mockRejectedValue(new Error('PERMISSION_DENIED'));

    render(<SelfieCapture {...defaultProps} />);
    
    const allowButton = screen.getByText('Allow Camera');
    fireEvent.click(allowButton);

    await waitFor(() => {
      expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
      expect(screen.getByText('Camera error: PERMISSION_DENIED')).toBeInTheDocument();
    });
  });

  it('should capture and preview image', async () => {
    const mockStream = {} as MediaStream;
    const mockImage = {
      blob: new Blob(['test'], { type: 'image/jpeg' }),
      dataUrl: 'data:image/jpeg;base64,test',
      size: 1024,
    };

    mockRequestCameraAccess.mockResolvedValue(mockStream);
    mockCaptureImage.mockResolvedValue(mockImage);

    render(<SelfieCapture {...defaultProps} />);
    
    // Get camera permission
    fireEvent.click(screen.getByText('Allow Camera'));
    
    await waitFor(() => {
      expect(screen.getByText('📷 ถ่ายรูป')).toBeInTheDocument();
    });

    // Capture photo
    fireEvent.click(screen.getByText('📷 ถ่ายรูป'));

    await waitFor(() => {
      expect(screen.getByText('✓ ยืนยัน')).toBeInTheDocument();
      expect(screen.getByText('ถ่ายใหม่')).toBeInTheDocument();
      expect(screen.getByAltText('Selfie Preview')).toBeInTheDocument();
    });
  });

  it('should upload image after confirmation', async () => {
    const mockStream = {} as MediaStream;
    const mockImage = {
      blob: new Blob(['test'], { type: 'image/jpeg' }),
      dataUrl: 'data:image/jpeg;base64,test',
      size: 1024,
    };
    const mockCompressedBlob = new Blob(['compressed'], { type: 'image/jpeg' });
    const mockUploadResult = {
      url: 'https://example.com/selfie.jpg',
      path: 'path/to/selfie.jpg',
      size: 800,
    };

    mockRequestCameraAccess.mockResolvedValue(mockStream);
    mockCaptureImage.mockResolvedValue(mockImage);
    mockCompressImage.mockResolvedValue(mockCompressedBlob);
    mockUploadSelfie.mockResolvedValue(mockUploadResult);

    render(<SelfieCapture {...defaultProps} />);
    
    // Get permission and capture
    fireEvent.click(screen.getByText('Allow Camera'));
    await waitFor(() => screen.getByText('📷 ถ่ายรูป'));
    fireEvent.click(screen.getByText('📷 ถ่ายรูป'));
    
    await waitFor(() => screen.getByText('✓ ยืนยัน'));
    
    // Confirm upload
    fireEvent.click(screen.getByText('✓ ยืนยัน'));

    await waitFor(() => {
      expect(screen.getByTestId('upload-status')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('✓ อัปโหลดสำเร็จ')).toBeInTheDocument();
    });

    expect(mockUploadSelfie).toHaveBeenCalledWith(
      mockCompressedBlob,
      'emp-123',
      'checkin',
      expect.objectContaining({
        maxRetries: 3,
        onProgress: expect.any(Function),
        onRetry: expect.any(Function),
      })
    );
    expect(defaultProps.onSuccess).toHaveBeenCalledWith('https://example.com/selfie.jpg');
  });

  it('should show retry dialog on upload failure', async () => {
    const mockStream = {} as MediaStream;
    const mockImage = {
      blob: new Blob(['test'], { type: 'image/jpeg' }),
      dataUrl: 'data:image/jpeg;base64,test',
      size: 1024,
    };
    const mockCompressedBlob = new Blob(['compressed'], { type: 'image/jpeg' });

    mockRequestCameraAccess.mockResolvedValue(mockStream);
    mockCaptureImage.mockResolvedValue(mockImage);
    mockCompressImage.mockResolvedValue(mockCompressedBlob);
    mockUploadSelfie.mockRejectedValue(new Error('NETWORK_ERROR'));

    render(<SelfieCapture {...defaultProps} />);
    
    // Complete flow to upload
    fireEvent.click(screen.getByText('Allow Camera'));
    await waitFor(() => screen.getByText('📷 ถ่ายรูป'));
    fireEvent.click(screen.getByText('📷 ถ่ายรูป'));
    await waitFor(() => screen.getByText('✓ ยืนยัน'));
    fireEvent.click(screen.getByText('✓ ยืนยัน'));

    await waitFor(() => {
      expect(screen.getByTestId('retake-dialog')).toBeInTheDocument();
      expect(screen.getByText('Upload error: NETWORK_ERROR')).toBeInTheDocument();
    });
  });

  it('should handle retake photo from retry dialog', async () => {
    const mockStream = {} as MediaStream;
    const mockImage = {
      blob: new Blob(['test'], { type: 'image/jpeg' }),
      dataUrl: 'data:image/jpeg;base64,test',
      size: 1024,
    };

    mockRequestCameraAccess.mockResolvedValue(mockStream);
    mockCaptureImage.mockResolvedValue(mockImage);
    mockUploadSelfie.mockRejectedValue(new Error('NETWORK_ERROR'));

    render(<SelfieCapture {...defaultProps} />);
    
    // Get to retry dialog
    fireEvent.click(screen.getByText('Allow Camera'));
    await waitFor(() => screen.getByText('📷 ถ่ายรูป'));
    fireEvent.click(screen.getByText('📷 ถ่ายรูป'));
    await waitFor(() => screen.getByText('✓ ยืนยัน'));
    fireEvent.click(screen.getByText('✓ ยืนยัน'));
    
    await waitFor(() => screen.getByTestId('retake-dialog'));
    
    // Retake photo
    fireEvent.click(screen.getByText('Retake Photo'));

    await waitFor(() => {
      expect(screen.getByTestId('camera-permission')).toBeInTheDocument();
    });
  });

  it('should handle cancel from various states', () => {
    render(<SelfieCapture {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Cancel'));

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should display correct action text for checkout', () => {
    render(<SelfieCapture {...defaultProps} action="checkout" />);
    
    // Should be visible after getting camera permission
    expect(screen.getByTestId('camera-permission')).toBeInTheDocument();
  });

  it('should handle unsupported camera', () => {
    mockIsCameraSupported.mockReturnValue(false);

    render(<SelfieCapture {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Allow Camera'));

    expect(screen.getByText('เบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้อง')).toBeInTheDocument();
  });

  it('should cleanup camera stream on unmount', () => {
    const { unmount } = render(<SelfieCapture {...defaultProps} />);
    
    unmount();

    expect(mockStopCamera).toHaveBeenCalled();
  });
});
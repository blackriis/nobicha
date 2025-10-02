import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CheckInOutCard } from '@/components/employee/CheckInOutCard';

// Mock services
const mockCheckIn = vi.fn();
const mockCheckOut = vi.fn();
const mockGetStatus = vi.fn();
const mockRequestCameraAccess = vi.fn();
const mockCaptureImage = vi.fn();
const mockUploadSelfie = vi.fn();

vi.mock('@/lib/services/time-entry.service', () => ({
  timeEntryService: {
    checkIn: mockCheckIn,
    checkOut: mockCheckOut,
    getStatus: mockGetStatus,
  },
}));

vi.mock('@/lib/services', () => ({
  cameraService: {
    requestCameraAccess: mockRequestCameraAccess,
    captureImage: mockCaptureImage,
    compressImage: vi.fn((blob) => Promise.resolve(blob)),
    stopCamera: vi.fn(),
    isCameraSupported: () => true,
  },
  uploadService: {
    uploadSelfie: mockUploadSelfie,
  },
}));

// Mock child components that we don't want to test in integration
vi.mock('@/components/employee/BranchSelector', () => ({
  BranchSelector: ({ onCheckIn, onCancel }: any) => (
    <div data-testid="branch-selector">
      <button onClick={() => onCheckIn({
        branchId: 'branch-1',
        latitude: 13.7563,
        longitude: 100.5018,
        selfieUrl: 'placeholder'
      })}>
        Select Branch
      </button>
      <button onClick={onCancel}>Cancel Branch Selection</button>
    </div>
  ),
}));

vi.mock('@/components/employee/TimeEntryStatus', () => ({
  TimeEntryStatus: () => <div data-testid="time-entry-status">Status Component</div>,
}));

vi.mock('@/components/location/LocationErrorHandler', () => ({
  LocationErrorHandler: () => <div data-testid="location-error-handler">Location Handler</div>,
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('Selfie Check-in Workflow Integration', () => {
  const defaultProps = {
    onStatusChange: vi.fn(),
    employeeId: 'emp-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Check-in Flow with Selfie', () => {
    it('should complete full check-in workflow with selfie capture', async () => {
      // Setup mocks
      const mockStream = {} as MediaStream;
      const mockImage = {
        blob: new Blob(['selfie'], { type: 'image/jpeg' }),
        dataUrl: 'data:image/jpeg;base64,selfie',
        size: 1024,
      };
      const mockUploadResult = {
        url: 'https://storage.com/selfie.jpg',
        path: 'path/to/selfie.jpg',
        size: 1024,
      };

      mockRequestCameraAccess.mockResolvedValue(mockStream);
      mockCaptureImage.mockResolvedValue(mockImage);
      mockUploadSelfie.mockResolvedValue(mockUploadResult);
      mockCheckIn.mockResolvedValue({
        success: true,
        message: 'Check-in successful',
        timeEntry: { id: '1', checkInTime: '2025-01-01T09:00:00Z' },
      });

      render(<CheckInOutCard {...defaultProps} />);

      // 1. Click Check-in button
      fireEvent.click(screen.getByText(/Check-In \+ เซลฟี่/));

      await waitFor(() => {
        expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
      });

      // 2. Select branch
      fireEvent.click(screen.getByText('Select Branch'));

      // 3. Camera permission should be requested automatically
      await waitFor(() => {
        expect(screen.getByText('อนุญาตการเข้าถึงกล้อง')).toBeInTheDocument();
      });

      // 4. Allow camera access
      fireEvent.click(screen.getByText('📷 อนุญาตการเข้าถึงกล้อง'));

      await waitFor(() => {
        expect(screen.getByText('ถ่ายรูปเซลฟี่สำหรับ เช็คอิน')).toBeInTheDocument();
      });

      // 5. Capture photo
      fireEvent.click(screen.getByText('📷 ถ่ายรูป'));

      await waitFor(() => {
        expect(screen.getByText('✓ ยืนยัน')).toBeInTheDocument();
      });

      // 6. Confirm photo
      fireEvent.click(screen.getByText('✓ ยืนยัน'));

      // 7. Verify upload process
      await waitFor(() => {
        expect(mockUploadSelfie).toHaveBeenCalledWith(
          mockImage.blob,
          'emp-123',
          'checkin',
          expect.any(Object)
        );
      });

      // 8. Verify check-in API call
      await waitFor(() => {
        expect(mockCheckIn).toHaveBeenCalledWith({
          branchId: 'branch-1',
          latitude: 13.7563,
          longitude: 100.5018,
          selfieUrl: 'https://storage.com/selfie.jpg',
        });
      });

      // 9. Verify success message
      await waitFor(() => {
        expect(screen.getByText('Check-in successful')).toBeInTheDocument();
      });

      // 10. Verify status change callback
      expect(defaultProps.onStatusChange).toHaveBeenCalled();
    });
  });

  describe('Complete Check-out Flow with Selfie', () => {
    it('should complete full check-out workflow with selfie capture', async () => {
      // Setup mocks
      const mockStream = {} as MediaStream;
      const mockImage = {
        blob: new Blob(['selfie'], { type: 'image/jpeg' }),
        dataUrl: 'data:image/jpeg;base64,selfie',
        size: 1024,
      };
      const mockUploadResult = {
        url: 'https://storage.com/checkout-selfie.jpg',
        path: 'path/to/checkout-selfie.jpg',
        size: 1024,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 13.7563,
            longitude: 100.5018,
          },
        });
      });

      mockRequestCameraAccess.mockResolvedValue(mockStream);
      mockCaptureImage.mockResolvedValue(mockImage);
      mockUploadSelfie.mockResolvedValue(mockUploadResult);
      mockCheckOut.mockResolvedValue({
        success: true,
        message: 'Check-out successful',
        timeEntry: { 
          id: '1', 
          checkOutTime: '2025-01-01T17:00:00Z',
          totalHours: 8,
        },
      });

      render(<CheckInOutCard {...defaultProps} />);

      // 1. Click Check-out button
      fireEvent.click(screen.getByText(/Check-Out \+ เซลฟี่/));

      // 2. Location should be obtained automatically
      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });

      // 3. Selfie capture should start
      await waitFor(() => {
        expect(screen.getByText('ถ่ายรูปเซลฟี่สำหรับ เช็คเอาท์')).toBeInTheDocument();
      });

      // 4. Complete selfie workflow (simplified for integration test)
      // Allow camera
      fireEvent.click(screen.getByText('📷 อนุญาตการเข้าถึงกล้อง'));

      await waitFor(() => {
        expect(screen.getByText('📷 ถ่ายรูป')).toBeInTheDocument();
      });

      // Capture and confirm
      fireEvent.click(screen.getByText('📷 ถ่ายรูป'));
      
      await waitFor(() => {
        expect(screen.getByText('✓ ยืนยัน')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('✓ ยืนยัน'));

      // 5. Verify upload and check-out
      await waitFor(() => {
        expect(mockUploadSelfie).toHaveBeenCalledWith(
          mockImage.blob,
          'emp-123',
          'checkout',
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(mockCheckOut).toHaveBeenCalledWith({
          latitude: 13.7563,
          longitude: 100.5018,
          selfieUrl: 'https://storage.com/checkout-selfie.jpg',
        });
      });

      // 6. Verify success
      await waitFor(() => {
        expect(screen.getByText('Check-out successful')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle upload failure gracefully', async () => {
      const mockStream = {} as MediaStream;
      const mockImage = {
        blob: new Blob(['selfie'], { type: 'image/jpeg' }),
        dataUrl: 'data:image/jpeg;base64,selfie',
        size: 1024,
      };

      mockRequestCameraAccess.mockResolvedValue(mockStream);
      mockCaptureImage.mockResolvedValue(mockImage);
      mockUploadSelfie.mockRejectedValue(new Error('Upload failed'));

      render(<CheckInOutCard {...defaultProps} />);

      // Start check-in flow
      fireEvent.click(screen.getByText(/Check-In \+ เซลฟี่/));
      
      await waitFor(() => screen.getByTestId('branch-selector'));
      fireEvent.click(screen.getByText('Select Branch'));

      // Complete selfie capture
      await waitFor(() => screen.getByText('📷 อนุญาตการเข้าถึงกล้อง'));
      fireEvent.click(screen.getByText('📷 อนุญาตการเข้าถึงกล้อง'));
      
      await waitFor(() => screen.getByText('📷 ถ่ายรูป'));
      fireEvent.click(screen.getByText('📷 ถ่ายรูป'));
      
      await waitFor(() => screen.getByText('✓ ยืนยัน'));
      fireEvent.click(screen.getByText('✓ ยืนยัน'));

      // Should show retry dialog
      await waitFor(() => {
        expect(screen.getByText('🔄 ลองอัปโหลดใหม่')).toBeInTheDocument();
        expect(screen.getByText('📷 ถ่ายรูปใหม่')).toBeInTheDocument();
      });
    });

    it('should handle location access failure for check-out', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ message: 'Location access denied' });
      });

      render(<CheckInOutCard {...defaultProps} />);

      fireEvent.click(screen.getByText(/Check-Out \+ เซลฟี่/));

      await waitFor(() => {
        expect(screen.getByText('ไม่สามารถเข้าถึงตำแหน่งได้')).toBeInTheDocument();
      });
    });
  });

  describe('UI States', () => {
    it('should show loading state during processing', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(() => {
        // Don't call success callback to simulate loading
      });

      render(<CheckInOutCard {...defaultProps} />);

      fireEvent.click(screen.getByText(/Check-Out \+ เซลฟี่/));

      expect(screen.getByText('กำลังดำเนินการ...')).toBeInTheDocument();
    });

    it('should disable buttons when no employeeId provided', () => {
      render(<CheckInOutCard {...defaultProps} employeeId={undefined} />);

      expect(screen.getByText(/Check-In \+ เซลฟี่/)).toBeDisabled();
      expect(screen.getByText(/Check-Out \+ เซลฟี่/)).toBeDisabled();
      expect(screen.getByText('กำลังโหลดข้อมูลผู้ใช้...')).toBeInTheDocument();
    });
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckInOutCard } from '@/components/employee/CheckInOutCard';
import { timeEntryService } from '@/lib/services/time-entry.service';

// Mock the time entry service
vi.mock('@/lib/services/time-entry.service', () => ({
  timeEntryService: {
    checkIn: vi.fn(),
    checkOut: vi.fn(),
  },
}));

// Mock the child components
vi.mock('@/components/employee/TimeEntryStatus', () => ({
  TimeEntryStatus: vi.fn(() => <div data-testid="time-entry-status">Time Entry Status</div>),
}));

vi.mock('@/components/employee/BranchSelector', () => ({
  BranchSelector: vi.fn(({ onCheckIn, onCancel }) => (
    <div data-testid="branch-selector">
      <button onClick={() => onCheckIn({ branchId: 'test-branch', latitude: 13.7563, longitude: 100.5018 })}>
        Test Check-In
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )),
}));

vi.mock('@/components/location/LocationErrorHandler', () => ({
  LocationErrorHandler: vi.fn(() => <div data-testid="location-error-handler">Location Error Handler</div>),
}));

// Mock geolocation
const mockGetCurrentPosition = vi.fn();
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: mockGetCurrentPosition,
  },
  writable: true,
});

describe('CheckInOutCard', () => {
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render initial check-in/check-out card', () => {
    render(<CheckInOutCard onStatusChange={mockOnStatusChange} />);

    expect(screen.getByText('บันทึกเวลาทำงาน')).toBeInTheDocument();
    expect(screen.getByText('Check-In')).toBeInTheDocument();
    expect(screen.getByText('Check-Out')).toBeInTheDocument();
    expect(screen.getByTestId('time-entry-status')).toBeInTheDocument();
    expect(screen.getByTestId('location-error-handler')).toBeInTheDocument();
  });

  it('should show branch selector when check-in is clicked', async () => {
    render(<CheckInOutCard onStatusChange={mockOnStatusChange} />);

    const checkInButton = screen.getByText('Check-In');
    fireEvent.click(checkInButton);

    await waitFor(() => {
      expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
    });

    // Check-In and Check-Out buttons should be hidden
    expect(screen.queryByText('Check-In')).not.toBeInTheDocument();
    expect(screen.queryByText('Check-Out')).not.toBeInTheDocument();
  });

  it('should hide branch selector when cancel is clicked', async () => {
    render(<CheckInOutCard onStatusChange={mockOnStatusChange} />);

    // Show branch selector
    const checkInButton = screen.getByText('Check-In');
    fireEvent.click(checkInButton);

    await waitFor(() => {
      expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
    });

    // Cancel branch selection
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId('branch-selector')).not.toBeInTheDocument();
      expect(screen.getByText('Check-In')).toBeInTheDocument();
      expect(screen.getByText('Check-Out')).toBeInTheDocument();
    });
  });

  it('should handle successful check-in', async () => {
    const mockCheckInResponse = {
      success: true,
      message: 'Check-in สำเร็จที่สาขา สาขาทดสอบ',
      timeEntry: {
        id: 'test-entry-id',
        checkInTime: '2025-01-17T10:00:00Z',
        branchId: 'test-branch',
        branchName: 'สาขาทดสอบ',
      },
    };

    vi.mocked(timeEntryService.checkIn).mockResolvedValue(mockCheckInResponse);

    render(<CheckInOutCard onStatusChange={mockOnStatusChange} />);

    // Show branch selector
    const checkInButton = screen.getByText('Check-In');
    fireEvent.click(checkInButton);

    await waitFor(() => {
      expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
    });

    // Perform check-in
    const testCheckInButton = screen.getByText('Test Check-In');
    fireEvent.click(testCheckInButton);

    await waitFor(() => {
      expect(timeEntryService.checkIn).toHaveBeenCalledWith({
        branchId: 'test-branch',
        latitude: 13.7563,
        longitude: 100.5018,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Check-in สำเร็จที่สาขา สาขาทดสอบ')).toBeInTheDocument();
      expect(mockOnStatusChange).toHaveBeenCalled();
    });

    // Branch selector should be hidden after successful check-in
    expect(screen.queryByTestId('branch-selector')).not.toBeInTheDocument();
  });

  it('should handle check-in errors', async () => {
    const errorMessage = 'คุณมีการ check-in ที่ยังไม่ได้ check-out อยู่แล้ว';
    vi.mocked(timeEntryService.checkIn).mockRejectedValue(new Error(errorMessage));

    render(<CheckInOutCard onStatusChange={mockOnStatusChange} />);

    // Show branch selector and perform check-in
    const checkInButton = screen.getByText('Check-In');
    fireEvent.click(checkInButton);

    await waitFor(() => {
      const testCheckInButton = screen.getByText('Test Check-In');
      fireEvent.click(testCheckInButton);
    });

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnStatusChange).not.toHaveBeenCalled();
    });
  });

  it('should handle successful check-out', async () => {
    const mockPosition = {
      coords: {
        latitude: 13.7563,
        longitude: 100.5018,
        accuracy: 10,
      },
    };

    const mockCheckOutResponse = {
      success: true,
      message: 'Check-out สำเร็จที่สาขา สาขาทดสอบ (ทำงาน 8 ชั่วโมง)',
      timeEntry: {
        id: 'test-entry-id',
        checkInTime: '2025-01-17T10:00:00Z',
        checkOutTime: '2025-01-17T18:00:00Z',
        totalHours: 8,
        branchId: 'test-branch',
        branchName: 'สาขาทดสอบ',
      },
    };

    mockGetCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    vi.mocked(timeEntryService.checkOut).mockResolvedValue(mockCheckOutResponse);

    render(<CheckInOutCard onStatusChange={mockOnStatusChange} />);

    const checkOutButton = screen.getByText('Check-Out');
    fireEvent.click(checkOutButton);

    await waitFor(() => {
      expect(timeEntryService.checkOut).toHaveBeenCalledWith({
        latitude: 13.7563,
        longitude: 100.5018,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Check-out สำเร็จที่สาขา สาขาทดสอบ (ทำงาน 8 ชั่วโมง)')).toBeInTheDocument();
      expect(mockOnStatusChange).toHaveBeenCalled();
    });
  });

  it('should handle check-out with GPS errors', async () => {
    const gpsError = new Error('เบราว์เซอร์ไม่รองรับ GPS');
    
    mockGetCurrentPosition.mockImplementation((success, error) => {
      error(gpsError);
    });

    render(<CheckInOutCard onStatusChange={mockOnStatusChange} />);

    const checkOutButton = screen.getByText('Check-Out');
    fireEvent.click(checkOutButton);

    await waitFor(() => {
      expect(screen.getByText('เบราว์เซอร์ไม่รองรับ GPS')).toBeInTheDocument();
      expect(timeEntryService.checkOut).not.toHaveBeenCalled();
      expect(mockOnStatusChange).not.toHaveBeenCalled();
    });
  });

  it('should handle check-out service errors', async () => {
    const mockPosition = {
      coords: {
        latitude: 13.7563,
        longitude: 100.5018,
        accuracy: 10,
      },
    };

    const errorMessage = 'ไม่พบการ check-in ที่ยังไม่ได้ check-out';

    mockGetCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    vi.mocked(timeEntryService.checkOut).mockRejectedValue(new Error(errorMessage));

    render(<CheckInOutCard onStatusChange={mockOnStatusChange} />);

    const checkOutButton = screen.getByText('Check-Out');
    fireEvent.click(checkOutButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnStatusChange).not.toHaveBeenCalled();
    });
  });

  it('should disable buttons during processing', async () => {
    // Mock a slow check-in operation
    vi.mocked(timeEntryService.checkIn).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<CheckInOutCard onStatusChange={mockOnStatusChange} />);

    // Show branch selector
    const checkInButton = screen.getByText('Check-In');
    fireEvent.click(checkInButton);

    await waitFor(() => {
      const testCheckInButton = screen.getByText('Test Check-In');
      fireEvent.click(testCheckInButton);
    });

    // Buttons should show loading state
    await waitFor(() => {
      expect(screen.getByText('กำลังดำเนินการ...')).toBeInTheDocument();
    });
  });

  it('should clear success message after timeout', async () => {
    vi.useFakeTimers();

    const mockCheckInResponse = {
      success: true,
      message: 'Check-in สำเร็จ',
      timeEntry: {
        id: 'test-entry-id',
        checkInTime: '2025-01-17T10:00:00Z',
        branchId: 'test-branch',
        branchName: 'สาขาทดสอบ',
      },
    };

    vi.mocked(timeEntryService.checkIn).mockResolvedValue(mockCheckInResponse);

    render(<CheckInOutCard onStatusChange={mockOnStatusChange} />);

    // Perform successful check-in
    const checkInButton = screen.getByText('Check-In');
    fireEvent.click(checkInButton);

    await waitFor(() => {
      const testCheckInButton = screen.getByText('Test Check-In');
      fireEvent.click(testCheckInButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Check-in สำเร็จ')).toBeInTheDocument();
    });

    // Fast-forward time to trigger success message removal
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('Check-in สำเร็จ')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('should handle geolocation not supported', async () => {
    // Mock geolocation as undefined
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      writable: true,
    });

    render(<CheckInOutCard onStatusChange={mockOnStatusChange} />);

    const checkOutButton = screen.getByText('Check-Out');
    fireEvent.click(checkOutButton);

    await waitFor(() => {
      expect(screen.getByText('เบราว์เซอร์ไม่รองรับ GPS')).toBeInTheDocument();
    });

    // Restore geolocation for other tests
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
      },
      writable: true,
    });
  });
});
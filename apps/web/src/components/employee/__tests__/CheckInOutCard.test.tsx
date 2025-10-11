import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { CheckInOutCard } from '../CheckInOutCard';
import { timeEntryService } from '@/lib/services/time-entry.service';

// Mock the time entry service
vi.mock('@/lib/services/time-entry.service', () => ({
 timeEntryService: {
  getStatus: vi.fn(),
  checkIn: vi.fn(),
  checkOut: vi.fn(),
 },
}));

// Mock child components
vi.mock('../TimeEntryStatus', () => ({
 TimeEntryStatus: () => <div data-testid="time-entry-status">Time Entry Status</div>,
}));

vi.mock('../BranchSelector', () => ({
 BranchSelector: ({ onCheckIn, onCancel, isLoading }: any) => (
  <div data-testid="branch-selector">
   <button 
    data-testid="branch-checkin-btn" 
    onClick={() => onCheckIn({ branchId: 'branch-1', latitude: 13.7563, longitude: 100.5018 })}
    disabled={isLoading}
   >
    Check In Branch
   </button>
   <button data-testid="branch-cancel-btn" onClick={onCancel}>
    Cancel
   </button>
  </div>
 ),
}));

vi.mock('../SelfieCapture', () => ({
 SelfieCapture: ({ onSuccess, onCancel, action }: any) => (
  <div data-testid="selfie-capture">
   <div>Selfie Capture for {action}</div>
   <button data-testid="selfie-success-btn" onClick={() => onSuccess('mock-image-url')}>
    Capture Success
   </button>
   <button data-testid="selfie-cancel-btn" onClick={onCancel}>
    Cancel Selfie
   </button>
  </div>
 ),
}));

vi.mock('../TimeEntryActionButtons', () => ({
 TimeEntryActionButtons: ({ onCheckIn, onCheckOut, isProcessing }: any) => (
  <div data-testid="time-entry-action-buttons">
   <button 
    data-testid="checkin-btn" 
    onClick={onCheckIn}
    disabled={isProcessing}
   >
    Check In
   </button>
   <button 
    data-testid="checkout-btn" 
    onClick={onCheckOut}
    disabled={isProcessing}
   >
    Check Out
   </button>
  </div>
 ),
}));

// Mock UI components
vi.mock('@/components/ui/step-progress', () => ({
 StepProgress: ({ steps, currentStep }: any) => (
  <div data-testid="step-progress">
   {steps.map((step: any, index: number) => (
    <div 
     key={step.id} 
     data-testid={`step-${index}`}
     className={index <= currentStep ? 'active' : 'inactive'}
    >
     {step.title}
    </div>
   ))}
  </div>
 ),
}));

vi.mock('@/components/ui/confirmation-dialog', () => ({
 ConfirmationDialog: ({ open, onConfirm, onCancel, title, description }: any) => 
  open ? (
   <div data-testid="confirmation-dialog">
    <div data-testid="confirmation-title">{title}</div>
    <div data-testid="confirmation-description">{description}</div>
    <button data-testid="confirmation-confirm" onClick={onConfirm}>
     Confirm
    </button>
    <button data-testid="confirmation-cancel" onClick={onCancel}>
     Cancel
    </button>
   </div>
  ) : null,
}));

vi.mock('@/components/ui/success-animation', () => ({
 SuccessAnimation: ({ type, message, onComplete }: any) => (
  <div data-testid="success-animation">
   <div data-testid="success-type">{type}</div>
   <div data-testid="success-message">{message}</div>
   <button data-testid="success-complete" onClick={onComplete}>
    Complete
   </button>
  </div>
 ),
}));

vi.mock('@/components/ui/loading-spinner', () => ({
 LoadingSpinner: ({ message, size, variant, color }: any) => (
  <div data-testid="loading-spinner" data-size={size} data-variant={variant} data-color={color}>
   {message}
  </div>
 ),
 CheckInLoading: () => <div data-testid="checkin-loading">Check In Loading</div>,
 CheckOutLoading: () => <div data-testid="checkout-loading">Check Out Loading</div>,
}));

// Mock geolocation
const mockGeolocation = {
 getCurrentPosition: vi.fn(),
 watchPosition: vi.fn(),
 clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
 value: mockGeolocation,
 writable: true,
});

// Mock network status
Object.defineProperty(global.navigator, 'onLine', {
 value: true,
 writable: true,
});

describe('CheckInOutCard', () => {
 const mockEmployeeId = 'employee-123';
 const mockOnStatusChange = vi.fn();

 beforeEach(() => {
  vi.clearAllMocks();
  mockGeolocation.getCurrentPosition.mockClear();
  
  // Reset network status
  Object.defineProperty(global.navigator, 'onLine', {
   value: true,
   writable: true,
  });
 });

 afterEach(() => {
  vi.restoreAllMocks();
 });

 describe('Initial Render', () => {
  it('renders main card with title and description', () => {
   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   expect(screen.getByText('บันทึกเวลาทำงาน')).toBeInTheDocument();
   expect(screen.getByText('ระบบ check-in และ check-out พร้อมการยืนยันตัวตนด้วยเซลฟี่')).toBeInTheDocument();
  });

  it('renders TimeEntryStatus component', () => {
   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   expect(screen.getByTestId('time-entry-status')).toBeInTheDocument();
  });

  it('renders TimeEntryActionButtons when not in any special state', () => {
   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   expect(screen.getByTestId('time-entry-action-buttons')).toBeInTheDocument();
   expect(screen.getByTestId('checkin-btn')).toBeInTheDocument();
   expect(screen.getByTestId('checkout-btn')).toBeInTheDocument();
  });

  it('shows loading spinner when employeeId is not provided', () => {
   render(<CheckInOutCard />);
   
   expect(screen.getByText('กำลังโหลดข้อมูลผู้ใช้...')).toBeInTheDocument();
  });
 });

 describe('Network Status', () => {
  it('shows offline warning when network is offline', () => {
   Object.defineProperty(global.navigator, 'onLine', {
    value: false,
    writable: true,
   });

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   expect(screen.getByText('ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อของคุณ')).toBeInTheDocument();
  });
 });

 describe('Check In Flow', () => {
  it('shows branch selector when check in button is clicked', async () => {
   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   const checkInBtn = screen.getByTestId('checkin-btn');
   fireEvent.click(checkInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
    expect(screen.getByTestId('step-progress')).toBeInTheDocument();
   });
  });

  it('proceeds to selfie capture after branch selection', async () => {
   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   // Start check in flow
   const checkInBtn = screen.getByTestId('checkin-btn');
   fireEvent.click(checkInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
   });

   // Select branch
   const branchCheckInBtn = screen.getByTestId('branch-checkin-btn');
   fireEvent.click(branchCheckInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
    expect(screen.getByText('Selfie Capture for checkin')).toBeInTheDocument();
   });
  });

  it('completes check in process successfully', async () => {
   const mockCheckInResponse = { message: 'เช็คอินสำเร็จ' };
   vi.mocked(timeEntryService.checkIn).mockResolvedValue(mockCheckInResponse);

   render(<CheckInOutCard employeeId={mockEmployeeId} onStatusChange={mockOnStatusChange} />);
   
   // Start check in flow
   const checkInBtn = screen.getByTestId('checkin-btn');
   fireEvent.click(checkInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
   });

   // Select branch
   const branchCheckInBtn = screen.getByTestId('branch-checkin-btn');
   fireEvent.click(branchCheckInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
   });

   // Complete selfie capture
   const selfieSuccessBtn = screen.getByTestId('selfie-success-btn');
   fireEvent.click(selfieSuccessBtn);

   await waitFor(() => {
    expect(timeEntryService.checkIn).toHaveBeenCalledWith({
     branchId: 'branch-1',
     latitude: 13.7563,
     longitude: 100.5018,
     selfieUrl: 'mock-image-url'
    });
    expect(screen.getByTestId('success-animation')).toBeInTheDocument();
    expect(screen.getByText('เช็คอินสำเร็จ')).toBeInTheDocument();
   });

   expect(mockOnStatusChange).toHaveBeenCalled();
  });

  it('handles check in cancellation', async () => {
   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   // Start check in flow
   const checkInBtn = screen.getByTestId('checkin-btn');
   fireEvent.click(checkInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
   });

   // Cancel branch selection
   const branchCancelBtn = screen.getByTestId('branch-cancel-btn');
   fireEvent.click(branchCancelBtn);

   await waitFor(() => {
    expect(screen.queryByTestId('branch-selector')).not.toBeInTheDocument();
    expect(screen.getByTestId('time-entry-action-buttons')).toBeInTheDocument();
   });
  });
 });

 describe('Check Out Flow', () => {
  beforeEach(() => {
   // Mock successful geolocation
   mockGeolocation.getCurrentPosition.mockImplementation((success) => {
    success({
     coords: {
      latitude: 13.7563,
      longitude: 100.5018,
      accuracy: 10
     }
    });
   });
  });

  it('shows selfie capture directly for check out', async () => {
   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   const checkOutBtn = screen.getByTestId('checkout-btn');
   fireEvent.click(checkOutBtn);

   await waitFor(() => {
    expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
    expect(screen.getByText('Selfie Capture for checkout')).toBeInTheDocument();
   });
  });

  it('completes check out process successfully', async () => {
   const mockCheckOutResponse = { message: 'เช็คเอาท์สำเร็จ' };
   vi.mocked(timeEntryService.checkOut).mockResolvedValue(mockCheckOutResponse);

   render(<CheckInOutCard employeeId={mockEmployeeId} onStatusChange={mockOnStatusChange} />);
   
   const checkOutBtn = screen.getByTestId('checkout-btn');
   fireEvent.click(checkOutBtn);

   await waitFor(() => {
    expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
   });

   // Complete selfie capture
   const selfieSuccessBtn = screen.getByTestId('selfie-success-btn');
   fireEvent.click(selfieSuccessBtn);

   await waitFor(() => {
    expect(timeEntryService.checkOut).toHaveBeenCalledWith({
     latitude: 13.7563,
     longitude: 100.5018,
     selfieUrl: 'mock-image-url'
    });
    expect(screen.getByTestId('success-animation')).toBeInTheDocument();
    expect(screen.getByText('เช็คเอาท์สำเร็จ')).toBeInTheDocument();
   });

   expect(mockOnStatusChange).toHaveBeenCalled();
  });

  it('shows confirmation dialog for short working hours', async () => {
   const mockStatus = {
    isCheckedIn: true,
    activeEntry: {
     checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
    }
   };
   vi.mocked(timeEntryService.getStatus).mockResolvedValue(mockStatus);

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   const checkOutBtn = screen.getByTestId('checkout-btn');
   fireEvent.click(checkOutBtn);

   await waitFor(() => {
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    expect(screen.getByText('เช็คเอาท์ก่อนเวลา?')).toBeInTheDocument();
    expect(screen.getByText('คุณทำงานน้อยกว่า 2 ชั่วโมง คุณแน่ใจหรือไม่ว่าต้องการเช็คเอาท์?')).toBeInTheDocument();
   });
  });

  it('shows confirmation dialog for long working hours', async () => {
   const mockStatus = {
    isCheckedIn: true,
    activeEntry: {
     checkInTime: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString() // 13 hours ago
    }
   };
   vi.mocked(timeEntryService.getStatus).mockResolvedValue(mockStatus);

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   const checkOutBtn = screen.getByTestId('checkout-btn');
   fireEvent.click(checkOutBtn);

   await waitFor(() => {
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    expect(screen.getByText('เช็คเอาท์หลังทำงานนาน?')).toBeInTheDocument();
    expect(screen.getByText('คุณทำงานเกิน 12 ชั่วโมงแล้ว ควรพักผ่อน คุณแน่ใจหรือไม่ว่าพร้อมเช็คเอาท์?')).toBeInTheDocument();
   });
  });

  it('proceeds with check out after confirmation', async () => {
   const mockStatus = {
    isCheckedIn: true,
    activeEntry: {
     checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
   };
   vi.mocked(timeEntryService.getStatus).mockResolvedValue(mockStatus);

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   const checkOutBtn = screen.getByTestId('checkout-btn');
   fireEvent.click(checkOutBtn);

   await waitFor(() => {
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
   });

   // Confirm the action
   const confirmBtn = screen.getByTestId('confirmation-confirm');
   fireEvent.click(confirmBtn);

   await waitFor(() => {
    expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
   });
  });
 });

 describe('Error Handling', () => {
  it('displays geolocation permission error', async () => {
   mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
    error({
     code: 1, // PERMISSION_DENIED
     message: 'Permission denied'
    });
   });

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   const checkOutBtn = screen.getByTestId('checkout-btn');
   fireEvent.click(checkOutBtn);

   await waitFor(() => {
    expect(screen.getByText('กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์')).toBeInTheDocument();
   });
  });

  it('displays geolocation timeout error', async () => {
   mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
    error({
     code: 3, // TIMEOUT
     message: 'Timeout'
    });
   });

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   const checkOutBtn = screen.getByTestId('checkout-btn');
   fireEvent.click(checkOutBtn);

   await waitFor(() => {
    expect(screen.getByText('หมดเวลาการค้นหาตำแหน่ง กรุณาลองใหม่อีกครั้ง')).toBeInTheDocument();
   });
  });

  it('displays service error during check in', async () => {
   const mockError = new Error('Network error');
   vi.mocked(timeEntryService.checkIn).mockRejectedValue(mockError);

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   // Start check in flow
   const checkInBtn = screen.getByTestId('checkin-btn');
   fireEvent.click(checkInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
   });

   // Select branch
   const branchCheckInBtn = screen.getByTestId('branch-checkin-btn');
   fireEvent.click(branchCheckInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
   });

   // Complete selfie capture
   const selfieSuccessBtn = screen.getByTestId('selfie-success-btn');
   fireEvent.click(selfieSuccessBtn);

   await waitFor(() => {
    expect(screen.getByText('เกิดข้อผิดพลาดในการบันทึกเวลา')).toBeInTheDocument();
   });
  });

  it('provides retry options for GPS errors', async () => {
   mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
    error({
     code: 2, // POSITION_UNAVAILABLE
     message: 'Position unavailable'
    });
   });

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   const checkOutBtn = screen.getByTestId('checkout-btn');
   fireEvent.click(checkOutBtn);

   await waitFor(() => {
    expect(screen.getByText('ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS และลองใหม่อีกครั้ง')).toBeInTheDocument();
    expect(screen.getByText('อนุญาตตำแหน่งใหม่')).toBeInTheDocument();
   });
  });

  it('handles retry button click', async () => {
   mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
    error({
     code: 2,
     message: 'Position unavailable'
    });
   });

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   const checkOutBtn = screen.getByTestId('checkout-btn');
   fireEvent.click(checkOutBtn);

   await waitFor(() => {
    expect(screen.getByText('ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS และลองใหม่อีกครั้ง')).toBeInTheDocument();
   });

   // Mock successful geolocation for retry
   mockGeolocation.getCurrentPosition.mockImplementation((success) => {
    success({
     coords: {
      latitude: 13.7563,
      longitude: 100.5018,
      accuracy: 10
     }
    });
   });

   const retryBtn = screen.getByText('อนุญาตตำแหน่งใหม่');
   fireEvent.click(retryBtn);

   await waitFor(() => {
    expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
   });
  });
 });

 describe('Step Progress', () => {
  it('shows correct step progress for check in flow', async () => {
   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   const checkInBtn = screen.getByTestId('checkin-btn');
   fireEvent.click(checkInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('step-progress')).toBeInTheDocument();
    expect(screen.getByText('กระบวนการเช็คอิน - ขั้นตอนที่ 1')).toBeInTheDocument();
   });
  });

  it('shows correct step progress for check out flow', async () => {
   mockGeolocation.getCurrentPosition.mockImplementation((success) => {
    success({
     coords: {
      latitude: 13.7563,
      longitude: 100.5018,
      accuracy: 10
     }
    });
   });

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   const checkOutBtn = screen.getByTestId('checkout-btn');
   fireEvent.click(checkOutBtn);

   await waitFor(() => {
    expect(screen.getByTestId('step-progress')).toBeInTheDocument();
    expect(screen.getByText('กระบวนการเช็คเอาท์')).toBeInTheDocument();
   });
  });
 });

 describe('Success Animation', () => {
  it('shows success animation after check in', async () => {
   const mockCheckInResponse = { message: 'เช็คอินสำเร็จ' };
   vi.mocked(timeEntryService.checkIn).mockResolvedValue(mockCheckInResponse);

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   // Complete check in flow
   const checkInBtn = screen.getByTestId('checkin-btn');
   fireEvent.click(checkInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
   });

   const branchCheckInBtn = screen.getByTestId('branch-checkin-btn');
   fireEvent.click(branchCheckInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
   });

   const selfieSuccessBtn = screen.getByTestId('selfie-success-btn');
   fireEvent.click(selfieSuccessBtn);

   await waitFor(() => {
    expect(screen.getByTestId('success-animation')).toBeInTheDocument();
    expect(screen.getByTestId('success-type')).toHaveTextContent('checkin');
    expect(screen.getByTestId('success-message')).toHaveTextContent('เช็คอินสำเร็จ');
   });
  });

  it('completes success animation when onComplete is called', async () => {
   const mockCheckInResponse = { message: 'เช็คอินสำเร็จ' };
   vi.mocked(timeEntryService.checkIn).mockResolvedValue(mockCheckInResponse);

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   // Complete check in flow
   const checkInBtn = screen.getByTestId('checkin-btn');
   fireEvent.click(checkInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
   });

   const branchCheckInBtn = screen.getByTestId('branch-checkin-btn');
   fireEvent.click(branchCheckInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
   });

   const selfieSuccessBtn = screen.getByTestId('selfie-success-btn');
   fireEvent.click(selfieSuccessBtn);

   await waitFor(() => {
    expect(screen.getByTestId('success-animation')).toBeInTheDocument();
   });

   // Complete the animation
   const completeBtn = screen.getByTestId('success-complete');
   fireEvent.click(completeBtn);

   await waitFor(() => {
    expect(screen.queryByTestId('success-animation')).not.toBeInTheDocument();
   });
  });
 });

 describe('Auto-hide Messages', () => {
  it('auto-hides success message after 5 seconds', async () => {
   vi.useFakeTimers();
   
   const mockCheckInResponse = { message: 'เช็คอินสำเร็จ' };
   vi.mocked(timeEntryService.checkIn).mockResolvedValue(mockCheckInResponse);

   render(<CheckInOutCard employeeId={mockEmployeeId} />);
   
   // Complete check in flow
   const checkInBtn = screen.getByTestId('checkin-btn');
   fireEvent.click(checkInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
   });

   const branchCheckInBtn = screen.getByTestId('branch-checkin-btn');
   fireEvent.click(branchCheckInBtn);

   await waitFor(() => {
    expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
   });

   const selfieSuccessBtn = screen.getByTestId('selfie-success-btn');
   fireEvent.click(selfieSuccessBtn);

   await waitFor(() => {
    expect(screen.getByText('เช็คอินสำเร็จ')).toBeInTheDocument();
   });

   // Fast forward time
   act(() => {
    vi.advanceTimersByTime(5000);
   });

   await waitFor(() => {
    expect(screen.queryByText('เช็คอินสำเร็จ')).not.toBeInTheDocument();
   });

   vi.useRealTimers();
  });
 });
});

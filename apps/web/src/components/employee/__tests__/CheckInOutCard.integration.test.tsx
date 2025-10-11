import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { CheckInOutCard } from '../CheckInOutCard';
import { timeEntryService } from '@/lib/services/time-entry.service';
import { 
 renderCheckInOutCard, 
 createMockGeolocationPosition,
 createMockTimeEntryStatus,
 createMockCheckInResponse,
 createMockCheckOutResponse,
 userInteractions,
 waitForStates,
 assertions,
 GEOLOCATION_ERROR_CODES
} from './test-utils';

// Mock the time entry service
vi.mock('@/lib/services/time-entry.service', () => ({
 timeEntryService: {
  getStatus: vi.fn(),
  checkIn: vi.fn(),
  checkOut: vi.fn(),
 },
}));

// Mock child components with more realistic behavior
vi.mock('../TimeEntryStatus', () => ({
 TimeEntryStatus: () => <div data-testid="time-entry-status">Time Entry Status</div>,
}));

vi.mock('../BranchSelector', () => ({
 BranchSelector: ({ onCheckIn, onCancel, isLoading }: any) => (
  <div data-testid="branch-selector">
   <div data-testid="branch-list">
    <button 
     data-testid="branch-checkin-btn" 
     onClick={() => onCheckIn({ 
      branchId: 'branch-1', 
      latitude: 13.7563, 
      longitude: 100.5018 
     })}
     disabled={isLoading}
    >
     สาขาเซ็นทรัลเวิลด์
    </button>
    <button 
     data-testid="branch-checkin-btn-2" 
     onClick={() => onCheckIn({ 
      branchId: 'branch-2', 
      latitude: 13.7307, 
      longitude: 100.5232 
     })}
     disabled={isLoading}
    >
     สาขาสยามพารากอน
    </button>
   </div>
   <button data-testid="branch-cancel-btn" onClick={onCancel}>
    ยกเลิก
   </button>
  </div>
 ),
}));

vi.mock('../SelfieCapture', () => ({
 SelfieCapture: ({ onSuccess, onCancel, action, employeeId }: any) => (
  <div data-testid="selfie-capture">
   <div data-testid="selfie-info">
    <div>Selfie Capture for {action}</div>
    <div>Employee ID: {employeeId}</div>
   </div>
   <div data-testid="selfie-controls">
    <button 
     data-testid="selfie-success-btn" 
     onClick={() => onSuccess('https://example.com/selfie.jpg')}
    >
     ถ่ายรูปสำเร็จ
    </button>
    <button data-testid="selfie-cancel-btn" onClick={onCancel}>
     ยกเลิกการถ่ายรูป
    </button>
   </div>
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
    className="checkin-button"
   >
    เช็คอิน
   </button>
   <button 
    data-testid="checkout-btn" 
    onClick={onCheckOut}
    disabled={isProcessing}
    className="checkout-button"
   >
    เช็คเอาท์
   </button>
  </div>
 ),
}));

// Mock UI components
vi.mock('@/components/ui/step-progress', () => ({
 StepProgress: ({ steps, currentStep, className }: any) => (
  <div data-testid="step-progress" className={className}>
   <div data-testid="step-indicator">
    {steps.map((step: any, index: number) => (
     <div 
      key={step.id} 
      data-testid={`step-${index}`}
      className={`step ${index <= currentStep ? 'active' : 'inactive'}`}
      data-step-id={step.id}
      data-step-title={step.title}
      data-step-description={step.description}
     >
      <span className="step-number">{index + 1}</span>
      <span className="step-title">{step.title}</span>
      <span className="step-description">{step.description}</span>
     </div>
    ))}
   </div>
  </div>
 ),
}));

vi.mock('@/components/ui/confirmation-dialog', () => ({
 ConfirmationDialog: ({ 
  open, 
  onConfirm, 
  onCancel, 
  title, 
  description, 
  confirmText, 
  cancelText,
  variant,
  additionalInfo 
 }: any) => 
  open ? (
   <div data-testid="confirmation-dialog" className={`confirmation-dialog ${variant}`}>
    <div data-testid="confirmation-title">{title}</div>
    <div data-testid="confirmation-description">{description}</div>
    {additionalInfo && (
     <div data-testid="confirmation-additional-info">{additionalInfo}</div>
    )}
    <div data-testid="confirmation-actions">
     <button 
      data-testid="confirmation-confirm" 
      onClick={onConfirm}
      className="confirm-button"
     >
      {confirmText || 'ยืนยัน'}
     </button>
     <button 
      data-testid="confirmation-cancel" 
      onClick={onCancel}
      className="cancel-button"
     >
      {cancelText || 'ยกเลิก'}
     </button>
    </div>
   </div>
  ) : null,
}));

vi.mock('@/components/ui/success-animation', () => ({
 SuccessAnimation: ({ type, message, onComplete }: any) => (
  <div data-testid="success-animation" className={`success-animation ${type}`}>
   <div data-testid="success-type">{type}</div>
   <div data-testid="success-message">{message}</div>
   <div data-testid="success-icon">✅</div>
   <button 
    data-testid="success-complete" 
    onClick={onComplete}
    className="success-complete-button"
   >
    เสร็จสิ้น
   </button>
  </div>
 ),
}));

vi.mock('@/components/ui/loading-spinner', () => ({
 LoadingSpinner: ({ message, size, variant, color }: any) => (
  <div 
   data-testid="loading-spinner" 
   data-size={size} 
   data-variant={variant} 
   data-color={color}
   className="loading-spinner"
  >
   <div className="spinner-icon">⏳</div>
   <div className="spinner-message">{message}</div>
  </div>
 ),
 CheckInLoading: () => (
  <div data-testid="checkin-loading" className="checkin-loading">
   <div className="loading-icon">📝</div>
   <div className="loading-message">กำลังเช็คอิน...</div>
  </div>
 ),
 CheckOutLoading: () => (
  <div data-testid="checkout-loading" className="checkout-loading">
   <div className="loading-icon">📤</div>
   <div className="loading-message">กำลังเช็คเอาท์...</div>
  </div>
 ),
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

describe('CheckInOutCard Integration Tests', () => {
 const mockEmployeeId = 'employee-123';
 const mockOnStatusChange = vi.fn();

 beforeEach(() => {
  vi.clearAllMocks();
  mockGeolocation.getCurrentPosition.mockClear();
  mockOnStatusChange.mockClear();
  
  // Reset network status
  Object.defineProperty(global.navigator, 'onLine', {
   value: true,
   writable: true,
  });
 });

 describe('Complete Check In Flow', () => {
  it('should complete full check in flow successfully', async () => {
   const mockCheckInResponse = createMockCheckInResponse({
    message: 'เช็คอินสำเร็จ - สาขาเซ็นทรัลเวิลด์',
    entryId: 'entry-123'
   });
   
   vi.mocked(timeEntryService.checkIn).mockResolvedValue(mockCheckInResponse);

   renderCheckInOutCard({ 
    employeeId: mockEmployeeId, 
    onStatusChange: mockOnStatusChange 
   });

   // Step 1: Start check in
   await userInteractions.clickCheckIn(screen);
   await waitForStates.branchSelectorVisible(screen);
   
   expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
   expect(screen.getByText('กระบวนการเช็คอิน - ขั้นตอนที่ 1')).toBeInTheDocument();

   // Step 2: Select branch
   const branchBtn = screen.getByText('สาขาเซ็นทรัลเวิลด์');
   fireEvent.click(branchBtn);
   
   await waitForStates.selfieCaptureVisible(screen);
   
   expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
   expect(screen.getByText('Selfie Capture for checkin')).toBeInTheDocument();
   expect(screen.getByText(`Employee ID: ${mockEmployeeId}`)).toBeInTheDocument();

   // Step 3: Capture selfie
   await userInteractions.captureSelfie(screen);
   
   await waitFor(() => {
    expect(timeEntryService.checkIn).toHaveBeenCalledWith({
     branchId: 'branch-1',
     latitude: 13.7563,
     longitude: 100.5018,
     selfieUrl: 'https://example.com/selfie.jpg'
    });
   });

   // Step 4: Success animation
   await waitForStates.successAnimationVisible(screen);
   
   expect(screen.getByTestId('success-animation')).toBeInTheDocument();
   expect(screen.getByTestId('success-type')).toHaveTextContent('checkin');
   expect(screen.getByTestId('success-message')).toHaveTextContent('เช็คอินสำเร็จ - สาขาเซ็นทรัลเวิลด์');
   
   expect(mockOnStatusChange).toHaveBeenCalled();
  });

  it('should handle check in cancellation at branch selection', async () => {
   renderCheckInOutCard({ employeeId: mockEmployeeId });

   // Start check in
   await userInteractions.clickCheckIn(screen);
   await waitForStates.branchSelectorVisible(screen);

   // Cancel branch selection
   await userInteractions.cancelSelfie(screen);

   await waitFor(() => {
    expect(screen.queryByTestId('branch-selector')).not.toBeInTheDocument();
    expect(screen.getByTestId('time-entry-action-buttons')).toBeInTheDocument();
   });
  });

  it('should handle check in cancellation at selfie capture', async () => {
   renderCheckInOutCard({ employeeId: mockEmployeeId });

   // Start check in flow
   await userInteractions.clickCheckIn(screen);
   await waitForStates.branchSelectorVisible(screen);

   // Select branch
   const branchBtn = screen.getByText('สาขาเซ็นทรัลเวิลด์');
   fireEvent.click(branchBtn);
   
   await waitForStates.selfieCaptureVisible(screen);

   // Cancel selfie capture
   await userInteractions.cancelSelfie(screen);

   await waitFor(() => {
    expect(screen.queryByTestId('selfie-capture')).not.toBeInTheDocument();
    expect(screen.getByTestId('time-entry-action-buttons')).toBeInTheDocument();
   });
  });
 });

 describe('Complete Check Out Flow', () => {
  beforeEach(() => {
   // Mock successful geolocation
   mockGeolocation.getCurrentPosition.mockImplementation((success) => {
    success(createMockGeolocationPosition());
   });
  });

  it('should complete full check out flow successfully', async () => {
   const mockCheckOutResponse = createMockCheckOutResponse({
    message: 'เช็คเอาท์สำเร็จ - ทำงาน 8.5 ชั่วโมง',
    workingHours: 8.5
   });
   
   vi.mocked(timeEntryService.checkOut).mockResolvedValue(mockCheckOutResponse);

   renderCheckInOutCard({ 
    employeeId: mockEmployeeId, 
    onStatusChange: mockOnStatusChange 
   });

   // Step 1: Start check out
   await userInteractions.clickCheckOut(screen);
   
   await waitForStates.selfieCaptureVisible(screen);
   
   expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
   expect(screen.getByText('Selfie Capture for checkout')).toBeInTheDocument();

   // Step 2: Capture selfie
   await userInteractions.captureSelfie(screen);
   
   await waitFor(() => {
    expect(timeEntryService.checkOut).toHaveBeenCalledWith({
     latitude: 13.7563,
     longitude: 100.5018,
     selfieUrl: 'https://example.com/selfie.jpg'
    });
   });

   // Step 3: Success animation
   await waitForStates.successAnimationVisible(screen);
   
   expect(screen.getByTestId('success-animation')).toBeInTheDocument();
   expect(screen.getByTestId('success-type')).toHaveTextContent('checkout');
   expect(screen.getByTestId('success-message')).toHaveTextContent('เช็คเอาท์สำเร็จ - ทำงาน 8.5 ชั่วโมง');
   
   expect(mockOnStatusChange).toHaveBeenCalled();
  });

  it('should show confirmation dialog for short working hours', async () => {
   const mockStatus = createMockTimeEntryStatus({
    isCheckedIn: true,
    activeEntry: {
     checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
    }
   });
   
   vi.mocked(timeEntryService.getStatus).mockResolvedValue(mockStatus);

   renderCheckInOutCard({ employeeId: mockEmployeeId });

   // Start check out
   await userInteractions.clickCheckOut(screen);
   
   await waitForStates.confirmationDialogVisible(screen);
   
   expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
   expect(screen.getByTestId('confirmation-title')).toHaveTextContent('เช็คเอาท์ก่อนเวลา?');
   expect(screen.getByTestId('confirmation-description')).toHaveTextContent('คุณทำงานน้อยกว่า 2 ชั่วโมง คุณแน่ใจหรือไม่ว่าต้องการเช็คเอาท์?');
   expect(screen.getByTestId('confirmation-additional-info')).toHaveTextContent(/คุณทำงานเพียง/);
  });

  it('should show confirmation dialog for long working hours', async () => {
   const mockStatus = createMockTimeEntryStatus({
    isCheckedIn: true,
    activeEntry: {
     checkInTime: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString() // 13 hours ago
    }
   });
   
   vi.mocked(timeEntryService.getStatus).mockResolvedValue(mockStatus);

   renderCheckInOutCard({ employeeId: mockEmployeeId });

   // Start check out
   await userInteractions.clickCheckOut(screen);
   
   await waitForStates.confirmationDialogVisible(screen);
   
   expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
   expect(screen.getByTestId('confirmation-title')).toHaveTextContent('เช็คเอาท์หลังทำงานนาน?');
   expect(screen.getByTestId('confirmation-description')).toHaveTextContent('คุณทำงานเกิน 12 ชั่วโมงแล้ว ควรพักผ่อน คุณแน่ใจหรือไม่ว่าพร้อมเช็คเอาท์?');
   expect(screen.getByTestId('confirmation-additional-info')).toHaveTextContent(/คุณทำงานมาแล้ว/);
  });

  it('should proceed with check out after confirmation', async () => {
   const mockStatus = createMockTimeEntryStatus({
    isCheckedIn: true,
    activeEntry: {
     checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
   });
   
   vi.mocked(timeEntryService.getStatus).mockResolvedValue(mockStatus);

   renderCheckInOutCard({ employeeId: mockEmployeeId });

   // Start check out
   await userInteractions.clickCheckOut(screen);
   
   await waitForStates.confirmationDialogVisible(screen);

   // Confirm the action
   await userInteractions.confirmAction(screen);
   
   await waitForStates.selfieCaptureVisible(screen);
   
   expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
  });

  it('should cancel check out after confirmation dialog', async () => {
   const mockStatus = createMockTimeEntryStatus({
    isCheckedIn: true,
    activeEntry: {
     checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
   });
   
   vi.mocked(timeEntryService.getStatus).mockResolvedValue(mockStatus);

   renderCheckInOutCard({ employeeId: mockEmployeeId });

   // Start check out
   await userInteractions.clickCheckOut(screen);
   
   await waitForStates.confirmationDialogVisible(screen);

   // Cancel the action
   await userInteractions.cancelAction(screen);
   
   await waitFor(() => {
    expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('time-entry-action-buttons')).toBeInTheDocument();
   });
  });
 });

 describe('Error Handling Integration', () => {
  it('should handle geolocation permission denied error', async () => {
   mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
    error({
     code: GEOLOCATION_ERROR_CODES.PERMISSION_DENIED,
     message: 'Permission denied'
    });
   });

   renderCheckInOutCard({ employeeId: mockEmployeeId });

   await userInteractions.clickCheckOut(screen);
   
   await waitForStates.errorMessageVisible(screen);
   
   expect(screen.getByText('กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์')).toBeInTheDocument();
   expect(screen.getByText('อนุญาตตำแหน่งใหม่')).toBeInTheDocument();
  });

  it('should handle geolocation timeout error', async () => {
   mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
    error({
     code: GEOLOCATION_ERROR_CODES.TIMEOUT,
     message: 'Timeout'
    });
   });

   renderCheckInOutCard({ employeeId: mockEmployeeId });

   await userInteractions.clickCheckOut(screen);
   
   await waitForStates.errorMessageVisible(screen);
   
   expect(screen.getByText('หมดเวลาการค้นหาตำแหน่ง กรุณาลองใหม่อีกครั้ง')).toBeInTheDocument();
  });

  it('should handle service error during check in', async () => {
   const mockError = new Error('Network connection failed');
   vi.mocked(timeEntryService.checkIn).mockRejectedValue(mockError);

   renderCheckInOutCard({ employeeId: mockEmployeeId });

   // Complete check in flow until selfie capture
   await userInteractions.clickCheckIn(screen);
   await waitForStates.branchSelectorVisible(screen);
   
   const branchBtn = screen.getByText('สาขาเซ็นทรัลเวิลด์');
   fireEvent.click(branchBtn);
   
   await waitForStates.selfieCaptureVisible(screen);

   // Complete selfie capture
   await userInteractions.captureSelfie(screen);
   
   await waitForStates.errorMessageVisible(screen);
   
   expect(screen.getByText('เกิดข้อผิดพลาดในการบันทึกเวลา')).toBeInTheDocument();
   expect(screen.getByText('ลองใหม่')).toBeInTheDocument();
  });

  it('should retry GPS after error', async () => {
   // First call fails
   mockGeolocation.getCurrentPosition.mockImplementationOnce((_, error) => {
    error({
     code: GEOLOCATION_ERROR_CODES.POSITION_UNAVAILABLE,
     message: 'Position unavailable'
    });
   });

   // Second call succeeds
   mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
    success(createMockGeolocationPosition());
   });

   renderCheckInOutCard({ employeeId: mockEmployeeId });

   await userInteractions.clickCheckOut(screen);
   
   await waitForStates.errorMessageVisible(screen);
   
   expect(screen.getByText('ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS และลองใหม่อีกครั้ง')).toBeInTheDocument();

   // Retry GPS
   await userInteractions.retryGPS(screen);
   
   await waitForStates.selfieCaptureVisible(screen);
   
   expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
  });
 });

 describe('Network Status Integration', () => {
  it('should show offline warning when network is offline', () => {
   Object.defineProperty(global.navigator, 'onLine', {
    value: false,
    writable: true,
   });

   renderCheckInOutCard({ employeeId: mockEmployeeId });
   
   expect(screen.getByText('ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อของคุณ')).toBeInTheDocument();
  });
 });

 describe('Step Progress Integration', () => {
  it('should show correct step progress throughout check in flow', async () => {
   renderCheckInOutCard({ employeeId: mockEmployeeId });

   // Initial state - no steps visible
   expect(screen.queryByTestId('step-progress')).not.toBeInTheDocument();

   // Start check in - step 1
   await userInteractions.clickCheckIn(screen);
   await waitForStates.branchSelectorVisible(screen);
   
   expect(screen.getByTestId('step-progress')).toBeInTheDocument();
   expect(screen.getByTestId('step-0')).toHaveClass('active');
   expect(screen.getByTestId('step-1')).toHaveClass('inactive');
   expect(screen.getByTestId('step-2')).toHaveClass('inactive');

   // Select branch - step 2
   const branchBtn = screen.getByText('สาขาเซ็นทรัลเวิลด์');
   fireEvent.click(branchBtn);
   
   await waitForStates.selfieCaptureVisible(screen);
   
   expect(screen.getByTestId('step-0')).toHaveClass('active');
   expect(screen.getByTestId('step-1')).toHaveClass('active');
   expect(screen.getByTestId('step-2')).toHaveClass('inactive');
  });

  it('should show correct step progress for check out flow', async () => {
   mockGeolocation.getCurrentPosition.mockImplementation((success) => {
    success(createMockGeolocationPosition());
   });

   renderCheckInOutCard({ employeeId: mockEmployeeId });

   // Start check out
   await userInteractions.clickCheckOut(screen);
   
   await waitForStates.selfieCaptureVisible(screen);
   
   expect(screen.getByTestId('step-progress')).toBeInTheDocument();
   expect(screen.getByTestId('step-0')).toHaveClass('active');
   expect(screen.getByTestId('step-1')).toHaveClass('inactive');
  });
 });

 describe('Success Animation Integration', () => {
  it('should complete success animation flow', async () => {
   const mockCheckInResponse = createMockCheckInResponse();
   vi.mocked(timeEntryService.checkIn).mockResolvedValue(mockCheckInResponse);

   renderCheckInOutCard({ employeeId: mockEmployeeId });

   // Complete check in flow
   await userInteractions.clickCheckIn(screen);
   await waitForStates.branchSelectorVisible(screen);
   
   const branchBtn = screen.getByText('สาขาเซ็นทรัลเวิลด์');
   fireEvent.click(branchBtn);
   
   await waitForStates.selfieCaptureVisible(screen);
   await userInteractions.captureSelfie(screen);
   
   await waitForStates.successAnimationVisible(screen);
   
   expect(screen.getByTestId('success-animation')).toBeInTheDocument();
   expect(screen.getByTestId('success-type')).toHaveTextContent('checkin');
   expect(screen.getByTestId('success-icon')).toHaveTextContent('✅');

   // Complete animation
   const completeBtn = screen.getByTestId('success-complete');
   fireEvent.click(completeBtn);

   await waitFor(() => {
    expect(screen.queryByTestId('success-animation')).not.toBeInTheDocument();
   });
  });
 });
});

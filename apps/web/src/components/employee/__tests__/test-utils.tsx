import { render, RenderOptions } from '@testing-library/react';
import React from 'react';
import { CheckInOutCard } from '../CheckInOutCard';

// Custom render function with default props
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
 employeeId?: string;
 onStatusChange?: () => void;
}

export function renderCheckInOutCard({
 employeeId = 'test-employee-123',
 onStatusChange,
 ...renderOptions
}: CustomRenderOptions = {}) {
 return render(
  <CheckInOutCard 
   employeeId={employeeId} 
   onStatusChange={onStatusChange} 
  />,
  renderOptions
 );
}

// Test data factories
export const createMockGeolocationPosition = (overrides = {}) => ({
 coords: {
  latitude: 13.7563,
  longitude: 100.5018,
  accuracy: 10,
  altitude: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
  ...overrides.coords
 },
 timestamp: Date.now(),
 ...overrides
});

export const createMockTimeEntryStatus = (overrides = {}) => ({
 isCheckedIn: false,
 activeEntry: null,
 lastEntry: null,
 ...overrides
});

export const createMockCheckInResponse = (overrides = {}) => ({
 message: 'เช็คอินสำเร็จ',
 entryId: 'entry-123',
 ...overrides
});

export const createMockCheckOutResponse = (overrides = {}) => ({
 message: 'เช็คเอาท์สำเร็จ',
 entryId: 'entry-123',
 workingHours: 8.5,
 ...overrides
});

// Geolocation error codes
export const GEOLOCATION_ERROR_CODES = {
 PERMISSION_DENIED: 1,
 POSITION_UNAVAILABLE: 2,
 TIMEOUT: 3,
} as const;

// Test user interactions
export const userInteractions = {
 clickCheckIn: async (screen: any) => {
  const checkInBtn = screen.getByTestId('checkin-btn');
  return checkInBtn.click();
 },

 clickCheckOut: async (screen: any) => {
  const checkOutBtn = screen.getByTestId('checkout-btn');
  return checkOutBtn.click();
 },

 selectBranch: async (screen: any) => {
  const branchBtn = screen.getByTestId('branch-checkin-btn');
  return branchBtn.click();
 },

 captureSelfie: async (screen: any) => {
  const selfieBtn = screen.getByTestId('selfie-success-btn');
  return selfieBtn.click();
 },

 cancelSelfie: async (screen: any) => {
  const cancelBtn = screen.getByTestId('selfie-cancel-btn');
  return cancelBtn.click();
 },

 confirmAction: async (screen: any) => {
  const confirmBtn = screen.getByTestId('confirmation-confirm');
  return confirmBtn.click();
 },

 cancelAction: async (screen: any) => {
  const cancelBtn = screen.getByTestId('confirmation-cancel');
  return cancelBtn.click();
 },

 retryGPS: async (screen: any) => {
  const retryBtn = screen.getByText('อนุญาตตำแหน่งใหม่');
  return retryBtn.click();
 },

 retryCamera: async (screen: any) => {
  const retryBtn = screen.getByText('อนุญาตกล้องใหม่');
  return retryBtn.click();
 },

 retryGeneral: async (screen: any) => {
  const retryBtn = screen.getByText('ลองใหม่');
  return retryBtn.click();
 },
};

// Wait for specific states
export const waitForStates = {
 branchSelectorVisible: async (screen: any) => {
  return screen.findByTestId('branch-selector');
 },

 selfieCaptureVisible: async (screen: any) => {
  return screen.findByTestId('selfie-capture');
 },

 confirmationDialogVisible: async (screen: any) => {
  return screen.findByTestId('confirmation-dialog');
 },

 successAnimationVisible: async (screen: any) => {
  return screen.findByTestId('success-animation');
 },

 errorMessageVisible: async (screen: any) => {
  return screen.findByText(/เกิดข้อผิดพลาด|ไม่สามารถ|กรุณา/);
 },

 loadingSpinnerVisible: async (screen: any) => {
  return screen.findByTestId('loading-spinner');
 },
};

// Assertion helpers
export const assertions = {
 expectCheckInFlowStarted: (screen: any) => {
  expect(screen.getByTestId('branch-selector')).toBeInTheDocument();
  expect(screen.getByTestId('step-progress')).toBeInTheDocument();
 },

 expectCheckOutFlowStarted: (screen: any) => {
  expect(screen.getByTestId('selfie-capture')).toBeInTheDocument();
  expect(screen.getByText('Selfie Capture for checkout')).toBeInTheDocument();
 },

 expectSuccessMessage: (screen: any, message: string) => {
  expect(screen.getByText(message)).toBeInTheDocument();
 },

 expectErrorMessage: (screen: any, messagePattern: RegExp) => {
  expect(screen.getByText(messagePattern)).toBeInTheDocument();
 },

 expectRetryOptions: (screen: any) => {
  expect(screen.getByText('ลองใหม่')).toBeInTheDocument();
 },

 expectGPSRetryOption: (screen: any) => {
  expect(screen.getByText('อนุญาตตำแหน่งใหม่')).toBeInTheDocument();
 },

 expectCameraRetryOption: (screen: any) => {
  expect(screen.getByText('อนุญาตกล้องใหม่')).toBeInTheDocument();
 },
};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimeEntryDetailModal } from '@/components/employee/TimeEntryDetailModal';
import { timeEntryService } from '@/lib/services/time-entry.service';

// Mock the time entry service
vi.mock('@/lib/services/time-entry.service', () => ({
 timeEntryService: {
  getTimeEntryDetail: vi.fn(),
 },
}));

// Mock child components to simplify testing
vi.mock('@/components/employee/TimeEntryBasicInfo', () => ({
 TimeEntryBasicInfo: ({ timeEntry }: any) => 
  React.createElement('div', { 'data-testid': 'basic-info' }, `Basic Info: ${timeEntry.id}`)
}));

vi.mock('@/components/employee/SelfieGallery', () => ({
 SelfieGallery: ({ checkInSelfieUrl }: any) => 
  React.createElement('div', { 'data-testid': 'selfie-gallery' }, `Selfie: ${checkInSelfieUrl}`)
}));

vi.mock('@/components/employee/GPSLocationDisplay', () => ({
 GPSLocationDisplay: ({ branchName }: any) => 
  React.createElement('div', { 'data-testid': 'gps-display' }, `GPS: ${branchName}`)
}));

vi.mock('@/components/employee/MaterialUsageList', () => ({
 MaterialUsageList: ({ materialUsage }: any) => 
  React.createElement('div', { 'data-testid': 'material-list' }, `Materials: ${materialUsage.length}`)
}));

const mockTimeEntryDetail = {
 id: 'entry-123',
 employee_id: 'user-123',
 branch: {
  id: 'branch-456',
  name: 'สาขาเซ็นทรัล',
  latitude: 13.7563,
  longitude: 100.5018,
 },
 check_in_time: '2025-01-20T08:00:00Z',
 check_out_time: '2025-01-20T17:00:00Z',
 check_in_selfie_url: 'https://example.com/selfie1.jpg',
 check_out_selfie_url: 'https://example.com/selfie2.jpg',
 check_in_location: {
  latitude: 13.7563,
  longitude: 100.5018,
  distance_from_branch: 25,
 },
 material_usage: [
  {
   raw_material: { name: 'แป้ง', unit: 'กิโลกรัม' },
   quantity_used: 2.5,
  },
 ],
 total_hours: 9,
};

describe('TimeEntryDetailModal', () => {
 const mockOnClose = vi.fn();

 beforeEach(() => {
  vi.clearAllMocks();
 });

 it('should not render when closed', () => {
  render(
   <TimeEntryDetailModal
    isOpen={false}
    onClose={mockOnClose}
    timeEntryId="entry-123"
   />
  );

  expect(screen.queryByText('รายละเอียดการลงเวลาทำงาน')).not.toBeInTheDocument();
 });

 it('should show loading state when modal opens', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockImplementation(
   () => new Promise(() => {}) // Never resolves to keep loading
  );

  render(
   <TimeEntryDetailModal
    isOpen={true}
    onClose={mockOnClose}
    timeEntryId="entry-123"
   />
  );

  expect(screen.getByText('รายละเอียดการลงเวลาทำงาน')).toBeInTheDocument();
  expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument();
 });

 it('should load and display time entry details', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockResolvedValue({
   success: true,
   data: mockTimeEntryDetail,
  });

  render(
   <TimeEntryDetailModal
    isOpen={true}
    onClose={mockOnClose}
    timeEntryId="entry-123"
   />
  );

  await waitFor(() => {
   expect(screen.getByTestId('basic-info')).toBeInTheDocument();
  });

  expect(screen.getByText('Basic Info: entry-123')).toBeInTheDocument();
  expect(screen.getByText('Selfie: https://example.com/selfie1.jpg')).toBeInTheDocument();
  expect(screen.getByText('GPS: สาขาเซ็นทรัล')).toBeInTheDocument();
  expect(screen.getByText('Materials: 1')).toBeInTheDocument();
 });

 it('should show error state when API fails', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockResolvedValue({
   success: false,
   error: 'Time entry not found',
  });

  render(
   <TimeEntryDetailModal
    isOpen={true}
    onClose={mockOnClose}
    timeEntryId="invalid-id"
   />
  );

  await waitFor(() => {
   expect(screen.getByText('Time entry not found')).toBeInTheDocument();
  });

  expect(screen.getByText('ลองใหม่')).toBeInTheDocument();
 });

 it('should handle retry when error occurs', async () => {
  let callCount = 0;
  (timeEntryService.getTimeEntryDetail as any).mockImplementation(() => {
   callCount++;
   if (callCount === 1) {
    return Promise.resolve({
     success: false,
     error: 'Network error',
    });
   }
   return Promise.resolve({
    success: true,
    data: mockTimeEntryDetail,
   });
  });

  render(
   <TimeEntryDetailModal
    isOpen={true}
    onClose={mockOnClose}
    timeEntryId="entry-123"
   />
  );

  await waitFor(() => {
   expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  // Click retry button
  fireEvent.click(screen.getByText('ลองใหม่'));

  await waitFor(() => {
   expect(screen.getByTestId('basic-info')).toBeInTheDocument();
  });

  expect(timeEntryService.getTimeEntryDetail).toHaveBeenCalledTimes(2);
 });

 it('should call onClose when close button is clicked', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockResolvedValue({
   success: true,
   data: mockTimeEntryDetail,
  });

  render(
   <TimeEntryDetailModal
    isOpen={true}
    onClose={mockOnClose}
    timeEntryId="entry-123"
   />
  );

  // Find and click close button (X icon)
  const closeButton = screen.getByRole('button', { name: /ปิด/i });
  fireEvent.click(closeButton);

  expect(mockOnClose).toHaveBeenCalledTimes(1);
 });

 it('should reset state when modal closes and reopens', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockResolvedValue({
   success: true,
   data: mockTimeEntryDetail,
  });

  const { rerender } = render(
   <TimeEntryDetailModal
    isOpen={true}
    onClose={mockOnClose}
    timeEntryId="entry-123"
   />
  );

  await waitFor(() => {
   expect(screen.getByTestId('basic-info')).toBeInTheDocument();
  });

  // Close modal
  rerender(
   <TimeEntryDetailModal
    isOpen={false}
    onClose={mockOnClose}
    timeEntryId="entry-123"
   />
  );

  // Reopen modal
  rerender(
   <TimeEntryDetailModal
    isOpen={true}
    onClose={mockOnClose}
    timeEntryId="entry-456"
   />
  );

  // Should show loading again and fetch new data
  expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument();
  expect(timeEntryService.getTimeEntryDetail).toHaveBeenCalledWith('entry-456');
 });

 it('should handle exception errors gracefully', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockRejectedValue(
   new Error('Network connection failed')
  );

  render(
   <TimeEntryDetailModal
    isOpen={true}
    onClose={mockOnClose}
    timeEntryId="entry-123"
   />
  );

  await waitFor(() => {
   expect(screen.getByText('เกิดข้อผิดพลาดในการดึงรายละเอียดการทำงาน')).toBeInTheDocument();
  });
 });

 it('should not show GPS display when check_in_location is not available', async () => {
  const timeEntryWithoutGPS = {
   ...mockTimeEntryDetail,
   check_in_location: undefined,
  };

  (timeEntryService.getTimeEntryDetail as any).mockResolvedValue({
   success: true,
   data: timeEntryWithoutGPS,
  });

  render(
   <TimeEntryDetailModal
    isOpen={true}
    onClose={mockOnClose}
    timeEntryId="entry-123"
   />
  );

  await waitFor(() => {
   expect(screen.getByTestId('basic-info')).toBeInTheDocument();
  });

  expect(screen.queryByTestId('gps-display')).not.toBeInTheDocument();
 });

 it('should fetch data when timeEntryId changes', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockResolvedValue({
   success: true,
   data: mockTimeEntryDetail,
  });

  const { rerender } = render(
   <TimeEntryDetailModal
    isOpen={true}
    onClose={mockOnClose}
    timeEntryId="entry-123"
   />
  );

  await waitFor(() => {
   expect(timeEntryService.getTimeEntryDetail).toHaveBeenCalledWith('entry-123');
  });

  // Change timeEntryId
  rerender(
   <TimeEntryDetailModal
    isOpen={true}
    onClose={mockOnClose}
    timeEntryId="entry-456"
   />
  );

  await waitFor(() => {
   expect(timeEntryService.getTimeEntryDetail).toHaveBeenCalledWith('entry-456');
  });

  expect(timeEntryService.getTimeEntryDetail).toHaveBeenCalledTimes(2);
 });
});
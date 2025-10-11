import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimeEntryCard } from '@/components/employee/TimeEntryCard';
import { TimeEntryDetailModal } from '@/components/employee/TimeEntryDetailModal';
import { timeEntryService } from '@/lib/services/time-entry.service';

// Mock the time entry service
vi.mock('@/lib/services/time-entry.service', () => ({
 timeEntryService: {
  getWorkStatus: vi.fn(),
  formatTimeForDisplay: vi.fn(),
  formatDateForDisplay: vi.fn(),
  formatWorkingHours: vi.fn(),
  getTimeEntryDetail: vi.fn(),
 },
}));

// Mock child components
vi.mock('@/components/employee/TimeEntryBasicInfo', () => ({
 TimeEntryBasicInfo: ({ timeEntry }: any) => (
  <div data-testid="basic-info">{timeEntry.id}</div>
 ),
}));

vi.mock('@/components/employee/SelfieGallery', () => ({
 SelfieGallery: () => <div data-testid="selfie-gallery">Selfie Gallery</div>,
}));

vi.mock('@/components/employee/GPSLocationDisplay', () => ({
 GPSLocationDisplay: () => <div data-testid="gps-display">GPS Display</div>,
}));

vi.mock('@/components/employee/MaterialUsageList', () => ({
 MaterialUsageList: () => <div data-testid="material-list">Material List</div>,
}));

const mockTimeEntry = {
 id: 'entry-123',
 userId: 'user-123',
 branchId: 'branch-456',
 checkInTime: '2025-01-20T08:00:00Z',
 checkOutTime: '2025-01-20T17:00:00Z',
 totalHours: 9,
 branch: {
  id: 'branch-456',
  name: 'สาขาเซ็นทรัล',
  latitude: 13.7563,
  longitude: 100.5018,
 },
};

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
 material_usage: [],
 total_hours: 9,
};

function TestWorkflowComponent() {
 const [selectedTimeEntryId, setSelectedTimeEntryId] = React.useState<string | null>(null);
 const [isModalOpen, setIsModalOpen] = React.useState(false);

 const handleViewDetails = (timeEntryId: string) => {
  setSelectedTimeEntryId(timeEntryId);
  setIsModalOpen(true);
 };

 const handleCloseModal = () => {
  setIsModalOpen(false);
  setSelectedTimeEntryId(null);
 };

 return (
  <div>
   <TimeEntryCard timeEntry={mockTimeEntry} onViewDetails={handleViewDetails} />
   {selectedTimeEntryId && (
    <TimeEntryDetailModal
     isOpen={isModalOpen}
     onClose={handleCloseModal}
     timeEntryId={selectedTimeEntryId}
    />
   )}
  </div>
 );
}

describe('Time Entry Detail Modal Integration', () => {
 beforeEach(() => {
  vi.clearAllMocks();
  
  // Setup service mocks
  (timeEntryService.getWorkStatus as any).mockReturnValue('เสร็จสิ้น');
  (timeEntryService.formatTimeForDisplay as any).mockImplementation(
   (time: string) => new Date(time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  );
  (timeEntryService.formatDateForDisplay as any).mockReturnValue('20 มกราคม 2568');
  (timeEntryService.formatWorkingHours as any).mockReturnValue('9 ชั่วโมง');
 });

 it('should open modal when view details button is clicked', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockResolvedValue({
   success: true,
   data: mockTimeEntryDetail,
  });

  render(<TestWorkflowComponent />);

  // Verify card is rendered
  expect(screen.getByText('สาขาเซ็นทรัล')).toBeInTheDocument();
  expect(screen.getByText('ดูรายละเอียด')).toBeInTheDocument();

  // Click view details button
  fireEvent.click(screen.getByText('ดูรายละเอียด'));

  // Verify modal opens
  await waitFor(() => {
   expect(screen.getByText('รายละเอียดการลงเวลาทำงาน')).toBeInTheDocument();
  });

  // Verify modal content is loaded
  await waitFor(() => {
   expect(screen.getByTestId('basic-info')).toBeInTheDocument();
  });

  expect(timeEntryService.getTimeEntryDetail).toHaveBeenCalledWith('entry-123');
 });

 it('should close modal when close button is clicked', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockResolvedValue({
   success: true,
   data: mockTimeEntryDetail,
  });

  render(<TestWorkflowComponent />);

  // Open modal
  fireEvent.click(screen.getByText('ดูรายละเอียด'));

  await waitFor(() => {
   expect(screen.getByText('รายละเอียดการลงเวลาทำงาน')).toBeInTheDocument();
  });

  // Close modal
  const closeButton = screen.getByRole('button', { name: /ปิด/i });
  fireEvent.click(closeButton);

  // Verify modal is closed
  await waitFor(() => {
   expect(screen.queryByText('รายละเอียดการลงเวลาทำงาน')).not.toBeInTheDocument();
  });
 });

 it('should close modal when ESC key is pressed', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockResolvedValue({
   success: true,
   data: mockTimeEntryDetail,
  });

  render(<TestWorkflowComponent />);

  // Open modal
  fireEvent.click(screen.getByText('ดูรายละเอียด'));

  await waitFor(() => {
   expect(screen.getByText('รายละเอียดการลงเวลาทำงาน')).toBeInTheDocument();
  });

  // Press ESC key
  fireEvent.keyDown(document, { key: 'Escape' });

  // Verify modal is closed
  await waitFor(() => {
   expect(screen.queryByText('รายละเอียดการลงเวลาทำงาน')).not.toBeInTheDocument();
  });
 });

 it('should show loading state immediately when modal opens', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockImplementation(
   () => new Promise(resolve => setTimeout(() => resolve({
    success: true,
    data: mockTimeEntryDetail,
   }), 100))
  );

  render(<TestWorkflowComponent />);

  // Click view details button
  fireEvent.click(screen.getByText('ดูรายละเอียด'));

  // Verify modal opens with loading state
  expect(screen.getByText('รายละเอียดการลงเวลาทำงาน')).toBeInTheDocument();
  expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument();

  // Wait for content to load
  await waitFor(() => {
   expect(screen.getByTestId('basic-info')).toBeInTheDocument();
  });

  expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
 });

 it('should handle error and show retry functionality', async () => {
  let callCount = 0;
  (timeEntryService.getTimeEntryDetail as any).mockImplementation(() => {
   callCount++;
   if (callCount === 1) {
    return Promise.resolve({
     success: false,
     error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
    });
   }
   return Promise.resolve({
    success: true,
    data: mockTimeEntryDetail,
   });
  });

  render(<TestWorkflowComponent />);

  // Open modal
  fireEvent.click(screen.getByText('ดูรายละเอียด'));

  // Wait for error to appear
  await waitFor(() => {
   expect(screen.getByText('เกิดข้อผิดพลาดในการโหลดข้อมูล')).toBeInTheDocument();
  });

  expect(screen.getByText('ลองใหม่')).toBeInTheDocument();

  // Click retry
  fireEvent.click(screen.getByText('ลองใหม่'));

  // Wait for successful load
  await waitFor(() => {
   expect(screen.getByTestId('basic-info')).toBeInTheDocument();
  });

  expect(timeEntryService.getTimeEntryDetail).toHaveBeenCalledTimes(2);
 });

 it('should reset modal state when reopening with different entry', async () => {
  (timeEntryService.getTimeEntryDetail as any).mockResolvedValue({
   success: true,
   data: mockTimeEntryDetail,
  });

  const { rerender } = render(<TestWorkflowComponent />);

  // Open modal first time
  fireEvent.click(screen.getByText('ดูรายละเอียด'));

  await waitFor(() => {
   expect(screen.getByTestId('basic-info')).toBeInTheDocument();
  });

  // Close modal
  const closeButton = screen.getByRole('button', { name: /ปิด/i });
  fireEvent.click(closeButton);

  await waitFor(() => {
   expect(screen.queryByText('รายละเอียดการลงเวลาทำงาน')).not.toBeInTheDocument();
  });

  // Clear mock calls
  vi.clearAllMocks();
  (timeEntryService.getTimeEntryDetail as any).mockResolvedValue({
   success: true,
   data: { ...mockTimeEntryDetail, id: 'entry-456' },
  });

  // Render with different entry
  const differentEntry = { ...mockTimeEntry, id: 'entry-456' };
  function TestComponentWithDifferentEntry() {
   const [selectedTimeEntryId, setSelectedTimeEntryId] = React.useState<string | null>(null);
   const [isModalOpen, setIsModalOpen] = React.useState(false);

   const handleViewDetails = (timeEntryId: string) => {
    setSelectedTimeEntryId(timeEntryId);
    setIsModalOpen(true);
   };

   const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTimeEntryId(null);
   };

   return (
    <div>
     <TimeEntryCard timeEntry={differentEntry} onViewDetails={handleViewDetails} />
     {selectedTimeEntryId && (
      <TimeEntryDetailModal
       isOpen={isModalOpen}
       onClose={handleCloseModal}
       timeEntryId={selectedTimeEntryId}
      />
     )}
    </div>
   );
  }

  rerender(<TestComponentWithDifferentEntry />);

  // Open modal with different entry
  fireEvent.click(screen.getByText('ดูรายละเอียด'));

  // Verify new data is fetched
  await waitFor(() => {
   expect(timeEntryService.getTimeEntryDetail).toHaveBeenCalledWith('entry-456');
  });
 });

 it('should not show view details button when onViewDetails is not provided', () => {
  render(<TimeEntryCard timeEntry={mockTimeEntry} />);

  expect(screen.getByText('สาขาเซ็นทรัล')).toBeInTheDocument();
  expect(screen.queryByText('ดูรายละเอียด')).not.toBeInTheDocument();
 });
});
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TimeEntryDetailModal } from '@/components/employee/TimeEntryDetailModal';
import { timeEntryService } from '@/lib/services/time-entry.service';
import type { TimeEntryDetail } from 'packages/database';
import { vi } from 'vitest';

// Mock the time entry service
vi.mock('@/lib/services/time-entry.service', () => ({
  timeEntryService: {
    getTimeEntryDetail: vi.fn(),
    calculateDistanceFromBranch: vi.fn(),
  },
}));

// Mock supabase to prevent import errors
vi.mock('@/lib/supabase', () => ({
  createSupabaseClientSide: vi.fn(() => ({
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  })),
}));

const mockTimeEntryService = vi.mocked(timeEntryService);

describe('GPS Data Flow Integration Tests', () => {
  const mockTimeEntryDetail: TimeEntryDetail = {
    id: 'test-entry-id',
    employee_id: 'test-user-id',
    branch: {
      id: 'branch-1',
      name: 'สาขาเซ็นทรัล',
      latitude: 13.7555,
      longitude: 100.5015,
    },
    check_in_time: '2024-01-20T08:00:00Z',
    check_out_time: '2024-01-20T17:00:00Z',
    check_in_selfie_url: 'https://example.com/selfie1.jpg',
    check_out_selfie_url: 'https://example.com/selfie2.jpg',
    check_in_location: {
      latitude: 13.7563,
      longitude: 100.5018,
      distance_from_branch: 95.5,
    },
    material_usage: [],
    total_hours: 9,
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    timeEntryId: 'test-entry-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete GPS Data Flow', () => {
    it('should fetch time entry detail and display GPS information correctly', async () => {
      mockTimeEntryService.getTimeEntryDetail.mockResolvedValue({
        success: true,
        data: mockTimeEntryDetail,
      });

      render(<TimeEntryDetailModal {...defaultProps} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
      });

      // Verify API was called
      expect(mockTimeEntryService.getTimeEntryDetail).toHaveBeenCalledWith('test-entry-id');

      // Verify GPS information is displayed
      expect(screen.getByText('ตำแหน่ง GPS ณ เวลาเช็คอิน')).toBeInTheDocument();
      expect(screen.getByText('96 เมตร')).toBeInTheDocument();
      expect(screen.getByText('อยู่ในรัศมี')).toBeInTheDocument();
      expect(screen.getByText('13.756300° N')).toBeInTheDocument();
      expect(screen.getByText('100.501800° E')).toBeInTheDocument();
    });

    it('should display fallback message when GPS data is not available', async () => {
      const timeEntryWithoutGPS: TimeEntryDetail = {
        ...mockTimeEntryDetail,
        check_in_location: undefined,
      };

      mockTimeEntryService.getTimeEntryDetail.mockResolvedValue({
        success: true,
        data: timeEntryWithoutGPS,
      });

      render(<TimeEntryDetailModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
      });

      // Verify fallback message is displayed
      expect(screen.getByText('ไม่มีข้อมูล GPS')).toBeInTheDocument();
      expect(screen.getByText('ไม่มีข้อมูลตำแหน่ง GPS สำหรับการเช็คอินครั้งนี้')).toBeInTheDocument();
      
      // Verify GPS component is not displayed
      expect(screen.queryByText('ตำแหน่ง GPS ณ เวลาเช็คอิน')).not.toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      mockTimeEntryService.getTimeEntryDetail.mockResolvedValue({
        success: false,
        error: 'ไม่สามารถดึงรายละเอียดการทำงานได้',
      });

      render(<TimeEntryDetailModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
      });

      // Verify error message is displayed
      expect(screen.getByText('ไม่สามารถดึงรายละเอียดการทำงานได้')).toBeInTheDocument();
      
      // Verify GPS component is not displayed
      expect(screen.queryByText('ตำแหน่ง GPS ณ เวลาเช็คอิน')).not.toBeInTheDocument();
      expect(screen.queryByText('ไม่มีข้อมูล GPS')).not.toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      mockTimeEntryService.getTimeEntryDetail.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockTimeEntryDetail }), 100))
      );

      render(<TimeEntryDetailModal {...defaultProps} />);

      // Verify loading state is displayed
      expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument();
      expect(screen.queryByText('ตำแหน่ง GPS ณ เวลาเช็คอิน')).not.toBeInTheDocument();
    });
  });

  describe('GPS Distance Calculation Scenarios', () => {
    it('should handle close distance (within range)', async () => {
      const closeDistanceEntry: TimeEntryDetail = {
        ...mockTimeEntryDetail,
        check_in_location: {
          latitude: 13.7556,
          longitude: 100.5016,
          distance_from_branch: 25.8,
        },
      };

      mockTimeEntryService.getTimeEntryDetail.mockResolvedValue({
        success: true,
        data: closeDistanceEntry,
      });

      render(<TimeEntryDetailModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('26 เมตร')).toBeInTheDocument();
      expect(screen.getByText('อยู่ในรัศมี')).toBeInTheDocument();
      expect(screen.queryByText('หมายเหตุ:')).not.toBeInTheDocument();
    });

    it('should handle medium distance (out of range)', async () => {
      const mediumDistanceEntry: TimeEntryDetail = {
        ...mockTimeEntryDetail,
        check_in_location: {
          latitude: 13.7580,
          longitude: 100.5050,
          distance_from_branch: 350.7,
        },
      };

      mockTimeEntryService.getTimeEntryDetail.mockResolvedValue({
        success: true,
        data: mediumDistanceEntry,
      });

      render(<TimeEntryDetailModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('351 เมตร')).toBeInTheDocument();
      expect(screen.getByText('นอกรัศมี')).toBeInTheDocument();
      expect(screen.getByText('หมายเหตุ:')).toBeInTheDocument();
      expect(screen.getByText(/การเช็คอินนอกรัศมีอาจเกิดจากความผิดพลาดของ GPS/)).toBeInTheDocument();
    });

    it('should handle long distance (kilometers)', async () => {
      const longDistanceEntry: TimeEntryDetail = {
        ...mockTimeEntryDetail,
        check_in_location: {
          latitude: 13.8000,
          longitude: 100.6000,
          distance_from_branch: 15750.5,
        },
      };

      mockTimeEntryService.getTimeEntryDetail.mockResolvedValue({
        success: true,
        data: longDistanceEntry,
      });

      render(<TimeEntryDetailModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('15.75 กิโลเมตร')).toBeInTheDocument();
      expect(screen.getByText('นอกรัศมี')).toBeInTheDocument();
    });

    it('should handle edge case distance (exactly 100 meters)', async () => {
      const edgeCaseEntry: TimeEntryDetail = {
        ...mockTimeEntryDetail,
        check_in_location: {
          latitude: 13.7565,
          longitude: 100.5020,
          distance_from_branch: 100.0,
        },
      };

      mockTimeEntryService.getTimeEntryDetail.mockResolvedValue({
        success: true,
        data: edgeCaseEntry,
      });

      render(<TimeEntryDetailModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('100 เมตร')).toBeInTheDocument();
      expect(screen.getByText('อยู่ในรัศมี')).toBeInTheDocument();
      expect(screen.queryByText('หมายเหตุ:')).not.toBeInTheDocument();
    });
  });

  describe('GPS Coordinate Display Scenarios', () => {
    it('should display positive coordinates correctly', async () => {
      const positiveCoordEntry: TimeEntryDetail = {
        ...mockTimeEntryDetail,
        check_in_location: {
          latitude: 45.123456,
          longitude: 122.654321,
          distance_from_branch: 50,
        },
        branch: {
          ...mockTimeEntryDetail.branch,
          latitude: 45.120000,
          longitude: 122.650000,
        },
      };

      mockTimeEntryService.getTimeEntryDetail.mockResolvedValue({
        success: true,
        data: positiveCoordEntry,
      });

      render(<TimeEntryDetailModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('45.123456° N')).toBeInTheDocument();
      expect(screen.getByText('122.654321° E')).toBeInTheDocument();
      expect(screen.getByText('45.120000° N')).toBeInTheDocument();
      expect(screen.getByText('122.650000° E')).toBeInTheDocument();
    });

    it('should display negative coordinates correctly', async () => {
      const negativeCoordEntry: TimeEntryDetail = {
        ...mockTimeEntryDetail,
        check_in_location: {
          latitude: -34.603722,
          longitude: -58.381592,
          distance_from_branch: 50,
        },
        branch: {
          ...mockTimeEntryDetail.branch,
          latitude: -34.600000,
          longitude: -58.380000,
        },
      };

      mockTimeEntryService.getTimeEntryDetail.mockResolvedValue({
        success: true,
        data: negativeCoordEntry,
      });

      render(<TimeEntryDetailModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('34.603722° S')).toBeInTheDocument();
      expect(screen.getByText('58.381592° W')).toBeInTheDocument();
      expect(screen.getByText('34.600000° S')).toBeInTheDocument();
      expect(screen.getByText('58.380000° W')).toBeInTheDocument();
    });

    it('should handle zero coordinates', async () => {
      const zeroCoordEntry: TimeEntryDetail = {
        ...mockTimeEntryDetail,
        check_in_location: {
          latitude: 0,
          longitude: 0,
          distance_from_branch: 50,
        },
        branch: {
          ...mockTimeEntryDetail.branch,
          latitude: 0.001,
          longitude: -0.001,
        },
      };

      mockTimeEntryService.getTimeEntryDetail.mockResolvedValue({
        success: true,
        data: zeroCoordEntry,
      });

      render(<TimeEntryDetailModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('0.000000° N')).toBeInTheDocument();
      expect(screen.getByText('0.000000° E')).toBeInTheDocument();
      expect(screen.getByText('0.001000° N')).toBeInTheDocument();
      expect(screen.getByText('0.001000° W')).toBeInTheDocument();
    });
  });

  describe('Google Maps Integration', () => {
    it('should generate correct Google Maps URLs', async () => {
      mockTimeEntryService.getTimeEntryDetail.mockResolvedValue({
        success: true,
        data: mockTimeEntryDetail,
      });

      render(<TimeEntryDetailModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
      });

      const checkInMapLink = screen.getByText('ดูตำแหน่งเช็คอินใน Google Maps');
      const branchMapLink = screen.getByText('ดูตำแหน่งสาขาใน Google Maps');

      expect(checkInMapLink.closest('a')).toHaveAttribute(
        'href',
        'https://www.google.com/maps?q=13.7563,100.5018'
      );
      expect(branchMapLink.closest('a')).toHaveAttribute(
        'href',
        'https://www.google.com/maps?q=13.7555,100.5015'
      );

      // Verify external link attributes
      expect(checkInMapLink.closest('a')).toHaveAttribute('target', '_blank');
      expect(checkInMapLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
      expect(branchMapLink.closest('a')).toHaveAttribute('target', '_blank');
      expect(branchMapLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
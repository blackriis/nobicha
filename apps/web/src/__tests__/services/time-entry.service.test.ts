import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timeEntryService } from '@/lib/services/time-entry.service';
import { locationService } from '@/lib/services/location.service';

// Mock locationService
vi.mock('@/lib/services/location.service', () => ({
  locationService: {
    getCurrentPosition: vi.fn(),
    getNearbyBranches: vi.fn(),
    calculateDistance: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TimeEntryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('checkIn', () => {
    it('should successfully check in with valid data', async () => {
      const mockResponse = {
        success: true,
        timeEntry: {
          id: 'test-id',
          checkInTime: '2025-01-17T10:00:00Z',
          branchId: 'branch-1',
          branchName: 'สาขาทดสอบ'
        },
        message: 'Check-in สำเร็จที่สาขา สาขาทดสอบ'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const request = {
        branchId: 'branch-1',
        latitude: 13.7563,
        longitude: 100.5018
      };

      const result = await timeEntryService.checkIn(request);

      expect(mockFetch).toHaveBeenCalledWith('/api/employee/time-entries/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when check-in fails', async () => {
      const mockError = {
        error: 'คุณมีการ check-in ที่ยังไม่ได้ check-out อยู่แล้ว'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValueOnce(mockError),
      });

      const request = {
        branchId: 'branch-1',
        latitude: 13.7563,
        longitude: 100.5018
      };

      await expect(timeEntryService.checkIn(request)).rejects.toThrow(
        'คุณมีการ check-in ที่ยังไม่ได้ check-out อยู่แล้ว'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request = {
        branchId: 'branch-1',
        latitude: 13.7563,
        longitude: 100.5018
      };

      await expect(timeEntryService.checkIn(request)).rejects.toThrow('Network error');
    });
  });

  describe('checkOut', () => {
    it('should successfully check out with valid data', async () => {
      const mockResponse = {
        success: true,
        timeEntry: {
          id: 'test-id',
          checkInTime: '2025-01-17T10:00:00Z',
          checkOutTime: '2025-01-17T18:00:00Z',
          totalHours: 8,
          branchId: 'branch-1',
          branchName: 'สาขาทดสอบ'
        },
        message: 'Check-out สำเร็จที่สาขา สาขาทดสอบ (ทำงาน 8 ชั่วโมง)'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const request = {
        latitude: 13.7563,
        longitude: 100.5018
      };

      const result = await timeEntryService.checkOut(request);

      expect(mockFetch).toHaveBeenCalledWith('/api/employee/time-entries/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when no active check-in found', async () => {
      const mockError = {
        error: 'ไม่พบการ check-in ที่ยังไม่ได้ check-out'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValueOnce(mockError),
      });

      const request = {
        latitude: 13.7563,
        longitude: 100.5018
      };

      await expect(timeEntryService.checkOut(request)).rejects.toThrow(
        'ไม่พบการ check-in ที่ยังไม่ได้ check-out'
      );
    });
  });

  describe('getStatus', () => {
    it('should return current status when checked in', async () => {
      const mockStatus = {
        isCheckedIn: true,
        activeEntry: {
          id: 'test-id',
          checkInTime: '2025-01-17T10:00:00Z',
          currentSessionHours: 2.5,
          branch: {
            id: 'branch-1',
            name: 'สาขาทดสอบ',
            latitude: 13.7563,
            longitude: 100.5018
          }
        },
        todayStats: {
          totalEntries: 1,
          totalHours: 2.5,
          completedSessions: []
        }
      };

      const mockResponse = {
        status: mockStatus
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await timeEntryService.getStatus();

      expect(mockFetch).toHaveBeenCalledWith('/api/employee/time-entries/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockStatus);
    });

    it('should return status when not checked in', async () => {
      const mockStatus = {
        isCheckedIn: false,
        activeEntry: null,
        todayStats: {
          totalEntries: 0,
          totalHours: 0,
          completedSessions: []
        }
      };

      const mockResponse = {
        status: mockStatus
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await timeEntryService.getStatus();

      expect(result).toEqual(mockStatus);
      expect(result.isCheckedIn).toBe(false);
      expect(result.activeEntry).toBeNull();
    });
  });

  describe('getAvailableBranches', () => {
    it('should return available branches within range', async () => {
      const mockPosition = {
        coords: {
          latitude: 13.7563,
          longitude: 100.5018,
          accuracy: 10
        }
      };

      const mockNearbyBranches = [
        {
          id: 'branch-1',
          name: 'สาขาใกล้',
          distance: 50,
        },
        {
          id: 'branch-2',
          name: 'สาขาไกล',
          distance: 150,
        }
      ];

      vi.mocked(locationService.getCurrentPosition).mockResolvedValueOnce(mockPosition as GeolocationPosition);
      vi.mocked(locationService.getNearbyBranches).mockResolvedValueOnce(mockNearbyBranches);

      const result = await timeEntryService.getAvailableBranches();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'branch-1',
        name: 'สาขาใกล้',
        distance: 50,
        canCheckIn: true
      });
      expect(result[1]).toEqual({
        id: 'branch-2',
        name: 'สาขาไกล',
        distance: 150,
        canCheckIn: false
      });
    });

    it('should handle GPS errors', async () => {
      vi.mocked(locationService.getCurrentPosition).mockRejectedValueOnce(
        new Error('GPS not available')
      );

      await expect(timeEntryService.getAvailableBranches()).rejects.toThrow('GPS not available');
    });
  });

  describe('validateCheckIn', () => {
    it('should validate successful check-in requirements', async () => {
      const mockStatus = {
        isCheckedIn: false,
        activeEntry: null,
        todayStats: { totalEntries: 0, totalHours: 0, completedSessions: [] }
      };

      const mockAvailableBranches = [
        {
          id: 'branch-1',
          name: 'สาขาทดสอบ',
          distance: 50,
          canCheckIn: true
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ status: mockStatus }),
      });

      const mockPosition = {
        coords: { latitude: 13.7563, longitude: 100.5018, accuracy: 10 }
      };

      vi.mocked(locationService.getCurrentPosition).mockResolvedValueOnce(mockPosition as GeolocationPosition);
      vi.mocked(locationService.getNearbyBranches).mockResolvedValueOnce(mockAvailableBranches);

      const result = await timeEntryService.validateCheckIn('branch-1', 13.7563, 100.5018);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when already checked in', async () => {
      const mockStatus = {
        isCheckedIn: true,
        activeEntry: {
          id: 'active-id',
          checkInTime: '2025-01-17T10:00:00Z',
          currentSessionHours: 1,
          branch: {
            id: 'branch-1',
            name: 'สาขาปัจจุบัน',
            latitude: 13.7563,
            longitude: 100.5018
          }
        },
        todayStats: { totalEntries: 1, totalHours: 1, completedSessions: [] }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ status: mockStatus }),
      });

      const result = await timeEntryService.validateCheckIn('branch-2', 13.7563, 100.5018);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('คุณมีการ check-in ที่ยังไม่ได้ check-out อยู่แล้ว');
    });

    it('should fail validation when branch is out of range', async () => {
      const mockStatus = {
        isCheckedIn: false,
        activeEntry: null,
        todayStats: { totalEntries: 0, totalHours: 0, completedSessions: [] }
      };

      const mockAvailableBranches = [
        {
          id: 'branch-1',
          name: 'สาขาไกล',
          distance: 150,
          canCheckIn: false
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ status: mockStatus }),
      });

      const mockPosition = {
        coords: { latitude: 13.7563, longitude: 100.5018, accuracy: 10 }
      };

      vi.mocked(locationService.getCurrentPosition).mockResolvedValueOnce(mockPosition as GeolocationPosition);
      vi.mocked(locationService.getNearbyBranches).mockResolvedValueOnce(mockAvailableBranches);

      const result = await timeEntryService.validateCheckIn('branch-1', 13.7563, 100.5018);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('คุณอยู่ห่างจากสาขา 150 เมตร');
    });
  });

  describe('validateCheckOut', () => {
    it('should validate successful check-out requirements', async () => {
      const mockStatus = {
        isCheckedIn: true,
        activeEntry: {
          id: 'active-id',
          checkInTime: '2025-01-17T10:00:00Z',
          currentSessionHours: 2,
          branch: {
            id: 'branch-1',
            name: 'สาขาทดสอบ',
            latitude: 13.7563,
            longitude: 100.5018
          }
        },
        todayStats: { totalEntries: 1, totalHours: 2, completedSessions: [] }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ status: mockStatus }),
      });

      vi.mocked(locationService.calculateDistance).mockReturnValue(50);

      const result = await timeEntryService.validateCheckOut(13.7563, 100.5018);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.activeEntry).toEqual(mockStatus.activeEntry);
    });

    it('should fail validation when not checked in', async () => {
      const mockStatus = {
        isCheckedIn: false,
        activeEntry: null,
        todayStats: { totalEntries: 0, totalHours: 0, completedSessions: [] }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ status: mockStatus }),
      });

      const result = await timeEntryService.validateCheckOut(13.7563, 100.5018);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ไม่พบการ check-in ที่ยังไม่ได้ check-out');
    });

    it('should fail validation when too far from check-in branch', async () => {
      const mockStatus = {
        isCheckedIn: true,
        activeEntry: {
          id: 'active-id',
          checkInTime: '2025-01-17T10:00:00Z',
          currentSessionHours: 2,
          branch: {
            id: 'branch-1',
            name: 'สาขาทดสอบ',
            latitude: 13.7563,
            longitude: 100.5018
          }
        },
        todayStats: { totalEntries: 1, totalHours: 2, completedSessions: [] }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ status: mockStatus }),
      });

      vi.mocked(locationService.calculateDistance).mockReturnValue(150);

      const result = await timeEntryService.validateCheckOut(13.7000, 100.5000);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('คุณอยู่ห่างจากสาขา 150 เมตร');
    });
  });

  describe('Utility methods', () => {
    it('should format working hours correctly', () => {
      expect(timeEntryService.formatWorkingHours(0.5)).toBe('30 นาที');
      expect(timeEntryService.formatWorkingHours(1)).toBe('1 ชั่วโมง');
      expect(timeEntryService.formatWorkingHours(1.5)).toBe('1 ชั่วโมง 30 นาที');
      expect(timeEntryService.formatWorkingHours(8)).toBe('8 ชั่วโมง');
      expect(timeEntryService.formatWorkingHours(8.25)).toBe('8 ชั่วโมง 15 นาที');
    });

    it('should determine work type correctly', () => {
      expect(timeEntryService.getWorkType(8)).toBe('hourly');
      expect(timeEntryService.getWorkType(12)).toBe('hourly');
      expect(timeEntryService.getWorkType(12.1)).toBe('daily');
      expect(timeEntryService.getWorkType(16)).toBe('daily');
    });
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { timeEntryService } from '@/lib/services/time-entry.service';

// Mock fetch
global.fetch = vi.fn();

// Mock location service
vi.mock('@/lib/services/location.service', () => ({
  locationService: {
    calculateDistanceBetweenPoints: vi.fn(),
  },
}));

import { locationService } from '@/lib/services/location.service';

describe('Time Entry Service - Detail functionality (Story 5.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTimeEntryDetail', () => {
    it('should fetch time entry detail successfully', async () => {
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
        material_usage: [
          {
            raw_material: { name: 'แป้ง', unit: 'กิโลกรัม' },
            quantity_used: 2.5,
          },
        ],
        total_hours: 9,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockTimeEntryDetail,
        }),
      });

      const result = await timeEntryService.getTimeEntryDetail('entry-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTimeEntryDetail);
      expect(fetch).toHaveBeenCalledWith(
        '/api/employee/time-entries/entry-123/detail',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle API error responses', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: 'Time entry not found',
        }),
      });

      const result = await timeEntryService.getTimeEntryDetail('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Time entry not found');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await timeEntryService.getTimeEntryDetail('entry-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('เกิดข้อผิดพลาดในการดึงรายละเอียดการทำงาน');
    });
  });

  describe('optimizeSelfieUrl', () => {
    it('should optimize Supabase Storage URLs', () => {
      const url = 'https://abc.supabase.co/storage/v1/object/public/selfies/image.jpg';
      
      const optimized = timeEntryService.optimizeSelfieUrl(url, 'medium');
      
      expect(optimized).toBe(
        'https://abc.supabase.co/storage/v1/object/public/selfies/image.jpg?width=300&height=300&quality=80'
      );
    });

    it('should handle URLs with existing query parameters', () => {
      const url = 'https://abc.supabase.co/storage/v1/object/public/selfies/image.jpg?token=123';
      
      const optimized = timeEntryService.optimizeSelfieUrl(url, 'small');
      
      expect(optimized).toBe(
        'https://abc.supabase.co/storage/v1/object/public/selfies/image.jpg?token=123&width=150&height=150&quality=80'
      );
    });

    it('should handle different size options', () => {
      const url = 'https://abc.supabase.co/storage/v1/object/public/selfies/image.jpg';
      
      const small = timeEntryService.optimizeSelfieUrl(url, 'small');
      const medium = timeEntryService.optimizeSelfieUrl(url, 'medium');
      const large = timeEntryService.optimizeSelfieUrl(url, 'large');
      
      expect(small).toContain('width=150&height=150');
      expect(medium).toContain('width=300&height=300');
      expect(large).toContain('width=600&height=600');
    });

    it('should return original URL for non-Supabase URLs', () => {
      const url = 'https://example.com/image.jpg';
      
      const optimized = timeEntryService.optimizeSelfieUrl(url, 'medium');
      
      expect(optimized).toBe(url);
    });

    it('should handle empty URLs', () => {
      const optimized = timeEntryService.optimizeSelfieUrl('', 'medium');
      
      expect(optimized).toBe(null);
    });

    it('should handle whitespace-only URLs', () => {
      const optimized = timeEntryService.optimizeSelfieUrl('   ', 'medium');
      
      expect(optimized).toBe(null);
    });
  });

  describe('calculateDistanceFromBranch', () => {
    it('should calculate distance using location service', () => {
      const checkInLocation = { latitude: 13.7563, longitude: 100.5018 };
      const branchLocation = { latitude: 13.7570, longitude: 100.5025 };
      
      (locationService.calculateDistanceBetweenPoints as any).mockReturnValue(85.2);

      const distance = timeEntryService.calculateDistanceFromBranch(
        checkInLocation,
        branchLocation
      );

      expect(distance).toBe(85.2);
      expect(locationService.calculateDistanceBetweenPoints).toHaveBeenCalledWith(
        checkInLocation,
        branchLocation
      );
    });
  });

  describe('formatSelfieAltText', () => {
    it('should format check-in selfie alt text with all details', () => {
      const altText = timeEntryService.formatSelfieAltText(
        'check-in',
        'สมชาย ใจดี',
        'สาขาเซ็นทรัล'
      );

      expect(altText).toBe('รูปเซลฟี่เช็คอินของสมชาย ใจดีที่สาขาเซ็นทรัล');
    });

    it('should format check-out selfie alt text', () => {
      const altText = timeEntryService.formatSelfieAltText(
        'check-out',
        'สมหญิง สุขใจ',
        'สาขาสยาม'
      );

      expect(altText).toBe('รูปเซลฟี่เช็คเอาท์ของสมหญิง สุขใจที่สาขาสยาม');
    });

    it('should use defaults when employee name and branch are not provided', () => {
      const altText = timeEntryService.formatSelfieAltText('check-in');

      expect(altText).toBe('รูปเซลฟี่เช็คอินของพนักงานที่สาขา');
    });

    it('should handle partial information', () => {
      const altText = timeEntryService.formatSelfieAltText(
        'check-out',
        'สมชาย ใจดี'
      );

      expect(altText).toBe('รูปเซลฟี่เช็คเอาท์ของสมชาย ใจดีที่สาขา');
    });
  });

  describe('handleImageError', () => {
    it('should log warning and return placeholder', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const url = 'https://broken-image.jpg';

      const fallback = timeEntryService.handleImageError(url);

      expect(fallback).toBe('/placeholder-selfie.png');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load selfie image:', url);
      
      consoleSpy.mockRestore();
    });
  });
});
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/employee/time-entries/[id]/detail/route';
import { createClient } from '@/lib/supabase-server';
import { calculateDistance } from '@/lib/utils/gps.utils';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase-server');
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));
vi.mock('@/lib/utils/gps.utils');

const mockCreateClient = vi.mocked(createClient);
const mockCalculateDistance = vi.mocked(calculateDistance);

describe('Time Entry Detail API GPS Functionality', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    mockCreateClient.mockReturnValue(mockSupabase);
  });

  describe('GPS Coordinates Processing', () => {
    const mockTimeEntryData = {
      id: 'test-entry-id',
      employee_id: 'test-user-id',
      check_in_time: '2024-01-20T08:00:00Z',
      check_out_time: '2024-01-20T17:00:00Z',
      check_in_selfie_url: 'https://example.com/selfie1.jpg',
      check_out_selfie_url: 'https://example.com/selfie2.jpg',
      check_in_location: {
        latitude: 13.7563,
        longitude: 100.5018
      },
      branches: {
        id: 'branch-1',
        name: 'สาขาเซ็นทรัล',
        latitude: 13.7555,
        longitude: 100.5015
      }
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      // Mock material usage query (empty result)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'time_entries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockTimeEntryData,
              error: null,
            }),
          };
        } else if (table === 'material_usage') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return mockSupabase;
      });
    });

    it('should process valid GPS coordinates and calculate distance', async () => {
      // Mock distance calculation (approximately 100 meters)
      mockCalculateDistance.mockReturnValue(95.5);

      const request = new NextRequest('http://localhost/api/employee/time-entries/test-entry-id/detail');
      const response = await GET(request, { params: { id: 'test-entry-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.check_in_location).toEqual({
        latitude: 13.7563,
        longitude: 100.5018,
        distance_from_branch: 95.5
      });

      // Verify distance calculation was called with correct parameters
      expect(mockCalculateDistance).toHaveBeenCalledWith(
        { latitude: 13.7563, longitude: 100.5018 },
        { latitude: 13.7555, longitude: 100.5015 }
      );
    });

    it('should handle missing GPS coordinates gracefully', async () => {
      const dataWithoutGPS = {
        ...mockTimeEntryData,
        check_in_location: null
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'time_entries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: dataWithoutGPS,
              error: null,
            }),
          };
        } else if (table === 'material_usage') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      const request = new NextRequest('http://localhost/api/employee/time-entries/test-entry-id/detail');
      const response = await GET(request, { params: { id: 'test-entry-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.check_in_location).toBeUndefined();
      expect(mockCalculateDistance).not.toHaveBeenCalled();
    });

    it('should handle invalid GPS coordinates gracefully', async () => {
      const dataWithInvalidGPS = {
        ...mockTimeEntryData,
        check_in_location: {
          latitude: 'invalid',
          longitude: 200 // Out of range
        }
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'time_entries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: dataWithInvalidGPS,
              error: null,
            }),
          };
        } else if (table === 'material_usage') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      const request = new NextRequest('http://localhost/api/employee/time-entries/test-entry-id/detail');
      const response = await GET(request, { params: { id: 'test-entry-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.check_in_location).toBeUndefined();
      expect(mockCalculateDistance).not.toHaveBeenCalled();
    });

    it('should validate GPS coordinate ranges correctly', async () => {
      const testCases = [
        { lat: 91, lng: 100, valid: false }, // Latitude > 90
        { lat: -91, lng: 100, valid: false }, // Latitude < -90
        { lat: 50, lng: 181, valid: false }, // Longitude > 180
        { lat: 50, lng: -181, valid: false }, // Longitude < -180
        { lat: 45.123456, lng: 90.654321, valid: true }, // Valid coordinates
      ];

      for (const testCase of testCases) {
        const dataWithTestGPS = {
          ...mockTimeEntryData,
          check_in_location: {
            latitude: testCase.lat,
            longitude: testCase.lng
          }
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'time_entries') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: dataWithTestGPS,
                error: null,
              }),
            };
          } else if (table === 'material_usage') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          }
          return mockSupabase;
        });

        if (testCase.valid) {
          mockCalculateDistance.mockReturnValue(50.0);
        }

        const request = new NextRequest('http://localhost/api/employee/time-entries/test-entry-id/detail');
        const response = await GET(request, { params: { id: 'test-entry-id' } });
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);

        if (testCase.valid) {
          expect(responseData.data.check_in_location).toBeDefined();
          expect(responseData.data.check_in_location.latitude).toBe(testCase.lat);
          expect(responseData.data.check_in_location.longitude).toBe(testCase.lng);
        } else {
          expect(responseData.data.check_in_location).toBeUndefined();
        }
      }
    });

    it('should handle GPS processing errors gracefully', async () => {
      const dataWithCorruptGPS = {
        ...mockTimeEntryData,
        check_in_location: 'corrupted_json_data'
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'time_entries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: dataWithCorruptGPS,
              error: null,
            }),
          };
        } else if (table === 'material_usage') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      const request = new NextRequest('http://localhost/api/employee/time-entries/test-entry-id/detail');
      const response = await GET(request, { params: { id: 'test-entry-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.check_in_location).toBeUndefined();
    });

    it('should round distance calculation to 2 decimal places', async () => {
      mockCalculateDistance.mockReturnValue(123.456789);

      const request = new NextRequest('http://localhost/api/employee/time-entries/test-entry-id/detail');
      const response = await GET(request, { params: { id: 'test-entry-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.check_in_location.distance_from_branch).toBe(123.46);
    });
  });

  describe('Security Validation', () => {
    it('should only return GPS data for time entry owner', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'different-user-id' } },
        error: null,
      });

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }));

      const request = new NextRequest('http://localhost/api/employee/time-entries/test-entry-id/detail');
      const response = await GET(request, { params: { id: 'test-entry-id' } });

      expect(response.status).toBe(404);
      expect(mockCalculateDistance).not.toHaveBeenCalled();
    });

    it('should require authentication for GPS data access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/employee/time-entries/test-entry-id/detail');
      const response = await GET(request, { params: { id: 'test-entry-id' } });

      expect(response.status).toBe(401);
      expect(mockCalculateDistance).not.toHaveBeenCalled();
    });
  });
});
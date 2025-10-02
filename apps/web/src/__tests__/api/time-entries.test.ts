import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as checkInPOST } from '@/app/api/employee/time-entries/check-in/route';
import { POST as checkOutPOST } from '@/app/api/employee/time-entries/check-out/route';
import { GET as statusGET } from '@/app/api/employee/time-entries/status/route';
import type { User, TimeEntry, Branch } from 'packages/database/types';

// Mock types for Supabase client
interface MockSupabaseClient {
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
}

interface MockAuthResponse {
  data: { user: { id: string } | null }
  error: Error | null
}

interface CheckInRequest {
  branchId: string
  latitude: number
  longitude: number
  selfieUrl?: string
}

interface CheckOutRequest {
  latitude: number
  longitude: number
}

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/utils/gps.utils', () => ({
  calculateDistance: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  generalRateLimiter: {
    checkLimit: vi.fn(),
  },
}));

import { createSupabaseServerClient } from '@/lib/supabase';
import { calculateDistance } from '@/lib/utils/gps.utils';
import { generalRateLimiter } from '@/lib/rate-limit';

describe('Time Entries API', () => {
  let mockSupabase: MockSupabaseClient;
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create detailed mock structure
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  single: vi.fn(),
                  maybeSingle: vi.fn(),
                })),
              })),
            })),
            not: vi.fn(() => ({
              gte: vi.fn(() => ({
                lt: vi.fn(() => ({
                  order: vi.fn(),
                })),
              })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
      })),
    };

    vi.mocked(createSupabaseServerClient).mockReturnValue(mockSupabase as MockSupabaseClient & Record<string, unknown>);
    vi.mocked(generalRateLimiter.checkLimit).mockReturnValue({ allowed: true });
    
    // Mock successful auth by default
    (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    } as MockAuthResponse);

    // Mock user profile
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { id: 'test-user-id', role: 'employee' },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/employee/time-entries/check-in', () => {
    beforeEach(() => {
      mockRequest = {
        json: vi.fn().mockResolvedValue({
          branchId: 'branch-1',
          latitude: 13.7563,
          longitude: 100.5018,
          selfieUrl: 'https://example.com/selfie.jpg',
        } as CheckInRequest),
      } as unknown as NextRequest;
    });

    it('should successfully check in when conditions are met', async () => {
      // Mock no active check-in
      mockSupabase.from().select().eq().is().order().limit().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      // Mock branch data
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'branch-1',
          name: 'สาขาทดสอบ',
          latitude: '13.7563',
          longitude: '100.5018',
        },
        error: null,
      });

      // Mock GPS distance calculation (within range)
      vi.mocked(calculateDistance).mockReturnValue(50);

      // Mock successful insert
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: {
          id: 'new-entry-id',
          check_in_time: '2025-01-17T10:00:00Z',
          branch_id: 'branch-1',
        },
        error: null,
      });

      const response = await checkInPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.timeEntry.id).toBe('new-entry-id');
      expect(responseData.message).toContain('Check-in สำเร็จ');
    });

    it('should reject check-in when user already has active entry', async () => {
      // Mock existing active check-in
      mockSupabase.from().select().eq().is().order().limit().single.mockResolvedValue({
        data: {
          id: 'existing-entry-id',
          check_in_time: '2025-01-17T09:00:00Z',
        },
        error: null,
      });

      const response = await checkInPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('check-in ที่ยังไม่ได้ check-out');
      expect(responseData.activeEntry).toBeDefined();
    });

    it('should reject check-in when too far from branch', async () => {
      // Mock no active check-in
      mockSupabase.from().select().eq().is().order().limit().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock branch data
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'branch-1',
          name: 'สาขาทดสอบ',
          latitude: '13.7563',
          longitude: '100.5018',
        },
        error: null,
      });

      // Mock GPS distance calculation (out of range)
      vi.mocked(calculateDistance).mockReturnValue(150);

      const response = await checkInPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('คุณอยู่ห่างจากสาขา 150 เมตร');
      expect(responseData.distance).toBe(150);
    });

    it('should reject check-in when branch not found', async () => {
      // Mock no active check-in
      mockSupabase.from().select().eq().is().order().limit().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock branch not found
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Branch not found' },
      });

      const response = await checkInPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Branch not found');
    });

    it('should reject check-in for non-employee users', async () => {
      // Mock admin user
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'test-user-id', role: 'admin' },
        error: null,
      });

      const response = await checkInPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe('Employee access required');
    });

    it('should reject check-in when missing required fields', async () => {
      mockRequest.json = vi.fn().mockResolvedValue({
        branchId: 'branch-1',
        // Missing latitude and longitude
      });

      const response = await checkInPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
    });

    it('should handle rate limiting', async () => {
      vi.mocked(generalRateLimiter.checkLimit).mockReturnValue({ allowed: false });

      const response = await checkInPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData.error).toBe('Rate limit exceeded');
    });

    it('should handle unauthorized requests', async () => {
      (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      } as MockAuthResponse);

      const response = await checkInPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/employee/time-entries/check-out', () => {
    beforeEach(() => {
      mockRequest = {
        json: vi.fn().mockResolvedValue({
          latitude: 13.7563,
          longitude: 100.5018,
        } as CheckOutRequest),
      } as unknown as NextRequest;
    });

    it('should successfully check out when conditions are met', async () => {
      // Mock active check-in entry
      mockSupabase.from().select().eq().is().order().limit().single.mockResolvedValue({
        data: {
          id: 'active-entry-id',
          check_in_time: '2025-01-17T10:00:00Z',
          branch_id: 'branch-1',
        },
        error: null,
      });

      // Mock branch data
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'branch-1',
          name: 'สาขาทดสอบ',
          latitude: '13.7563',
          longitude: '100.5018',
        },
        error: null,
      });

      // Mock GPS distance calculation (within range)
      vi.mocked(calculateDistance).mockReturnValue(50);

      // Mock successful update
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: {
          id: 'active-entry-id',
          check_in_time: '2025-01-17T10:00:00Z',
          check_out_time: '2025-01-17T18:00:00Z',
          total_hours: 8,
          branch_id: 'branch-1',
        },
        error: null,
      });

      const response = await checkOutPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.timeEntry.totalHours).toBe(8);
      expect(responseData.message).toContain('Check-out สำเร็จ');
    });

    it('should reject check-out when no active entry found', async () => {
      // Mock no active check-in
      mockSupabase.from().select().eq().is().order().limit().single.mockResolvedValue({
        data: null,
        error: { message: 'No active entry' },
      });

      const response = await checkOutPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('ไม่พบการ check-in');
    });

    it('should reject check-out when too far from branch', async () => {
      // Mock active check-in entry
      mockSupabase.from().select().eq().is().order().limit().single.mockResolvedValue({
        data: {
          id: 'active-entry-id',
          check_in_time: '2025-01-17T10:00:00Z',
          branch_id: 'branch-1',
        },
        error: null,
      });

      // Mock branch data
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'branch-1',
          name: 'สาขาทดสอบ',
          latitude: '13.7563',
          longitude: '100.5018',
        },
        error: null,
      });

      // Mock GPS distance calculation (out of range)
      vi.mocked(calculateDistance).mockReturnValue(200);

      const response = await checkOutPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('คุณอยู่ห่างจากสาขา 200 เมตร');
    });

    it('should handle missing location data', async () => {
      mockRequest.json = vi.fn().mockResolvedValue({
        // Missing latitude and longitude
      });

      const response = await checkOutPOST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
    });
  });

  describe('GET /api/employee/time-entries/status', () => {
    beforeEach(() => {
      mockRequest = {} as NextRequest;
    });

    it('should return status when user is checked in', async () => {
      // Mock active entry with branch details
      mockSupabase.from().select().eq().is().order().limit().maybeSingle.mockResolvedValue({
        data: {
          id: 'active-entry-id',
          check_in_time: '2025-01-17T10:00:00Z',
          check_out_time: null,
          total_hours: null,
          branch_id: 'branch-1',
          branches: {
            id: 'branch-1',
            name: 'สาขาทดสอบ',
            latitude: 13.7563,
            longitude: 100.5018,
          },
        },
        error: null,
      });

      // Mock today's completed entries
      mockSupabase.from().select().eq().not().gte().lt().order.mockResolvedValue({
        data: [
          {
            id: 'completed-entry-1',
            check_in_time: '2025-01-17T08:00:00Z',
            check_out_time: '2025-01-17T12:00:00Z',
            total_hours: 4,
            branch_id: 'branch-1',
            branches: { id: 'branch-1', name: 'สาขาทดสอบ' },
          }
        ],
        error: null,
      });

      const response = await statusGET(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.status.isCheckedIn).toBe(true);
      expect(responseData.status.activeEntry).toBeDefined();
      expect(responseData.status.activeEntry.branch.name).toBe('สาขาทดสอบ');
      expect(responseData.status.todayStats.totalEntries).toBe(1);
      expect(responseData.status.todayStats.totalHours).toBe(4);
    });

    it('should return status when user is not checked in', async () => {
      // Mock no active entry
      mockSupabase.from().select().eq().is().order().limit().maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock no completed entries today
      mockSupabase.from().select().eq().not().gte().lt().order.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await statusGET(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.status.isCheckedIn).toBe(false);
      expect(responseData.status.activeEntry).toBeNull();
      expect(responseData.status.todayStats.totalEntries).toBe(0);
      expect(responseData.status.todayStats.totalHours).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from().select().eq().is().order().limit().maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const response = await statusGET(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Database error');
    });

    it('should require employee role', async () => {
      // Mock admin user
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'test-user-id', role: 'admin', full_name: 'Admin User' },
        error: null,
      });

      const response = await statusGET(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe('Employee access required');
    });
  });
});
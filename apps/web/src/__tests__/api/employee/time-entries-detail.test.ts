import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/employee/time-entries/[id]/detail/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
};

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('/api/employee/time-entries/[id]/detail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require time entry ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/employee/time-entries//detail');
    
    const response = await GET(request, { params: { id: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Time entry ID is required');
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest('http://localhost:3000/api/employee/time-entries/123/detail');
    
    const response = await GET(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should return 404 for non-existent time entry', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        })),
      })),
    }));
    
    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const request = new NextRequest('http://localhost:3000/api/employee/time-entries/non-existent/detail');
    
    const response = await GET(request, { params: { id: 'non-existent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Time entry not found');
  });

  it('should enforce owner-only access (403 for different user)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock time entry query - returns no data because employee_id doesn't match
    const mockTimeEntryQuery = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockTimeEntryQuery,
        })),
      })),
    }));
    
    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const request = new NextRequest('http://localhost:3000/api/employee/time-entries/entry-456/detail');
    
    const response = await GET(request, { params: { id: 'entry-456' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Time entry not found or access denied');
  });

  it('should return time entry detail with material usage', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock time entry data
    const mockTimeEntryData = {
      id: 'entry-123',
      employee_id: 'user-123',
      check_in_time: '2025-01-20T08:00:00Z',
      check_out_time: '2025-01-20T17:00:00Z',
      check_in_selfie_url: 'https://example.com/selfie1.jpg',
      check_out_selfie_url: 'https://example.com/selfie2.jpg',
      branches: {
        id: 'branch-456',
        name: 'สาขาเซ็นทรัล',
        latitude: 13.7563,
        longitude: 100.5018,
      },
    };

    // Mock material usage data
    const mockMaterialData = [
      {
        id: 'usage-1',
        quantity_used: 2.5,
        raw_materials: {
          name: 'แป้ง',
          unit: 'กิโลกรัม',
        },
      },
      {
        id: 'usage-2',
        quantity_used: 1.0,
        raw_materials: {
          name: 'นม',
          unit: 'ลิตร',
        },
      },
    ];

    // Setup first query (time entry) - track call order
    let callCount = 0;
    mockSupabase.from.mockImplementation((table) => {
      callCount++;
      
      if (callCount === 1 && table === 'time_entries') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockTimeEntryData,
                  error: null,
                }),
              })),
            })),
          })),
        };
      }
      
      if (callCount === 2 && table === 'material_usage') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: mockMaterialData,
              error: null,
            }),
          })),
        };
      }
      
      return { select: vi.fn() };
    });

    const request = new NextRequest('http://localhost:3000/api/employee/time-entries/entry-123/detail');
    
    const response = await GET(request, { params: { id: 'entry-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
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
        {
          raw_material: { name: 'นม', unit: 'ลิตร' },
          quantity_used: 1.0,
        },
      ],
      total_hours: 9, // 9 hours between 08:00 and 17:00
    });
  });

  it('should calculate total hours correctly for completed entries', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockTimeEntryData = {
      id: 'entry-123',
      employee_id: 'user-123',
      check_in_time: '2025-01-20T09:30:00Z',
      check_out_time: '2025-01-20T14:45:00Z',
      check_in_selfie_url: 'https://example.com/selfie1.jpg',
      check_out_selfie_url: 'https://example.com/selfie2.jpg',
      branches: {
        id: 'branch-456',
        name: 'สาขาทดสอบ',
        latitude: 13.7563,
        longitude: 100.5018,
      },
    };

    let callCount = 0;
    mockSupabase.from.mockImplementation((table) => {
      callCount++;
      
      if (callCount === 1 && table === 'time_entries') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockTimeEntryData,
                  error: null,
                }),
              })),
            })),
          })),
        };
      }
      
      if (callCount === 2 && table === 'material_usage') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        };
      }
      
      return { select: vi.fn() };
    });

    const request = new NextRequest('http://localhost:3000/api/employee/time-entries/entry-123/detail');
    
    const response = await GET(request, { params: { id: 'entry-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.total_hours).toBe(5.25); // 5.25 hours between 09:30 and 14:45
  });

  it('should handle ongoing work (no check-out time)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockTimeEntryData = {
      id: 'entry-123',
      employee_id: 'user-123',
      check_in_time: '2025-01-20T08:00:00Z',
      check_out_time: null, // Still working
      check_in_selfie_url: 'https://example.com/selfie1.jpg',
      check_out_selfie_url: null,
      branches: {
        id: 'branch-456',
        name: 'สาขาทดสอบ',
        latitude: 13.7563,
        longitude: 100.5018,
      },
    };

    let callCount = 0;
    mockSupabase.from.mockImplementation((table) => {
      callCount++;
      
      if (callCount === 1 && table === 'time_entries') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockTimeEntryData,
                  error: null,
                }),
              })),
            })),
          })),
        };
      }
      
      if (callCount === 2 && table === 'material_usage') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        };
      }
      
      return { select: vi.fn() };
    });

    const request = new NextRequest('http://localhost:3000/api/employee/time-entries/entry-123/detail');
    
    const response = await GET(request, { params: { id: 'entry-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.check_out_time).toBeNull();
    expect(data.data.check_out_selfie_url).toBeNull();
    expect(data.data.total_hours).toBeUndefined(); // No total hours for ongoing work
  });
});
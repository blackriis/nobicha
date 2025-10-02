import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/employee/time-entries/history/route'

// Mock Supabase
const mockSupabaseServer = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => mockSupabaseServer),
  select: vi.fn(() => mockSupabaseServer),
  eq: vi.fn(() => mockSupabaseServer),
  order: vi.fn(() => mockSupabaseServer),
  limit: vi.fn(() => mockSupabaseServer),
  gte: vi.fn(() => mockSupabaseServer),
  lt: vi.fn(() => mockSupabaseServer)
}

vi.mock('@/lib/supabase-server', () => ({
  createClient: () => mockSupabaseServer,
  createSupabaseServerClient: () => mockSupabaseServer
}))

describe('/api/employee/time-entries/history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    mockSupabaseServer.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Unauthorized')
    })

    const request = new NextRequest('https://example.com/api/employee/time-entries/history')
    const response = await GET(request)
    
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should fetch today\'s time entries by default', async () => {
    const mockUser = { id: 'user-123' }
    const mockTimeEntries = [
      {
        id: 'entry-1',
        user_id: 'user-123',
        branch_id: 'branch-1',
        check_in_time: '2024-01-17T08:00:00Z',
        check_out_time: '2024-01-17T17:00:00Z',
        total_hours: 8,
        created_at: '2024-01-17T08:00:00Z',
        branches: {
          id: 'branch-1',
          name: 'สาขาทดสอบ',
          latitude: 13.7563,
          longitude: 100.5018
        }
      }
    ]

    mockSupabaseServer.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabaseServer.from.mockReturnValue(mockSupabaseServer)
    mockSupabaseServer.select.mockReturnValue(mockSupabaseServer)
    mockSupabaseServer.eq.mockReturnValue(mockSupabaseServer)
    mockSupabaseServer.order.mockReturnValue(mockSupabaseServer)
    mockSupabaseServer.limit.mockReturnValue(mockSupabaseServer)
    mockSupabaseServer.gte.mockReturnValue(mockSupabaseServer)
    mockSupabaseServer.lt.mockReturnValue({
      data: mockTimeEntries,
      error: null
    })

    const request = new NextRequest('https://example.com/api/employee/time-entries/history')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.dateRange).toBe('today')
    expect(data.data).toHaveLength(1)
    expect(data.data[0].branch.name).toBe('สาขาทดสอบ')
  })

  it('should handle week range filter', async () => {
    const mockUser = { id: 'user-123' }

    mockSupabaseServer.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabaseServer.gte.mockReturnValue({
      data: [],
      error: null
    })

    const request = new NextRequest('https://example.com/api/employee/time-entries/history?dateRange=week')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    expect(data.dateRange).toBe('week')
    expect(mockSupabaseServer.gte).toHaveBeenCalled()
  })

  it('should handle month range filter', async () => {
    const mockUser = { id: 'user-123' }

    mockSupabaseServer.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabaseServer.gte.mockReturnValue({
      data: [],
      error: null
    })

    const request = new NextRequest('https://example.com/api/employee/time-entries/history?dateRange=month')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    expect(data.dateRange).toBe('month')
    expect(mockSupabaseServer.gte).toHaveBeenCalled()
  })

  it('should return 500 when database query fails', async () => {
    const mockUser = { id: 'user-123' }

    mockSupabaseServer.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabaseServer.lt.mockReturnValue({
      data: null,
      error: new Error('Database error')
    })

    const request = new NextRequest('https://example.com/api/employee/time-entries/history')
    const response = await GET(request)
    
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch time entries history')
  })

  it('should format time entries correctly', async () => {
    const mockUser = { id: 'user-123' }
    const mockTimeEntries = [
      {
        id: 'entry-1',
        user_id: 'user-123',
        branch_id: 'branch-1',
        check_in_time: '2024-01-17T08:00:00Z',
        check_out_time: null, // Still working
        total_hours: null,
        break_duration: 0,
        notes: 'Test note',
        created_at: '2024-01-17T08:00:00Z',
        branches: {
          id: 'branch-1',
          name: 'สาขาทดสอบ',
          latitude: 13.7563,
          longitude: 100.5018
        }
      }
    ]

    mockSupabaseServer.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabaseServer.lt.mockReturnValue({
      data: mockTimeEntries,
      error: null
    })

    const request = new NextRequest('https://example.com/api/employee/time-entries/history')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    const entry = data.data[0]
    expect(entry.id).toBe('entry-1')
    expect(entry.check_out_time).toBeNull()
    expect(entry.break_duration).toBe(0)
    expect(entry.notes).toBe('Test note')
    expect(entry.branch.name).toBe('สาขาทดสอบ')
  })
})
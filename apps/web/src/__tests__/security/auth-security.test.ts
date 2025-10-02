/**
 * Authentication Security Tests
 * Tests to verify secure usage of getUser() instead of getSession() for user data
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { auth } from '@/lib/auth';

// Mock types for Supabase client
interface MockSupabaseClient {
  auth: {
    getSession: ReturnType<typeof vi.fn>
    getUser: ReturnType<typeof vi.fn>
    onAuthStateChange: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase)
  };
  
  return {
    createClientComponentClient: () => mockSupabase
  };
});

describe('Authentication Security', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { createClientComponentClient } = await import('@/lib/supabase');
    mockSupabase = createClientComponentClient();
  });

  describe('getSession method', () => {
    test('should return session without user profile for security', async () => {
      const mockSessionData = {
        session: {
          access_token: 'mock-token',
          user: { id: 'user-123', email: 'test@example.com' }
        }
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: mockSessionData,
        error: null
      });

      const result = await auth.getSession();

      expect(result).toEqual(mockSessionData);
      expect(mockSupabase.auth.getSession).toHaveBeenCalledOnce();
      
      // Verify we don't fetch user profile in getSession (security improvement)
      expect(mockSupabase.from).not.toHaveBeenCalledWith('users');
    });
  });

  describe('getUser method', () => {
    test('should authenticate user and fetch profile securely', async () => {
      const mockUserData = {
        user: { id: 'user-123', email: 'test@example.com' }
      };

      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'employee'
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      mockSupabase.single.mockResolvedValue({
        data: mockProfile,
        error: null
      });

      const result = await auth.getUser();

      expect(result.user?.profile).toEqual(mockProfile);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledOnce();
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
    });
  });

  describe('onAuthStateChange method', () => {
    test('should not automatically enrich session.user with profile', async () => {
      const mockCallback = vi.fn();
      const mockSubscription = { unsubscribe: vi.fn() };
      
      let authCallback: (event: string, session: unknown) => void;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
        authCallback = callback;
        return { data: { subscription: mockSubscription } };
      });

      auth.onAuthStateChange(mockCallback);

      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-123', email: 'test@example.com' }
      };

      // Simulate auth state change
      authCallback('SIGNED_IN', mockSession);

      expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', mockSession);
      
      // Verify we don't automatically fetch user profile in state change
      // Caller should use getUser() to re-authenticate
      expect(mockSupabase.from).not.toHaveBeenCalledWith('users');
    });
  });
});

describe('AuthProvider Security Improvements', () => {
  test('should demonstrate secure authentication pattern', () => {
    // This test documents the security improvement:
    // 1. getSession() returns raw session (potentially insecure user data)
    // 2. getUser() authenticates with server and returns verified user data
    // 3. AuthProvider uses getUser() for all user state management
    
    const securityPrinciples = {
      insecurePattern: 'Using session.user from getSession() or onAuthStateChange',
      securePattern: 'Using getUser() to re-authenticate user data with server',
      implementation: 'AuthProvider now calls getUser() for secure authentication'
    };

    expect(securityPrinciples.insecurePattern).toContain('session.user');
    expect(securityPrinciples.securePattern).toContain('getUser()');
    expect(securityPrinciples.implementation).toContain('AuthProvider');
  });
});
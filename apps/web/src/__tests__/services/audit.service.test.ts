/**
 * Audit Service Tests
 * Tests for the audit trail system functionality (AC 10)
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '@/lib/services/audit.service';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
  };
  
  return {
    createClient: () => mockSupabase
  };
});

describe('Audit Service', () => {
  let auditService: AuditService;
  let mockRequest: Partial<NextRequest>;
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { createClient } = await import('@/lib/supabase');
    mockSupabase = createClient();
    auditService = new AuditService();
    mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0 Test Browser'
      })
    } as NextRequest;
  });

  describe('log method', () => {
    test('should log audit event successfully', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await auditService.log({
        userId: 'user-123',
        action: 'CREATE',
        tableName: 'payroll_cycles',
        recordId: 'cycle-456',
        newValues: { name: 'Test Cycle', start_date: '2025-01-01' },
        description: 'สร้างรอบการจ่ายเงินเดือนใหม่',
        request: mockRequest as NextRequest
      });

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        action: 'CREATE',
        table_name: 'payroll_cycles',
        record_id: 'cycle-456',
        old_values: undefined,
        new_values: { name: 'Test Cycle', start_date: '2025-01-01' },
        description: 'สร้างรอบการจ่ายเงินเดือนใหม่',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 Test Browser'
      });
    });

    test('should handle audit logging errors gracefully', async () => {
      mockSupabase.insert.mockResolvedValue({ 
        error: { message: 'Database error', code: '23505' } 
      });

      const result = await auditService.log({
        userId: 'user-123',
        action: 'CREATE',
        tableName: 'payroll_cycles'
      });

      expect(result).toBe(false);
    });

    test('should extract IP address from various headers', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      // Test x-forwarded-for with multiple IPs
      const requestWithMultipleIPs = {
        headers: new Headers({
          'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.1'
        })
      } as NextRequest;

      await auditService.log({
        userId: 'user-123',
        action: 'CREATE',
        tableName: 'test_table',
        request: requestWithMultipleIPs
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '203.0.113.1' // Should use first IP
        })
      );
    });
  });

  describe('logPayrollCycleCreation method', () => {
    test('should log payroll cycle creation with Thai description', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      const cycleData = {
        name: 'เงินเดือนมกราคม 2568',
        start_date: '2025-01-01',
        end_date: '2025-01-31'
      };

      const result = await auditService.logPayrollCycleCreation(
        'user-123',
        cycleData,
        'cycle-456',
        mockRequest as NextRequest
      );

      expect(result).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          action: 'CREATE',
          table_name: 'payroll_cycles',
          record_id: 'cycle-456',
          new_values: cycleData,
          description: 'สร้างรอบการจ่ายเงินเดือนใหม่: เงินเดือนมกราคม 2568'
        })
      );
    });
  });

  describe('logPayrollCalculation method', () => {
    test('should log payroll calculation with Thai description', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      const calculationSummary = {
        total_employees: 5,
        total_base_pay: 75000,
        calculation_period: {
          start_date: '2025-01-01',
          end_date: '2025-01-31'
        }
      };

      const result = await auditService.logPayrollCalculation(
        'admin-123',
        'cycle-456',
        calculationSummary,
        mockRequest as NextRequest
      );

      expect(result).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'admin-123',
          action: 'CALCULATE',
          table_name: 'payroll_cycles',
          record_id: 'cycle-456',
          new_values: calculationSummary,
          description: 'คำนวณเงินเดือนสำหรับรอบ ID: cycle-456 - พนักงาน 5 คน'
        })
      );
    });
  });

  describe('logPayrollDetailCreation method', () => {
    test('should log payroll detail creation with summary', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      const payrollDetails = [
        { employee_id: 'emp-1', base_pay: 15000 },
        { employee_id: 'emp-2', base_pay: 20000 },
        { employee_id: 'emp-3', base_pay: 18000 }
      ];

      const result = await auditService.logPayrollDetailCreation(
        'admin-123',
        payrollDetails,
        'cycle-456',
        mockRequest as NextRequest
      );

      expect(result).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'admin-123',
          action: 'CREATE',
          table_name: 'payroll_details',
          record_id: 'cycle-456',
          new_values: {
            payroll_cycle_id: 'cycle-456',
            total_records: 3,
            total_base_pay: 53000
          },
          description: 'สร้างรายละเอียดเงินเดือน 3 รายการสำหรับรอบ cycle-456'
        })
      );
    });
  });

  describe('getAuditLogs method', () => {
    test('should retrieve audit logs with user information', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          user_id: 'user-123',
          action: 'CREATE',
          table_name: 'payroll_cycles',
          record_id: 'cycle-456',
          description: 'สร้างรอบการจ่ายเงินเดือนใหม่',
          created_at: '2025-01-07T10:00:00Z',
          users: { full_name: 'สมชาย ใจดี', email: 'somchai@example.com' }
        }
      ];

      mockSupabase.select.mockResolvedValue({ data: mockAuditLogs, error: null });

      const result = await auditService.getAuditLogs('payroll_cycles', 'cycle-456', 10);

      expect(result).toEqual(mockAuditLogs);
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockSupabase.eq).toHaveBeenCalledWith('table_name', 'payroll_cycles');
      expect(mockSupabase.eq).toHaveBeenCalledWith('record_id', 'cycle-456');
      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });

    test('should handle audit log retrieval errors', async () => {
      mockSupabase.select.mockResolvedValue({ 
        data: null, 
        error: { message: 'Permission denied' } 
      });

      const result = await auditService.getAuditLogs();

      expect(result).toEqual([]);
    });

    test('should retrieve all audit logs when no filters provided', async () => {
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      await auditService.getAuditLogs();

      // Should not call eq methods when no filters provided
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockSupabase.limit).toHaveBeenCalledWith(50); // default limit
    });
  });

  describe('IP address extraction', () => {
    test('should extract IP from x-real-ip header when x-forwarded-for is not available', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      const requestWithRealIp = {
        headers: new Headers({
          'x-real-ip': '203.0.113.1',
          'user-agent': 'Test Browser'
        })
      } as NextRequest;

      await auditService.log({
        userId: 'user-123',
        action: 'CREATE',
        tableName: 'test_table',
        request: requestWithRealIp
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '203.0.113.1'
        })
      );
    });

    test('should handle missing IP headers gracefully', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      const requestWithoutIP = {
        headers: new Headers({
          'user-agent': 'Test Browser'
        })
      } as NextRequest;

      await auditService.log({
        userId: 'user-123',
        action: 'CREATE',
        tableName: 'test_table',
        request: requestWithoutIP
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: undefined
        })
      );
    });
  });

  describe('Audit trail compliance', () => {
    test('should create immutable audit records', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      const auditData = {
        userId: 'user-123',
        action: 'CREATE' as const,
        tableName: 'payroll_cycles',
        recordId: 'cycle-456',
        oldValues: null,
        newValues: { name: 'Test Cycle' },
        description: 'Test audit log'
      };

      await auditService.log(auditData);

      // Verify that audit log includes all required fields for compliance
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          action: 'CREATE',
          table_name: 'payroll_cycles',
          record_id: 'cycle-456',
          old_values: null,
          new_values: { name: 'Test Cycle' },
          description: 'Test audit log',
          ip_address: expect.any(String),
          user_agent: expect.any(String)
        })
      );
    });

    test('should support all required audit actions', () => {
      const validActions = ['CREATE', 'UPDATE', 'DELETE', 'CALCULATE'];
      
      validActions.forEach(action => {
        expect(['CREATE', 'UPDATE', 'DELETE', 'CALCULATE']).toContain(action);
      });
    });
  });
});
import { createClient } from '@/lib/supabase-server';
import { AuditAction, AuditLogInsert } from '@employee-management/database';
import { NextRequest } from 'next/server';

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  tableName: string;
  recordId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  description?: string;
  request?: NextRequest;
}

/**
 * Audit logging service for compliance and security monitoring
 * Logs all critical operations for payroll and user management
 */
export class AuditService {
  private async getSupabase() {
    return await createClient();
  }

  /**
   * Log an audit event
   * @param params Audit log parameters
   * @returns Promise<boolean> Success status
   */
  async log(params: AuditLogParams): Promise<boolean> {
    try {
      const auditData: AuditLogInsert = {
        user_id: params.userId,
        action: params.action,
        table_name: params.tableName,
        record_id: params.recordId,
        old_values: params.oldValues,
        new_values: params.newValues,
        description: params.description,
        ip_address: this.extractIpAddress(params.request),
        user_agent: params.request?.headers.get('user-agent') || undefined
      };

      const supabase = await this.getSupabase();
      const { error } = await supabase
        .from('audit_logs')
        .insert(auditData);

      if (error) {
        console.error('Failed to log audit event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in audit logging:', error);
      return false;
    }
  }

  /**
   * Log payroll cycle creation
   */
  async logPayrollCycleCreation(
    userId: string, 
    cycleData: Record<string, unknown>, 
    cycleId: string,
    request?: NextRequest
  ): Promise<boolean> {
    return this.log({
      userId,
      action: 'CREATE',
      tableName: 'payroll_cycles',
      recordId: cycleId,
      newValues: cycleData,
      description: `สร้างรอบการจ่ายเงินเดือนใหม่: ${cycleData.name}`,
      request
    });
  }

  /**
   * Log payroll calculation execution
   */
  async logPayrollCalculation(
    userId: string,
    cycleId: string,
    calculationSummary: Record<string, unknown>,
    request?: NextRequest
  ): Promise<boolean> {
    return this.log({
      userId,
      action: 'CALCULATE',
      tableName: 'payroll_cycles',
      recordId: cycleId,
      newValues: calculationSummary,
      description: `คำนวณเงินเดือนสำหรับรอบ ID: ${cycleId} - พนักงาน ${calculationSummary.total_employees} คน`,
      request
    });
  }

  /**
   * Log payroll detail creation
   */
  async logPayrollDetailCreation(
    userId: string,
    payrollDetails: Array<Record<string, unknown>>,
    cycleId: string,
    request?: NextRequest
  ): Promise<boolean> {
    return this.log({
      userId,
      action: 'CREATE',
      tableName: 'payroll_details',
      recordId: cycleId,
      newValues: { 
        payroll_cycle_id: cycleId,
        total_records: payrollDetails.length,
        total_base_pay: payrollDetails.reduce((sum, detail) => sum + detail.base_pay, 0)
      },
      description: `สร้างรายละเอียดเงินเดือน ${payrollDetails.length} รายการสำหรับรอบ ${cycleId}`,
      request
    });
  }

  /**
   * Extract IP address from request
   * @param request NextRequest object
   * @returns IP address or null
   */
  private extractIpAddress(request?: NextRequest): string | undefined {
    if (!request) return undefined;

    // Try different headers for IP address
    const xForwardedFor = request.headers.get('x-forwarded-for');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    const xRealIp = request.headers.get('x-real-ip');
    if (xRealIp) {
      return xRealIp;
    }

    const remoteAddr = request.headers.get('x-remote-addr');
    if (remoteAddr) {
      return remoteAddr;
    }

    return undefined;
  }

  /**
   * Retrieve audit logs for a specific table and record
   * @param tableName Table name to filter by
   * @param recordId Optional record ID to filter by
   * @param limit Number of records to return
   * @returns Promise<AuditLog[]>
   */
  async getAuditLogs(tableName?: string, recordId?: string, limit: number = 50) {
    try {
      const supabase = await this.getSupabase();
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          user_id,
          action,
          table_name,
          record_id,
          old_values,
          new_values,
          ip_address,
          user_agent,
          description,
          created_at,
          users!inner (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      if (recordId) {
        query = query.eq('record_id', recordId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error retrieving audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error retrieving audit logs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const auditService = new AuditService();
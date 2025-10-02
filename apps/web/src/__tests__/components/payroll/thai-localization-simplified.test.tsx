/**
 * Simplified Thai Localization Tests for Payroll Components
 * Tests AC 9: UI must support Thai language and display error messages in Thai
 * Focuses on essential Thai text elements that are visible in the components
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import CreatePayrollCycle from '@/features/payroll/components/CreatePayrollCycle';

// Mock the payroll service
vi.mock('@/features/payroll/services/payroll.service', () => ({
  PayrollService: {
    createPayrollCycle: vi.fn(),
  }
}));

// Mock the payroll utilities
vi.mock('@/features/payroll/utils/payroll-calculation.utils', () => ({
  validateDateRange: vi.fn((start: string, end: string) => ({ isValid: true })),
  generatePayrollCycleName: vi.fn((start: string, end: string) => 'เงินเดือนทดสอบ 2568'),
  formatDateForInput: vi.fn((date: Date) => date.toISOString().split('T')[0])
}));

describe('Thai UI Localization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CreatePayrollCycle Component - Thai Text Elements', () => {
    test('should display main Thai header and description', () => {
      render(<CreatePayrollCycle />);

      // Main header in Thai
      expect(screen.getByText('สร้างรอบการจ่ายเงินเดือนใหม่')).toBeInTheDocument();
      
      // Description in Thai
      expect(screen.getByText('กำหนดช่วงเวลาสำหรับการคำนวณเงินเดือนพนักงาน')).toBeInTheDocument();
    });

    test('should display Thai form labels', () => {
      render(<CreatePayrollCycle />);

      // Date labels
      expect(screen.getByText('วันที่เริ่มต้น *')).toBeInTheDocument();
      expect(screen.getByText('วันที่สิ้นสุด *')).toBeInTheDocument();
      
      // Cycle name label
      expect(screen.getByText('ชื่อรอบการจ่ายเงินเดือน *')).toBeInTheDocument();
    });

    test('should display Thai button texts', () => {
      render(<CreatePayrollCycle />);

      // Quick preset buttons
      expect(screen.getByText('เดือนปัจจุบัน')).toBeInTheDocument();
      expect(screen.getByText('ทั้งเดือน')).toBeInTheDocument();
      
      // Action buttons
      expect(screen.getByText('สร้างรอบ')).toBeInTheDocument();
      expect(screen.getByText('สร้างชื่ออัตโนมัติ')).toBeInTheDocument();
    });

    test('should display Thai placeholder text', () => {
      render(<CreatePayrollCycle />);

      // Check placeholder text is in Thai
      const nameInput = screen.getByPlaceholderText('เช่น เงินเดือนมกราคม 2568');
      expect(nameInput).toBeInTheDocument();
    });
  });

  describe('Thai Validation Error Messages', () => {
    test('should show Thai required field error messages when form is submitted empty', async () => {
      render(<CreatePayrollCycle />);

      // Submit empty form
      const submitButton = screen.getByText('สร้างรอบ');
      fireEvent.click(submitButton);

      // Check for Thai validation messages
      await waitFor(() => {
        expect(screen.getByText('กรุณากรอกชื่อรอบการจ่ายเงินเดือน')).toBeInTheDocument();
        expect(screen.getByText('กรุณาเลือกวันที่เริ่มต้น')).toBeInTheDocument();
        expect(screen.getByText('กรุณาเลือกวันที่สิ้นสุด')).toBeInTheDocument();
      });
    });

    test('should show Thai date validation error when date range is invalid', async () => {
      const { validateDateRange } = await import('@/features/payroll/utils/payroll-calculation.utils');
      vi.mocked(validateDateRange).mockReturnValue({ 
        isValid: false, 
        error: 'วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด' 
      });

      render(<CreatePayrollCycle />);

      // Fill form with invalid dates
      const startDateInput = screen.getByLabelText('วันที่เริ่มต้น *');
      const endDateInput = screen.getByLabelText('วันที่สิ้นสุด *');
      const nameInput = screen.getByPlaceholderText('เช่น เงินเดือนมกราคม 2568');

      fireEvent.change(startDateInput, { target: { value: '2025-02-15' } });
      fireEvent.change(endDateInput, { target: { value: '2025-02-10' } });
      fireEvent.change(nameInput, { target: { value: 'Test Cycle' } });

      const submitButton = screen.getByText('สร้างรอบ');
      fireEvent.click(submitButton);

      // Check for Thai date validation error
      await waitFor(() => {
        expect(screen.getByText('วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด')).toBeInTheDocument();
      });
    });

    test('should display Thai loading text during form submission', async () => {
      const { PayrollService } = await import('@/features/payroll/services/payroll.service');
      vi.mocked(PayrollService.createPayrollCycle).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: { payroll_cycle: { id: '123' } } }), 100))
      );

      render(<CreatePayrollCycle />);

      // Fill form with valid data
      const startDateInput = screen.getByLabelText('วันที่เริ่มต้น *');
      const endDateInput = screen.getByLabelText('วันที่สิ้นสุด *');
      const nameInput = screen.getByPlaceholderText('เช่น เงินเดือนมกราคม 2568');

      fireEvent.change(startDateInput, { target: { value: '2025-02-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-02-28' } });
      fireEvent.change(nameInput, { target: { value: 'เงินเดือนกุมภาพันธ์ 2568' } });

      const submitButton = screen.getByText('สร้างรอบ');
      fireEvent.click(submitButton);

      // Check for Thai loading text
      expect(screen.getByText('กำลังสร้าง...')).toBeInTheDocument();
    });
  });

  describe('Thai API Error Messages', () => {
    test('should display Thai error message from API response', async () => {
      const { PayrollService } = await import('@/features/payroll/services/payroll.service');
      vi.mocked(PayrollService.createPayrollCycle).mockResolvedValue({
        success: false,
        error: 'ช่วงวันที่ทับซ้อนกับรอบการจ่ายเงินเดือนที่มีอยู่แล้ว'
      });

      render(<CreatePayrollCycle />);

      // Fill and submit form
      const startDateInput = screen.getByLabelText('วันที่เริ่มต้น *');
      const endDateInput = screen.getByLabelText('วันที่สิ้นสุด *');
      const nameInput = screen.getByPlaceholderText('เช่น เงินเดือนมกราคม 2568');

      fireEvent.change(startDateInput, { target: { value: '2025-02-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-02-28' } });
      fireEvent.change(nameInput, { target: { value: 'Test Cycle' } });

      const submitButton = screen.getByText('สร้างรอบ');
      fireEvent.click(submitButton);

      // Check for Thai API error message
      await waitFor(() => {
        expect(screen.getByText('ช่วงวันที่ทับซ้อนกับรอบการจ่ายเงินเดือนที่มีอยู่แล้ว')).toBeInTheDocument();
      });
    });

    test('should display Thai generic error message for unexpected errors', async () => {
      const { PayrollService } = await import('@/features/payroll/services/payroll.service');
      vi.mocked(PayrollService.createPayrollCycle).mockRejectedValue(new Error('Network error'));

      render(<CreatePayrollCycle />);

      // Fill and submit form
      const startDateInput = screen.getByLabelText('วันที่เริ่มต้น *');
      const endDateInput = screen.getByLabelText('วันที่สิ้นสุด *');
      const nameInput = screen.getByPlaceholderText('เช่น เงินเดือนมกราคม 2568');

      fireEvent.change(startDateInput, { target: { value: '2025-02-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-02-28' } });
      fireEvent.change(nameInput, { target: { value: 'Test Cycle' } });

      const submitButton = screen.getByText('สร้างรอบ');
      fireEvent.click(submitButton);

      // Check for Thai generic error message
      await waitFor(() => {
        expect(screen.getByText('เกิดข้อผิดพลาดที่ไม่คาดคิด')).toBeInTheDocument();
      });
    });
  });

  describe('Thai Cancel Button Text', () => {
    test('should display Thai cancel button when onCancel prop is provided', () => {
      const mockCancel = vi.fn();
      render(<CreatePayrollCycle onCancel={mockCancel} />);

      expect(screen.getByText('ยกเลิก')).toBeInTheDocument();
    });

    test('should call onCancel when Thai cancel button is clicked', () => {
      const mockCancel = vi.fn();
      render(<CreatePayrollCycle onCancel={mockCancel} />);

      const cancelButton = screen.getByText('ยกเลิก');
      fireEvent.click(cancelButton);

      expect(mockCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Thai Buddhist Era Date Support', () => {
    test('should support Thai Buddhist Era year in form inputs', () => {
      render(<CreatePayrollCycle />);

      // Check that the placeholder suggests Buddhist Era year (2568)
      const nameInput = screen.getByPlaceholderText('เช่น เงินเดือนมกราคม 2568');
      expect(nameInput).toBeInTheDocument();
      
      // The text contains Buddhist Era year 2568 (which is 2025 in Gregorian calendar)
      expect(screen.getByText(/2568/)).toBeInTheDocument();
    });

    test('should generate Thai cycle names with Buddhist Era years', async () => {
      const { generatePayrollCycleName } = await import('@/features/payroll/utils/payroll-calculation.utils');
      vi.mocked(generatePayrollCycleName).mockReturnValue('เงินเดือนมกราคม 2568');

      render(<CreatePayrollCycle />);

      // Fill dates to trigger auto-generation
      const startDateInput = screen.getByLabelText('วันที่เริ่มต้น *');
      const endDateInput = screen.getByLabelText('วันที่สิ้นสุด *');

      fireEvent.change(startDateInput, { target: { value: '2025-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-01-31' } });

      // Check that the name input was populated with Thai text including Buddhist Era year
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('เงินเดือนมกราคม 2568');
        expect(nameInput).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility - Thai Language Support', () => {
    test('should have proper Thai labels for screen readers', () => {
      render(<CreatePayrollCycle />);

      // Check aria-labels and labels are in Thai
      const startDateInput = screen.getByLabelText('วันที่เริ่มต้น *');
      expect(startDateInput).toHaveAttribute('id', 'start_date');
      
      const endDateInput = screen.getByLabelText('วันที่สิ้นสุด *');
      expect(endDateInput).toHaveAttribute('id', 'end_date');
      
      const nameInput = screen.getByLabelText('ชื่อรอบการจ่ายเงินเดือน *');
      expect(nameInput).toHaveAttribute('id', 'name');
    });

    test('should maintain Thai error message association with form fields', async () => {
      render(<CreatePayrollCycle />);

      const submitButton = screen.getByText('สร้างรอบ');
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Check that Thai error messages are displayed
        expect(screen.getByText('กรุณากรอกชื่อรอบการจ่ายเงินเดือน')).toBeInTheDocument();
        expect(screen.getByText('กรุณาเลือกวันที่เริ่มต้น')).toBeInTheDocument();
        expect(screen.getByText('กรุณาเลือกวันที่สิ้นสุด')).toBeInTheDocument();

        // Verify error styling is applied to inputs (Thai context maintained)
        const startDateInput = screen.getByLabelText('วันที่เริ่มต้น *');
        const endDateInput = screen.getByLabelText('วันที่สิ้นสุด *');
        const nameInput = screen.getByLabelText('ชื่อรอบการจ่ายเงินเดือน *');
        
        expect(startDateInput).toHaveClass('border-red-500');
        expect(endDateInput).toHaveClass('border-red-500');
        expect(nameInput).toHaveClass('border-red-500');
      });
    });
  });
});
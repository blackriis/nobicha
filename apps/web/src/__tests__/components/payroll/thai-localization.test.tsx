/**
 * Thai Localization Tests for Payroll Components
 * Tests AC 9: UI must support Thai language and display error messages in Thai
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import CreatePayrollCycle from '@/features/payroll/components/CreatePayrollCycle';
import PayrollCycleList from '@/features/payroll/components/PayrollCycleList';
import PayrollCalculationPreview from '@/features/payroll/components/PayrollCalculationPreview';
import PayrollSummary from '@/features/payroll/components/PayrollSummary';

// Mock the payroll service
vi.mock('@/features/payroll/services/payroll.service', () => ({
 PayrollService: {
  createPayrollCycle: vi.fn(),
  getAllPayrollCycles: vi.fn(),
  calculatePayroll: vi.fn(),
 }
}));

describe('Thai Localization Tests', () => {
 describe('CreatePayrollCycle Component', () => {
  test('should display Thai labels and placeholders', () => {
   render(<CreatePayrollCycle />);

   // Check for Thai labels
   expect(screen.getByText('สร้างรอบการจ่ายเงินเดือนใหม่')).toBeInTheDocument();
   expect(screen.getByText('วันที่เริ่มต้น *')).toBeInTheDocument();
   expect(screen.getByText('วันที่สิ้นสุด *')).toBeInTheDocument();
   expect(screen.getByText('ชื่อรอบการจ่ายเงินเดือน *')).toBeInTheDocument();

   // Check for Thai placeholder
   const nameInput = screen.getByPlaceholderText('เช่น เงินเดือนมกราคม 2568');
   expect(nameInput).toBeInTheDocument();

   // Check for Thai button text
   expect(screen.getByText('สร้างรอบ')).toBeInTheDocument();
   expect(screen.getByText('เดือนปัจจุบัน')).toBeInTheDocument();
   expect(screen.getByText('ทั้งเดือน')).toBeInTheDocument();
   expect(screen.getByText('สร้างชื่ออัตโนมัติ')).toBeInTheDocument();
  });

  test('should display Thai validation error messages', async () => {
   render(<CreatePayrollCycle />);

   const submitButton = screen.getByText('สร้างรอบ');
   fireEvent.click(submitButton);

   await waitFor(() => {
    expect(screen.getByText('กรุณากรอกชื่อรอบการจ่ายเงินเดือน')).toBeInTheDocument();
    expect(screen.getByText('กรุณาเลือกวันที่เริ่มต้น')).toBeInTheDocument();
    expect(screen.getByText('กรุณาเลือกวันที่สิ้นสุด')).toBeInTheDocument();
   });
  });

  test('should display Thai date range validation error', async () => {
   render(<CreatePayrollCycle />);

   const startDateInput = screen.getByLabelText('วันที่เริ่มต้น *');
   const endDateInput = screen.getByLabelText('วันที่สิ้นสุด *');
   const nameInput = screen.getByPlaceholderText('เช่น เงินเดือนมกราคม 2568');

   // Set invalid date range (end date before start date)
   fireEvent.change(startDateInput, { target: { value: '2025-02-15' } });
   fireEvent.change(endDateInput, { target: { value: '2025-02-10' } });
   fireEvent.change(nameInput, { target: { value: 'Test Cycle' } });

   const submitButton = screen.getByText('สร้างรอบ');
   fireEvent.click(submitButton);

   await waitFor(() => {
    expect(screen.getByText('ช่วงวันที่ไม่ถูกต้อง')).toBeInTheDocument();
   });
  });

  test('should display Thai loading state', async () => {
   const mockCreatePayrollCycle = vi.fn().mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve({ success: true, data: { payroll_cycle: { id: '123' } } }), 100))
   );

   vi.mocked(await import('@/features/payroll/services/payroll.service')).PayrollService.createPayrollCycle = mockCreatePayrollCycle;

   render(<CreatePayrollCycle />);

   const startDateInput = screen.getByLabelText('วันที่เริ่มต้น *');
   const endDateInput = screen.getByLabelText('วันที่สิ้นสุด *');
   const nameInput = screen.getByPlaceholderText('เช่น เงินเดือนมกราคม 2568');

   fireEvent.change(startDateInput, { target: { value: '2025-02-01' } });
   fireEvent.change(endDateInput, { target: { value: '2025-02-28' } });
   fireEvent.change(nameInput, { target: { value: 'เงินเดือนกุมภาพันธ์ 2568' } });

   const submitButton = screen.getByText('สร้างรอบ');
   fireEvent.click(submitButton);

   expect(screen.getByText('กำลังสร้าง...')).toBeInTheDocument();
  });
 });

 describe('PayrollCycleList Component', () => {
  const mockCycles = [
   {
    id: '1',
    name: 'เงินเดือนมกราคม 2568',
    start_date: '2025-01-01',
    end_date: '2025-01-31',
    status: 'active' as const,
    created_at: '2025-01-01T00:00:00Z'
   },
   {
    id: '2',
    name: 'เงินเดือนธันวาคม 2567',
    start_date: '2024-12-01',
    end_date: '2024-12-31',
    status: 'completed' as const,
    created_at: '2024-12-01T00:00:00Z'
   }
  ];

  test('should display Thai headers and status labels', () => {
   render(<PayrollCycleList cycles={mockCycles} onCalculate={() => {}} onView={() => {}} />);

   // Check Thai column headers
   expect(screen.getByText('ชื่อรอบ')).toBeInTheDocument();
   expect(screen.getByText('ช่วงเวลา')).toBeInTheDocument();
   expect(screen.getByText('สถานะ')).toBeInTheDocument();
   expect(screen.getByText('การดำเนินการ')).toBeInTheDocument();

   // Check Thai status labels
   expect(screen.getByText('กำลังดำเนินการ')).toBeInTheDocument();
   expect(screen.getByText('เสร็จสิ้น')).toBeInTheDocument();
  });

  test('should display Thai action button text', () => {
   render(<PayrollCycleList cycles={mockCycles} onCalculate={() => {}} onView={() => {}} />);

   expect(screen.getByText('คำนวณ')).toBeInTheDocument();
   expect(screen.getByText('ดูรายละเอียด')).toBeInTheDocument();
  });

  test('should display Thai empty state message', () => {
   render(<PayrollCycleList cycles={[]} onCalculate={() => {}} onView={() => {}} />);

   expect(screen.getByText('ยังไม่มีรอบการจ่ายเงินเดือน')).toBeInTheDocument();
   expect(screen.getByText('สร้างรอบการจ่ายเงินเดือนแรกเพื่อเริ่มต้นการจัดการเงินเดือนของพนักงาน')).toBeInTheDocument();
  });
 });

 describe('PayrollCalculationPreview Component', () => {
  const mockPreviewData = {
   payroll_cycle: {
    id: '1',
    name: 'เงินเดือนมกราคม 2568',
    start_date: '2025-01-01',
    end_date: '2025-01-31',
    status: 'active' as const
   },
   calculation_summary: {
    total_employees: 3,
    total_base_pay: 45000,
    calculation_period: {
     start_date: '2025-01-01',
     end_date: '2025-01-31'
    }
   },
   employee_calculations: [
    {
     employee_id: '1',
     full_name: 'สมชาย ใจดี',
     total_hours: 160,
     total_days_worked: 20,
     base_pay: 15000,
     calculation_method: 'hourly' as const
    }
   ]
  };

  test('should display Thai summary labels', () => {
   render(
    <PayrollCalculationPreview 
     previewData={mockPreviewData} 
     onConfirm={() => {}} 
     onCancel={() => {}} 
     isLoading={false} 
    />
   );

   expect(screen.getByText('ตรวจสอบการคำนวณเงินเดือน')).toBeInTheDocument();
   expect(screen.getByText('สรุปการคำนวณ')).toBeInTheDocument();
   expect(screen.getByText('จำนวนพนักงาน:')).toBeInTheDocument();
   expect(screen.getByText('ค่าแรงพื้นฐานรวม:')).toBeInTheDocument();
   expect(screen.getByText('รายละเอียดพนักงาน')).toBeInTheDocument();
  });

  test('should display Thai employee calculation headers', () => {
   render(
    <PayrollCalculationPreview 
     previewData={mockPreviewData} 
     onConfirm={() => {}} 
     onCancel={() => {}} 
     isLoading={false} 
    />
   );

   expect(screen.getByText('ชื่อพนักงาน')).toBeInTheDocument();
   expect(screen.getByText('จำนวนชั่วโมง')).toBeInTheDocument();
   expect(screen.getByText('จำนวนวัน')).toBeInTheDocument();
   expect(screen.getByText('ค่าแรงพื้นฐาน')).toBeInTheDocument();
   expect(screen.getByText('วิธีคำนวณ')).toBeInTheDocument();
  });

  test('should display Thai action buttons', () => {
   render(
    <PayrollCalculationPreview 
     previewData={mockPreviewData} 
     onConfirm={() => {}} 
     onCancel={() => {}} 
     isLoading={false} 
    />
   );

   expect(screen.getByText('ยกเลิก')).toBeInTheDocument();
   expect(screen.getByText('บันทึกการคำนวณ')).toBeInTheDocument();
  });

  test('should display Thai loading state for confirmation', () => {
   render(
    <PayrollCalculationPreview 
     previewData={mockPreviewData} 
     onConfirm={() => {}} 
     onCancel={() => {}} 
     isLoading={true} 
    />
   );

   expect(screen.getByText('กำลังบันทึก...')).toBeInTheDocument();
  });
 });

 describe('PayrollSummary Component', () => {
  const mockSummaryData = {
   payroll_cycle: {
    id: '1',
    name: 'เงินเดือนมกราคม 2568',
    start_date: '2025-01-01',
    end_date: '2025-01-31',
    status: 'completed' as const
   },
   calculation_summary: {
    total_employees: 3,
    total_base_pay: 45000,
    calculation_period: {
     start_date: '2025-01-01',
     end_date: '2025-01-31'
    }
   },
   employee_calculations: [
    {
     employee_id: '1',
     full_name: 'สมชาย ใจดี',
     total_hours: 160,
     total_days_worked: 20,
     base_pay: 15000,
     calculation_method: 'hourly' as const
    }
   ]
  };

  test('should display Thai summary title and labels', () => {
   render(<PayrollSummary summaryData={mockSummaryData} onClose={() => {}} />);

   expect(screen.getByText('สรุปผลการคำนวณเงินเดือน')).toBeInTheDocument();
   expect(screen.getByText('ข้อมูลรอบการจ่ายเงินเดือน')).toBeInTheDocument();
   expect(screen.getByText('ชื่อรอบ:')).toBeInTheDocument();
   expect(screen.getByText('ช่วงเวลา:')).toBeInTheDocument();
   expect(screen.getByText('สถานะ:')).toBeInTheDocument();
  });

  test('should display Thai currency formatting', () => {
   render(<PayrollSummary summaryData={mockSummaryData} onClose={() => {}} />);

   // Check that amounts are displayed with Thai currency format (฿)
   expect(screen.getByText('฿45,000.00')).toBeInTheDocument();
   expect(screen.getByText('฿15,000.00')).toBeInTheDocument();
  });

  test('should display Thai calculation method labels', () => {
   const mockDataWithMixedMethod = {
    ...mockSummaryData,
    employee_calculations: [
     ...mockSummaryData.employee_calculations,
     {
      employee_id: '2',
      full_name: 'สมหญิง ใจงาม',
      total_hours: 200,
      total_days_worked: 15,
      base_pay: 18000,
      calculation_method: 'daily' as const
     },
     {
      employee_id: '3',
      full_name: 'สมศักดิ์ ขยัน',
      total_hours: 180,
      total_days_worked: 18,
      base_pay: 12000,
      calculation_method: 'mixed' as const
     }
    ]
   };

   render(<PayrollSummary summaryData={mockDataWithMixedMethod} onClose={() => {}} />);

   expect(screen.getByText('รายชั่วโมง')).toBeInTheDocument();
   expect(screen.getByText('รายวัน')).toBeInTheDocument();
   expect(screen.getByText('ผสม')).toBeInTheDocument();
  });
 });

 describe('Error Messages Thai Localization', () => {
  test('should display Thai error messages for API failures', async () => {
   const mockCreatePayrollCycle = vi.fn().mockResolvedValue({
    success: false,
    error: 'ช่วงวันที่ทับซ้อนกับรอบการจ่ายเงินเดือนที่มีอยู่แล้ว'
   });

   vi.mocked(await import('@/features/payroll/services/payroll.service')).PayrollService.createPayrollCycle = mockCreatePayrollCycle;

   render(<CreatePayrollCycle />);

   // Fill form with valid data
   fireEvent.change(screen.getByLabelText('วันที่เริ่มต้น *'), { target: { value: '2025-02-01' } });
   fireEvent.change(screen.getByLabelText('วันที่สิ้นสุด *'), { target: { value: '2025-02-28' } });
   fireEvent.change(screen.getByPlaceholderText('เช่น เงินเดือนมกราคม 2568'), { target: { value: 'Test' } });

   fireEvent.click(screen.getByText('สร้างรอบ'));

   await waitFor(() => {
    expect(screen.getByText('ช่วงวันที่ทับซ้อนกับรอบการจ่ายเงินเดือนที่มีอยู่แล้ว')).toBeInTheDocument();
   });
  });

  test('should display Thai generic error message for unexpected errors', async () => {
   const mockCreatePayrollCycle = vi.fn().mockRejectedValue(new Error('Network error'));

   vi.mocked(await import('@/features/payroll/services/payroll.service')).PayrollService.createPayrollCycle = mockCreatePayrollCycle;

   render(<CreatePayrollCycle />);

   // Fill form with valid data
   fireEvent.change(screen.getByLabelText('วันที่เริ่มต้น *'), { target: { value: '2025-02-01' } });
   fireEvent.change(screen.getByLabelText('วันที่สิ้นสุด *'), { target: { value: '2025-02-28' } });
   fireEvent.change(screen.getByPlaceholderText('เช่น เงินเดือนมกราคม 2568'), { target: { value: 'Test' } });

   fireEvent.click(screen.getByText('สร้างรอบ'));

   await waitFor(() => {
    expect(screen.getByText('เกิดข้อผิดพลาดที่ไม่คาดคิด')).toBeInTheDocument();
   });
  });
 });

 describe('Thai Date and Number Formatting', () => {
  test('should format Thai Buddhist Era dates correctly', () => {
   const mockCycles = [
    {
     id: '1',
     name: 'เงินเดือนมกราคม 2568',
     start_date: '2025-01-01',
     end_date: '2025-01-31',
     status: 'active' as const,
     created_at: '2025-01-01T00:00:00Z'
    }
   ];

   render(<PayrollCycleList cycles={mockCycles} onCalculate={() => {}} onView={() => {}} />);

   // Check that Buddhist Era year (2568) is displayed correctly
   expect(screen.getByText(/2568/)).toBeInTheDocument();
  });

  test('should format Thai currency with proper locale', () => {
   const mockSummaryData = {
    payroll_cycle: {
     id: '1',
     name: 'เงินเดือนมกราคม 2568',
     start_date: '2025-01-01',
     end_date: '2025-01-31',
     status: 'completed' as const
    },
    calculation_summary: {
     total_employees: 1,
     total_base_pay: 123456.78,
     calculation_period: {
      start_date: '2025-01-01',
      end_date: '2025-01-31'
     }
    },
    employee_calculations: []
   };

   render(<PayrollSummary summaryData={mockSummaryData} onClose={() => {}} />);

   // Check Thai number formatting with proper thousand separators
   expect(screen.getByText('฿123,456.78')).toBeInTheDocument();
  });
 });
});
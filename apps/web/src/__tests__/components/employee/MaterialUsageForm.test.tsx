import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MaterialUsageForm } from '@/components/employee/MaterialUsageForm'
import { materialUsageService } from '@/lib/services/material-usage.service'

// Mock the service
vi.mock('@/lib/services/material-usage.service', () => ({
  materialUsageService: {
    getCurrentSessionUsage: vi.fn(),
    getAvailableRawMaterials: vi.fn(),
    submitMaterialUsage: vi.fn(),
    formatCurrency: vi.fn((amount) => `฿${amount.toFixed(2)}`),
    formatDateShort: vi.fn((date) => '01/01/2568 10:30'),
  }
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock AuthProvider
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isAdmin: false
  })
}))

// Mock MaterialSelector
vi.mock('@/components/employee/MaterialSelector', () => ({
  MaterialSelector: ({ onMaterialsChange }: { 
    selectedMaterials: Array<{raw_material_id: string, quantity_used: number}>, 
    onMaterialsChange: (materials: Array<{raw_material_id: string, quantity_used: number}>) => void 
  }) => (
    <div data-testid="material-selector">
      <button onClick={() => onMaterialsChange([])}>
        เพิ่มวัตถุดิบ
      </button>
      <input placeholder="ค้นหาวัตถุดิบ..." />
      <div>น้ำมันพืช</div>
      <div>เกลือ</div>
    </div>
  )
}))

// Mock UsageSummary
interface MockUsageRecord {
  id: string;
  raw_materials: { name: string };
}

vi.mock('@/components/employee/UsageSummary', () => ({
  UsageSummary: ({ records }: { records: MockUsageRecord[] }) => (
    <div data-testid="usage-summary">
      {records.map((record: MockUsageRecord) => (
        <div key={record.id}>{record.raw_materials.name}</div>
      ))}
    </div>
  )
}))

// Mock SubmissionConfirmation
vi.mock('@/components/employee/SubmissionConfirmation', () => ({
  SubmissionConfirmation: ({ isOpen, onClose, onConfirm }: { 
    isOpen: boolean, 
    onClose: () => void, 
    onConfirm: () => void 
  }) => 
    isOpen ? (
      <div data-testid="submission-confirmation">
        <button onClick={onConfirm}>ยืนยัน</button>
        <button onClick={onClose}>ยกเลิก</button>
      </div>
    ) : null
}))

const mockMaterialUsageService = materialUsageService as {
  getCurrentSessionUsage: ReturnType<typeof vi.fn>;
  getAvailableRawMaterials: ReturnType<typeof vi.fn>;
  submitMaterialUsage: ReturnType<typeof vi.fn>;
  formatCurrency: ReturnType<typeof vi.fn>;
  formatDateShort: ReturnType<typeof vi.fn>;
}

describe('MaterialUsageForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Loading States', () => {
    it('should show loading message while fetching session data', async () => {
      mockMaterialUsageService.getCurrentSessionUsage.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: null }), 100))
      )

      render(<MaterialUsageForm />)

      expect(screen.getByText('กำลังโหลดข้อมูลเซสชัน...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('กำลังโหลดข้อมูลเซสชัน...')).not.toBeInTheDocument()
      })
    })

    it('should show error state when session loading fails', async () => {
      const errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูล'
      mockMaterialUsageService.getCurrentSessionUsage.mockResolvedValueOnce({
        success: false,
        error: errorMessage
      })

      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'ลองใหม่' })).toBeInTheDocument()
      })
    })
  })

  describe('No Active Session', () => {
    it('should show no active session message when no time entry found', async () => {
      mockMaterialUsageService.getCurrentSessionUsage.mockResolvedValueOnce({
        success: true,
        data: {
          has_active_session: false,
          message: 'ไม่พบการเช็คอินที่ยังไม่ได้เช็คเอาท์'
        }
      })

      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.getByText('ไม่พบการเช็คอิน')).toBeInTheDocument()
        expect(screen.getByText('ไม่พบการเช็คอินที่ยังไม่ได้เช็คเอาท์')).toBeInTheDocument()
      })
    })
  })

  describe('Active Session with No Existing Records', () => {
    beforeEach(async () => {
      mockMaterialUsageService.getCurrentSessionUsage.mockResolvedValueOnce({
        success: true,
        data: {
          has_active_session: true,
          time_entry_id: 'time-entry-1',
          records: [],
          total_cost: 0,
          can_add_materials: true
        }
      })

      mockMaterialUsageService.getAvailableRawMaterials.mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'material-1',
            name: 'น้ำมันพืช',
            unit: 'ลิตร',
            cost_per_unit: 25.50,
            created_at: '2025-01-01T00:00:00Z'
          },
          {
            id: 'material-2',
            name: 'เกลือ',
            unit: 'กิโลกรัม',
            cost_per_unit: 15.00,
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      })
    })

    it('should show active session status', async () => {
      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.getByText('เซสชันการทำงานปัจจุบัน')).toBeInTheDocument()
        expect(screen.getByText('คุณสามารถรายงานการใช้วัตถุดิบได้')).toBeInTheDocument()
      })
    })

    it('should show material selection interface', async () => {
      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.getByText('รายงานการใช้วัตถุดิบ')).toBeInTheDocument()
        expect(screen.getByText('เลือกวัตถุดิบ')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })).toBeInTheDocument()
      })
    })

    it('should allow adding materials', async () => {
      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })).toBeInTheDocument()
      })

      // Click add material button
      const addButton = screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('ค้นหาวัตถุดิบ...')).toBeInTheDocument()
        expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
        expect(screen.getByText('เกลือ')).toBeInTheDocument()
      })
    })

    it('should search materials correctly', async () => {
      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })).toBeInTheDocument()
      })

      // Open material selection
      const addButton = screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('ค้นหาวัตถุดิบ...')).toBeInTheDocument()
      })

      // Search for oil
      const searchInput = screen.getByPlaceholderText('ค้นหาวัตถุดิบ...')
      fireEvent.change(searchInput, { target: { value: 'น้ำมัน' } })

      await waitFor(() => {
        expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
        expect(screen.queryByText('เกลือ')).not.toBeInTheDocument()
      })
    })
  })

  describe('Active Session with Existing Records', () => {
    beforeEach(async () => {
      mockMaterialUsageService.getCurrentSessionUsage.mockResolvedValueOnce({
        success: true,
        data: {
          has_active_session: true,
          time_entry_id: 'time-entry-1',
          records: [
            {
              id: 'usage-1',
              time_entry_id: 'time-entry-1',
              material_id: 'material-1',
              quantity_used: 2.5,
              created_at: '2025-01-01T10:00:00Z',
              raw_materials: {
                id: 'material-1',
                name: 'น้ำมันพืช',
                unit: 'ลิตร',
                cost_per_unit: 25.50
              }
            }
          ],
          total_cost: 63.75,
          can_add_materials: true
        }
      })

      mockMaterialUsageService.getAvailableRawMaterials.mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'material-2',
            name: 'เกลือ',
            unit: 'กิโลกรัม',
            cost_per_unit: 15.00,
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      })
    })

    it('should show existing records', async () => {
      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.getByText('การใช้วัตถุดิบที่บันทึกไว้แล้ว')).toBeInTheDocument()
        expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
      })
    })

    it('should show option to add more materials', async () => {
      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.getByText('เพิ่มวัตถุดิบเพิ่มเติม')).toBeInTheDocument()
      })
    })
  })

  describe('Read-only State', () => {
    beforeEach(async () => {
      mockMaterialUsageService.getCurrentSessionUsage.mockResolvedValueOnce({
        success: true,
        data: {
          has_active_session: true,
          time_entry_id: 'time-entry-1',
          records: [
            {
              id: 'usage-1',
              time_entry_id: 'time-entry-1',
              material_id: 'material-1',
              quantity_used: 2.5,
              created_at: '2025-01-01T10:00:00Z',
              raw_materials: {
                id: 'material-1',
                name: 'น้ำมันพืช',
                unit: 'ลิตร',
                cost_per_unit: 25.50
              }
            }
          ],
          total_cost: 63.75,
          can_add_materials: false
        }
      })
    })

    it('should show read-only message when cannot add materials', async () => {
      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.getByText('การรายงานถูกปิดใช้งาน')).toBeInTheDocument()
        expect(screen.getByText('ไม่สามารถเพิ่มหรือแก้ไขการใช้วัตถุดิบในเซสชันปัจจุบันได้')).toBeInTheDocument()
      })
    })

    it('should not show add material interface', async () => {
      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'เพิ่มวัตถุดิบ' })).not.toBeInTheDocument()
      })
    })
  })

  describe('Retry Functionality', () => {
    it('should retry loading session data when retry button is clicked', async () => {
      // First call fails
      mockMaterialUsageService.getCurrentSessionUsage
        .mockResolvedValueOnce({
          success: false,
          error: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            has_active_session: false,
            message: 'ไม่พบการเช็คอิน'
          }
        })

      render(<MaterialUsageForm />)

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('เกิดข้อผิดพลาดในการดึงข้อมูล')).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByRole('button', { name: 'ลองใหม่' })
      fireEvent.click(retryButton)

      // Should show loading then success
      expect(screen.getByText('กำลังโหลดข้อมูลเซสชัน...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('ไม่พบการเช็คอิน')).toBeInTheDocument()
      })

      expect(mockMaterialUsageService.getCurrentSessionUsage).toHaveBeenCalledTimes(2)
    })
  })
})
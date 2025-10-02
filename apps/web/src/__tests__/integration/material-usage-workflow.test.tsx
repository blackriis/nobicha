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
    formatDate: vi.fn((date) => 'วันที่ 1 มกราคม 2568 เวลา 10:30'),
    formatDateShort: vi.fn((date) => '01/01/2568 10:30'),
    calculateTotalCost: vi.fn((records) => 
      records.reduce((sum: number, record: any) => sum + (record.quantity_used * record.raw_materials.cost_per_unit), 0)
    )
  }
}))

// Mock sonner toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn()
}

vi.mock('sonner', () => ({
  toast: mockToast
}))

const mockMaterialUsageService = materialUsageService as any

describe('Material Usage Complete Workflow Integration', () => {
  const mockSessionData = {
    has_active_session: true,
    time_entry_id: 'time-entry-1',
    records: [],
    total_cost: 0,
    can_add_materials: true
  }

  const mockAvailableMaterials = [
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
    },
    {
      id: 'material-3',
      name: 'น้ำตาล',
      unit: 'กิโลกรัม',
      cost_per_unit: 20.00,
      created_at: '2025-01-01T00:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful session loading
    mockMaterialUsageService.getCurrentSessionUsage.mockResolvedValue({
      success: true,
      data: mockSessionData
    })

    // Default successful materials loading
    mockMaterialUsageService.getAvailableRawMaterials.mockResolvedValue({
      success: true,
      data: mockAvailableMaterials
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Complete Material Usage Reporting Workflow', () => {
    it('should complete full workflow: load session → select materials → submit → success', async () => {
      // Mock successful submission
      const mockSubmissionResult = {
        records: [
          {
            id: 'usage-1',
            time_entry_id: 'time-entry-1',
            raw_material_id: 'material-1',
            quantity_used: 2.5,
            created_at: '2025-01-01T10:00:00Z',
            raw_materials: {
              id: 'material-1',
              name: 'น้ำมันพืช',
              unit: 'ลิตร',
              cost_per_unit: 25.50
            }
          },
          {
            id: 'usage-2',
            time_entry_id: 'time-entry-1',
            raw_material_id: 'material-2',
            quantity_used: 1.0,
            created_at: '2025-01-01T10:05:00Z',
            raw_materials: {
              id: 'material-2',
              name: 'เกลือ',
              unit: 'กิโลกรัม',
              cost_per_unit: 15.00
            }
          }
        ],
        total_cost: 78.75,
        time_entry_id: 'time-entry-1'
      }

      mockMaterialUsageService.submitMaterialUsage.mockResolvedValueOnce({
        success: true,
        data: mockSubmissionResult
      })

      // Re-load session after submission (simulating refresh)
      mockMaterialUsageService.getCurrentSessionUsage.mockResolvedValueOnce({
        success: true,
        data: {
          ...mockSessionData,
          records: mockSubmissionResult.records,
          total_cost: mockSubmissionResult.total_cost
        }
      })

      render(<MaterialUsageForm />)

      // Step 1: Verify session is loaded
      await waitFor(() => {
        expect(screen.getByText('เซสชันการทำงานปัจจุบัน')).toBeInTheDocument()
        expect(screen.getByText('รายงานการใช้วัตถุดิบ')).toBeInTheDocument()
      })

      // Step 2: Open material selection
      const addButton = screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
        expect(screen.getByText('เกลือ')).toBeInTheDocument()
      })

      // Step 3: Select first material (น้ำมันพืช)
      const oilMaterial = screen.getByText('น้ำมันพืช').closest('div')
      expect(oilMaterial).toBeInTheDocument()
      fireEvent.click(oilMaterial!)

      await waitFor(() => {
        expect(screen.getByText('วัตถุดิบที่เลือก')).toBeInTheDocument()
      })

      // Step 4: Set quantity for first material
      const quantityInputs = screen.getAllByDisplayValue('1')
      fireEvent.change(quantityInputs[0], { target: { value: '2.5' } })

      // Step 5: Add second material
      const addMoreButton = screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })
      fireEvent.click(addMoreButton)

      await waitFor(() => {
        expect(screen.getByText('เกลือ')).toBeInTheDocument()
      })

      // Select salt
      const saltMaterial = screen.getByText('เกลือ').closest('div')
      fireEvent.click(saltMaterial!)

      await waitFor(() => {
        const quantityInputsUpdated = screen.getAllByRole('spinbutton')
        expect(quantityInputsUpdated).toHaveLength(2)
      })

      // Step 6: Set quantity for second material
      const allQuantityInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(allQuantityInputs[1], { target: { value: '1' } })

      // Step 7: Submit the materials
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: 'บันทึกการใช้วัตถุดิบ' })
        expect(submitButton).toBeInTheDocument()
        expect(submitButton).not.toBeDisabled()
      })

      const submitButton = screen.getByRole('button', { name: 'บันทึกการใช้วัตถุดิบ' })
      fireEvent.click(submitButton)

      // Step 8: Verify confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('ยืนยันการบันทึกการใช้วัตถุดิบ')).toBeInTheDocument()
        expect(screen.getByText('รายการวัตถุดิบที่จะบันทึก')).toBeInTheDocument()
      })

      // Step 9: Confirm submission
      const confirmButton = screen.getByRole('button', { name: 'ยืนยันบันทึก' })
      fireEvent.click(confirmButton)

      // Step 10: Verify submission call
      await waitFor(() => {
        expect(mockMaterialUsageService.submitMaterialUsage).toHaveBeenCalledWith({
          materials: [
            { raw_material_id: 'material-1', quantity_used: 2.5 },
            { raw_material_id: 'material-2', quantity_used: 1 }
          ]
        })
      })

      // Step 11: Verify success state
      await waitFor(() => {
        expect(screen.getByText('บันทึกการใช้วัตถุดิบสำเร็จ')).toBeInTheDocument()
        expect(mockToast.success).toHaveBeenCalledWith('บันทึกการใช้วัตถุดิบสำเร็จ')
      })
    })

    it('should handle validation errors during submission', async () => {
      render(<MaterialUsageForm />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })).toBeInTheDocument()
      })

      // Add material with invalid quantity
      const addButton = screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
      })

      const oilMaterial = screen.getByText('น้ำมันพืช').closest('div')
      fireEvent.click(oilMaterial!)

      await waitFor(() => {
        expect(screen.getByRole('spinbutton')).toBeInTheDocument()
      })

      // Set invalid quantity (0)
      const quantityInput = screen.getByRole('spinbutton')
      fireEvent.change(quantityInput, { target: { value: '0' } })

      // Try to submit
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: 'บันทึกการใช้วัตถุดิบ' })
        expect(submitButton).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: 'บันทึกการใช้วัตถุดิบ' })
      fireEvent.click(submitButton)

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('กรุณาแก้ไขข้อผิดพลาด:')).toBeInTheDocument()
        expect(mockToast.error).toHaveBeenCalledWith('กรุณาแก้ไขข้อผิดพลาดก่อนบันทึก')
      })

      // Should not call submit service
      expect(mockMaterialUsageService.submitMaterialUsage).not.toHaveBeenCalled()
    })

    it('should handle API errors during submission', async () => {
      // Mock API error
      mockMaterialUsageService.submitMaterialUsage.mockResolvedValueOnce({
        success: false,
        error: 'เกิดข้อผิดพลาดในการบันทึก'
      })

      render(<MaterialUsageForm />)

      // Add valid material
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
      })

      const oilMaterial = screen.getByText('น้ำมันพืช').closest('div')
      fireEvent.click(oilMaterial!)

      await waitFor(() => {
        expect(screen.getByRole('spinbutton')).toBeInTheDocument()
      })

      // Set valid quantity
      const quantityInput = screen.getByRole('spinbutton')
      fireEvent.change(quantityInput, { target: { value: '2.5' } })

      // Submit
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: 'บันทึกการใช้วัตถุดิบ' })
        expect(submitButton).not.toBeDisabled()
      })

      const submitButton = screen.getByRole('button', { name: 'บันทึกการใช้วัตถุดิบ' })
      fireEvent.click(submitButton)

      // Confirm
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'ยืนยันบันทึก' })).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: 'ยืนยันบันทึก' })
      fireEvent.click(confirmButton)

      // Should show error message
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('เกิดข้อผิดพลาดในการบันทึก')
      })
    })

    it('should handle search and filter materials correctly', async () => {
      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })).toBeInTheDocument()
      })

      // Open material selection
      const addButton = screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('ค้นหาวัตถุดิบ...')).toBeInTheDocument()
        expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
        expect(screen.getByText('เกลือ')).toBeInTheDocument()
        expect(screen.getByText('น้ำตาล')).toBeInTheDocument()
      })

      // Search for materials containing "น้ำ"
      const searchInput = screen.getByPlaceholderText('ค้นหาวัตถุดิบ...')
      fireEvent.change(searchInput, { target: { value: 'น้ำ' } })

      await waitFor(() => {
        expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
        expect(screen.getByText('น้ำตาล')).toBeInTheDocument()
        expect(screen.queryByText('เกลือ')).not.toBeInTheDocument()
      })

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } })

      await waitFor(() => {
        expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
        expect(screen.getByText('เกลือ')).toBeInTheDocument()
        expect(screen.getByText('น้ำตาล')).toBeInTheDocument()
      })

      // Select one material and verify it's filtered out from available list
      const oilMaterial = screen.getByText('น้ำมันพืช').closest('div')
      fireEvent.click(oilMaterial!)

      // Open selection again
      const addMoreButton = screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })
      fireEvent.click(addMoreButton)

      await waitFor(() => {
        expect(screen.queryByText('น้ำมันพืช')).not.toBeInTheDocument() // Already selected
        expect(screen.getByText('เกลือ')).toBeInTheDocument()
        expect(screen.getByText('น้ำตาล')).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery Workflows', () => {
    it('should recover from network errors', async () => {
      // First session load fails
      mockMaterialUsageService.getCurrentSessionUsage
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          data: mockSessionData
        })

      render(<MaterialUsageForm />)

      // Should show error state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'ลองใหม่' })).toBeInTheDocument()
      })

      // Retry
      const retryButton = screen.getByRole('button', { name: 'ลองใหม่' })
      fireEvent.click(retryButton)

      // Should recover and show normal interface
      await waitFor(() => {
        expect(screen.getByText('เซสชันการทำงานปัจจุบัน')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })).toBeInTheDocument()
      })
    })

    it('should handle material loading errors gracefully', async () => {
      // Materials loading fails
      mockMaterialUsageService.getAvailableRawMaterials.mockResolvedValueOnce({
        success: false,
        error: 'ไม่สามารถดึงข้อมูลวัตถุดิบได้'
      })

      render(<MaterialUsageForm />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })).toBeInTheDocument()
      })

      // Try to add material
      const addButton = screen.getByRole('button', { name: 'เพิ่มวัตถุดิบ' })
      fireEvent.click(addButton)

      // Should show material loading error
      await waitFor(() => {
        expect(screen.getByText('ไม่สามารถดึงข้อมูลวัตถุดิบได้')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'ลองใหม่' })).toBeInTheDocument()
      })
    })
  })
})
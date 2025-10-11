import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RawMaterialForm } from '@/components/admin/RawMaterialForm'
import { rawMaterialsService } from '@/lib/services/raw-materials.service'
import type { RawMaterial } from 'packages/database/types'

// Service response types
interface ServiceResponse<T> {
 success: boolean
 data?: T
 error?: string
}

// Mock the service
vi.mock('@/lib/services/raw-materials.service', () => ({
 rawMaterialsService: {
  createRawMaterial: vi.fn(),
  updateRawMaterial: vi.fn(),
  formatCurrency: vi.fn((amount) => `฿${amount.toFixed(2)}`),
  formatDate: vi.fn((date) => new Date(date).toLocaleDateString('th-TH'))
 }
}))

// Mock react-hook-form
vi.mock('react-hook-form', async () => {
 const actual = await vi.importActual('react-hook-form')
 return {
  ...actual,
  useForm: () => ({
   handleSubmit: vi.fn((fn) => (e) => {
    e.preventDefault()
    fn({
     name: 'น้ำมันพืช',
     unit: 'ลิตร',
     cost_price: 25.50
    })
   }),
   formState: { errors: {} },
   watch: vi.fn((field) => {
    const values = {
     name: 'น้ำมันพืช',
     unit: 'ลิตร',
     cost_price: 25.50
    }
    return field ? values[field] : values
   }),
   setValue: vi.fn(),
   control: {}
  }),
  Controller: ({ render: renderProp }) => renderProp({
   field: {
    value: '',
    onChange: vi.fn(),
    onBlur: vi.fn(),
    name: 'test'
   },
   fieldState: { error: null },
   formState: { errors: {} }
  })
 }
})

const mockRawMaterial = {
 id: 'test-id',
 name: 'น้ำมันพืช',
 unit: 'ลิตร',
 cost_per_unit: 25.50,
 created_at: '2025-01-01T00:00:00Z'
}

describe('RawMaterialForm', () => {
 const mockOnSave = vi.fn()
 const mockOnCancel = vi.fn()

 beforeEach(() => {
  vi.clearAllMocks()
 })

 afterEach(() => {
  vi.resetAllMocks()
 })

 describe('Add Mode', () => {
  it('should render form for adding new raw material', () => {
   render(
    <RawMaterialForm
     rawMaterial={null}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   expect(screen.getByText('เพิ่มวัตถุดิบใหม่')).toBeInTheDocument()
   expect(screen.getByLabelText(/ชื่อวัตถุดิบ/)).toBeInTheDocument()
   expect(screen.getByLabelText(/หน่วยนับ/)).toBeInTheDocument()
   expect(screen.getByLabelText(/ราคาต้นทุนต่อหน่วย/)).toBeInTheDocument()
   expect(screen.getByText('เพิ่มวัตถุดิบ')).toBeInTheDocument()
  })

  it('should call onSave when form is submitted successfully', async () => {
   const user = userEvent.setup()
   const mockCreatedMaterial = {
    ...mockRawMaterial,
    id: 'new-id'
   }

   ;(rawMaterialsService.createRawMaterial as vi.MockedFunction<typeof rawMaterialsService.createRawMaterial>).mockResolvedValueOnce({
    success: true,
    data: mockCreatedMaterial
   } as ServiceResponse<RawMaterial>)

   render(
    <RawMaterialForm
     rawMaterial={null}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   const submitButton = screen.getByText('เพิ่มวัตถุดิบ')
   await user.click(submitButton)

   await waitFor(() => {
    expect(rawMaterialsService.createRawMaterial).toHaveBeenCalled()
    expect(mockOnSave).toHaveBeenCalledWith(mockCreatedMaterial)
   })
  })

  it('should display error message when creation fails', async () => {
   const user = userEvent.setup()
   const errorMessage = 'ชื่อวัตถุดิบนี้มีในระบบแล้ว กรุณาเลือกชื่ออื่น'

   ;(rawMaterialsService.createRawMaterial as vi.MockedFunction<typeof rawMaterialsService.createRawMaterial>).mockResolvedValueOnce({
    success: false,
    error: errorMessage
   } as ServiceResponse<RawMaterial>)

   render(
    <RawMaterialForm
     rawMaterial={null}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   const submitButton = screen.getByText('เพิ่มวัตถุดิบ')
   await user.click(submitButton)

   await waitFor(() => {
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(mockOnSave).not.toHaveBeenCalled()
   })
  })
 })

 describe('Edit Mode', () => {
  it('should render form for editing existing raw material', () => {
   render(
    <RawMaterialForm
     rawMaterial={mockRawMaterial}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   expect(screen.getByText('แก้ไขวัตถุดิบ')).toBeInTheDocument()
   expect(screen.getByText('บันทึกการแก้ไข')).toBeInTheDocument()
   expect(screen.getByText(`รหัส: ${mockRawMaterial.id}`)).toBeInTheDocument()
  })

  it('should call onSave when form is updated successfully', async () => {
   const user = userEvent.setup()
   const mockUpdatedMaterial = {
    ...mockRawMaterial,
    name: 'น้ำมันพืช (แก้ไข)'
   }

   ;(rawMaterialsService.updateRawMaterial as vi.MockedFunction<typeof rawMaterialsService.updateRawMaterial>).mockResolvedValueOnce({
    success: true,
    data: mockUpdatedMaterial
   } as ServiceResponse<RawMaterial>)

   render(
    <RawMaterialForm
     rawMaterial={mockRawMaterial}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   const submitButton = screen.getByText('บันทึกการแก้ไข')
   await user.click(submitButton)

   await waitFor(() => {
    expect(rawMaterialsService.updateRawMaterial).toHaveBeenCalledWith(
     mockRawMaterial.id,
     expect.any(Object)
    )
    expect(mockOnSave).toHaveBeenCalledWith(mockUpdatedMaterial)
   })
  })

  it('should display error message when update fails', async () => {
   const user = userEvent.setup()
   const errorMessage = 'ไม่พบวัตถุดิบที่ต้องการแก้ไข'

   ;(rawMaterialsService.updateRawMaterial as vi.MockedFunction<typeof rawMaterialsService.updateRawMaterial>).mockResolvedValueOnce({
    success: false,
    error: errorMessage
   } as ServiceResponse<RawMaterial>)

   render(
    <RawMaterialForm
     rawMaterial={mockRawMaterial}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   const submitButton = screen.getByText('บันทึกการแก้ไข')
   await user.click(submitButton)

   await waitFor(() => {
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(mockOnSave).not.toHaveBeenCalled()
   })
  })
 })

 describe('Unit Suggestions', () => {
  it('should show unit suggestions when unit field is focused', async () => {
   const user = userEvent.setup()

   render(
    <RawMaterialForm
     rawMaterial={null}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   const unitInput = screen.getByPlaceholderText(/กรอกหน่วยนับ/)
   await user.click(unitInput)

   // Should show some common units
   await waitFor(() => {
    expect(screen.getByText('กิโลกรัม')).toBeInTheDocument()
    expect(screen.getByText('ลิตร')).toBeInTheDocument()
   })
  })

  it('should hide unit suggestions when field loses focus', async () => {
   const user = userEvent.setup()

   render(
    <RawMaterialForm
     rawMaterial={null}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   const unitInput = screen.getByPlaceholderText(/กรอกหน่วยนับ/)
   await user.click(unitInput)

   // Wait for suggestions to show
   await waitFor(() => {
    expect(screen.getByText('กิโลกรัม')).toBeInTheDocument()
   })

   // Click outside to lose focus
   await user.click(document.body)

   // Wait for suggestions to hide (with delay for blur handling)
   await waitFor(() => {
    expect(screen.queryByText('กิโลกรัม')).not.toBeInTheDocument()
   }, { timeout: 300 })
  })
 })

 describe('Cancel Functionality', () => {
  it('should call onCancel when cancel button is clicked', async () => {
   const user = userEvent.setup()

   render(
    <RawMaterialForm
     rawMaterial={null}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   const cancelButton = screen.getByText('ยกเลิก')
   await user.click(cancelButton)

   expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should call onCancel when X button is clicked', async () => {
   const user = userEvent.setup()

   render(
    <RawMaterialForm
     rawMaterial={null}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   // Find the X button (close button)
   const closeButton = screen.getByRole('button', { name: '' }) // X button typically has no text
   await user.click(closeButton)

   expect(mockOnCancel).toHaveBeenCalled()
  })
 })

 describe('Loading State', () => {
  it('should show loading state during form submission', async () => {
   const user = userEvent.setup()

   // Mock a slow response
   ;(rawMaterialsService.createRawMaterial as vi.MockedFunction<typeof rawMaterialsService.createRawMaterial>).mockImplementationOnce(
    () => new Promise<ServiceResponse<RawMaterial>>(resolve => setTimeout(() => resolve({ success: true, data: mockRawMaterial }), 1000))
   )

   render(
    <RawMaterialForm
     rawMaterial={null}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   const submitButton = screen.getByText('เพิ่มวัตถุดิบ')
   await user.click(submitButton)

   // Should show loading state
   await waitFor(() => {
    expect(screen.getByText('กำลังบันทึก...')).toBeInTheDocument()
   })

   // Buttons should be disabled during loading
   expect(screen.getByText('ยกเลิก')).toBeDisabled()
  })
 })

 describe('Price Formatting', () => {
  it('should display formatted price preview', () => {
   render(
    <RawMaterialForm
     rawMaterial={mockRawMaterial}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   // Should show formatted currency
   expect(screen.getByText(/แสดง: ฿25\.50 ต่อ ลิตร/)).toBeInTheDocument()
  })
 })

 describe('Accessibility', () => {
  it('should have proper form labels and structure', () => {
   render(
    <RawMaterialForm
     rawMaterial={null}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   // Check that form fields have proper labels
   expect(screen.getByLabelText(/ชื่อวัตถุดิบ/)).toBeInTheDocument()
   expect(screen.getByLabelText(/หน่วยนับ/)).toBeInTheDocument()
   expect(screen.getByLabelText(/ราคาต้นทุนต่อหน่วย/)).toBeInTheDocument()

   // Check required field indicators
   expect(screen.getAllByText('*')).toHaveLength(3) // All fields are required
  })

  it('should support keyboard navigation', async () => {
   const user = userEvent.setup()

   render(
    <RawMaterialForm
     rawMaterial={null}
     onSave={mockOnSave}
     onCancel={mockOnCancel}
    />
   )

   // Tab through form fields
   await user.tab()
   expect(screen.getByPlaceholderText(/กรอกชื่อวัตถุดิบ/)).toHaveFocus()

   await user.tab()
   expect(screen.getByPlaceholderText(/กรอกหน่วยนับ/)).toHaveFocus()

   await user.tab()
   expect(screen.getByPlaceholderText(/กรอกราคาต้นทุน/)).toHaveFocus()
  })
 })
})
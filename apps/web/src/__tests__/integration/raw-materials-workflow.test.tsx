import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RawMaterialsPage from '@/app/admin/raw-materials/page'

// Mock sonner toast
vi.mock('sonner', () => ({
 toast: {
  success: vi.fn(),
  error: vi.fn()
 }
}))

// Mock the service with realistic behavior
const mockRawMaterials = [
 {
  id: '1',
  name: 'น้ำมันพืช',
  unit: 'ลิตร',
  cost_per_unit: 25.50,
  created_at: '2025-01-01T00:00:00Z'
 },
 {
  id: '2',
  name: 'แป้งสาลี',
  unit: 'กิโลกรัม',
  cost_per_unit: 15.00,
  created_at: '2025-01-02T00:00:00Z'
 }
]

const mockPagination = {
 page: 1,
 limit: 20,
 total: 2,
 totalPages: 1,
 hasNext: false,
 hasPrev: false
}

const mockService = {
 getRawMaterials: vi.fn(),
 createRawMaterial: vi.fn(),
 updateRawMaterial: vi.fn(),
 deleteRawMaterial: vi.fn(),
 formatCurrency: vi.fn((amount) => `฿${amount.toFixed(2)}`),
 formatDate: vi.fn((date) => new Date(date).toLocaleDateString('th-TH'))
}

vi.mock('@/lib/services/raw-materials.service', () => ({
 rawMaterialsService: mockService
}))

// Mock components to simplify testing
vi.mock('@/components/admin/AdminHeader', () => ({
 AdminHeader: () => <div data-testid="admin-header">Admin Header</div>
}))

describe('Raw Materials Workflow Integration', () => {
 beforeEach(() => {
  vi.clearAllMocks()
  
  // Default successful responses
  mockService.getRawMaterials.mockResolvedValue({
   success: true,
   data: {
    data: mockRawMaterials,
    pagination: mockPagination
   }
  })
 })

 afterEach(() => {
  vi.resetAllMocks()
 })

 describe('List View', () => {
  it('should display raw materials list on initial load', async () => {
   render(<RawMaterialsPage />)

   // Should show loading initially
   expect(screen.getByText('กำลังโหลดข้อมูลวัตถุดิบ...')).toBeInTheDocument()

   // Wait for data to load
   await waitFor(() => {
    expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
    expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
    expect(screen.getByText('แป้งสาลี')).toBeInTheDocument()
   })

   // Should show pagination info
   expect(screen.getByText('จำนวนวัตถุดิบทั้งหมด: 2 รายการ')).toBeInTheDocument()
  })

  it('should handle search functionality', async () => {
   const user = userEvent.setup()
   
   render(<RawMaterialsPage />)

   await waitFor(() => {
    expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
   })

   // Type in search box
   const searchInput = screen.getByPlaceholderText('ค้นหาวัตถุดิบ...')
   await user.type(searchInput, 'น้ำมัน')

   // Should call service with search parameter after debounce
   await waitFor(() => {
    expect(mockService.getRawMaterials).toHaveBeenCalledWith({
     page: 1,
     limit: 20,
     sortBy: 'name',
     sortOrder: 'asc',
     search: 'น้ำมัน'
    })
   }, { timeout: 500 })
  })

  it('should handle sorting functionality', async () => {
   const user = userEvent.setup()
   
   render(<RawMaterialsPage />)

   await waitFor(() => {
    expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
   })

   // Click on cost price column to sort
   const costHeader = screen.getByText('ราคาต้นทุน')
   await user.click(costHeader)

   await waitFor(() => {
    expect(mockService.getRawMaterials).toHaveBeenCalledWith({
     page: 1,
     limit: 20,
     sortBy: 'cost_per_unit',
     sortOrder: 'asc'
    })
   })

   // Click again to reverse sort
   await user.click(costHeader)

   await waitFor(() => {
    expect(mockService.getRawMaterials).toHaveBeenCalledWith({
     page: 1,
     limit: 20,
     sortBy: 'cost_per_unit',
     sortOrder: 'desc'
    })
   })
  })
 })

 describe('Add Workflow', () => {
  it('should complete add raw material workflow', async () => {
   const user = userEvent.setup()
   const newMaterial = {
    id: '3',
    name: 'น้ำตาล',
    unit: 'กิโลกรัม',
    cost_per_unit: 30.00,
    created_at: '2025-01-03T00:00:00Z'
   }

   mockService.createRawMaterial.mockResolvedValueOnce({
    success: true,
    data: newMaterial
   })

   render(<RawMaterialsPage />)

   // Wait for initial load
   await waitFor(() => {
    expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
   })

   // Click add button
   const addButton = screen.getByText('เพิ่มวัตถุดิบใหม่')
   await user.click(addButton)

   // Should switch to form view
   await waitFor(() => {
    expect(screen.getByText('เพิ่มวัตถุดิบใหม่')).toBeInTheDocument()
   })

   // Fill out form
   const nameInput = screen.getByPlaceholderText(/กรอกชื่อวัตถุดิบ/)
   const unitInput = screen.getByPlaceholderText(/กรอกหน่วยนับ/)
   const priceInput = screen.getByPlaceholderText(/กรอกราคาต้นทุน/)

   await user.type(nameInput, 'น้ำตาล')
   await user.type(unitInput, 'กิโลกรัม')
   await user.type(priceInput, '30.00')

   // Submit form
   const submitButton = screen.getByText('เพิ่มวัตถุดิบ')
   await user.click(submitButton)

   // Should call service and return to list view
   await waitFor(() => {
    expect(mockService.createRawMaterial).toHaveBeenCalledWith({
     name: 'น้ำตาล',
     unit: 'กิโลกรัม',
     cost_price: 30.00
    })
   })

   // Should show success message and return to list
   await waitFor(() => {
    expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
   })
  })

  it('should handle add form cancellation', async () => {
   const user = userEvent.setup()
   
   render(<RawMaterialsPage />)

   await waitFor(() => {
    expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
   })

   // Click add button
   const addButton = screen.getByText('เพิ่มวัตถุดิบใหม่')
   await user.click(addButton)

   // Should show form
   await waitFor(() => {
    expect(screen.getByText('เพิ่มวัตถุดิบใหม่')).toBeInTheDocument()
   })

   // Click cancel
   const cancelButton = screen.getByText('ยกเลิก')
   await user.click(cancelButton)

   // Should return to list view
   await waitFor(() => {
    expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
    expect(screen.queryByText('เพิ่มวัตถุดิบใหม่')).not.toBeInTheDocument()
   })
  })
 })

 describe('Edit Workflow', () => {
  it('should complete edit raw material workflow', async () => {
   const user = userEvent.setup()
   const updatedMaterial = {
    ...mockRawMaterials[0],
    name: 'น้ำมันพืช (แก้ไข)',
    cost_per_unit: 28.00
   }

   mockService.updateRawMaterial.mockResolvedValueOnce({
    success: true,
    data: updatedMaterial
   })

   render(<RawMaterialsPage />)

   await waitFor(() => {
    expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
   })

   // Click edit button for first material
   const editButtons = screen.getAllByRole('button', { name: '' }) // Edit icons
   await user.click(editButtons[0]) // First edit button

   // Should switch to edit form
   await waitFor(() => {
    expect(screen.getByText('แก้ไขวัตถุดิบ')).toBeInTheDocument()
   })

   // Modify the name
   const nameInput = screen.getByDisplayValue('น้ำมันพืช')
   await user.clear(nameInput)
   await user.type(nameInput, 'น้ำมันพืช (แก้ไข)')

   // Submit form
   const submitButton = screen.getByText('บันทึกการแก้ไข')
   await user.click(submitButton)

   // Should call update service
   await waitFor(() => {
    expect(mockService.updateRawMaterial).toHaveBeenCalledWith(
     '1',
     expect.objectContaining({
      name: 'น้ำมันพืช (แก้ไข)'
     })
    )
   })

   // Should return to list view
   await waitFor(() => {
    expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
   })
  })
 })

 describe('Delete Workflow', () => {
  it('should complete delete raw material workflow', async () => {
   const user = userEvent.setup()

   mockService.deleteRawMaterial.mockResolvedValueOnce({
    success: true
   })

   render(<RawMaterialsPage />)

   await waitFor(() => {
    expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
   })

   // Click delete button for first material
   const deleteButtons = screen.getAllByRole('button', { name: '' }) // Delete icons
   await user.click(deleteButtons[1]) // Second button should be delete

   // Should show confirmation dialog
   await waitFor(() => {
    expect(screen.getByText('ยืนยันการลบวัตถุดิบ')).toBeInTheDocument()
    expect(screen.getByText('"น้ำมันพืช"')).toBeInTheDocument()
   })

   // Confirm deletion
   const confirmButton = screen.getByText('ยืนยันลบ')
   await user.click(confirmButton)

   // Should call delete service
   await waitFor(() => {
    expect(mockService.deleteRawMaterial).toHaveBeenCalledWith('1')
   })

   // Dialog should close
   await waitFor(() => {
    expect(screen.queryByText('ยืนยันการลบวัตถุดิบ')).not.toBeInTheDocument()
   })
  })

  it('should handle delete cancellation', async () => {
   const user = userEvent.setup()
   
   render(<RawMaterialsPage />)

   await waitFor(() => {
    expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
   })

   // Click delete button
   const deleteButtons = screen.getAllByRole('button', { name: '' })
   await user.click(deleteButtons[1])

   // Should show confirmation dialog
   await waitFor(() => {
    expect(screen.getByText('ยืนยันการลบวัตถุดิบ')).toBeInTheDocument()
   })

   // Click cancel
   const cancelButton = screen.getByText('ยกเลิก')
   await user.click(cancelButton)

   // Dialog should close without deleting
   await waitFor(() => {
    expect(screen.queryByText('ยืนยันการลบวัตถุดิบ')).not.toBeInTheDocument()
   })

   expect(mockService.deleteRawMaterial).not.toHaveBeenCalled()
  })

  it('should handle delete failure', async () => {
   const user = userEvent.setup()

   mockService.deleteRawMaterial.mockResolvedValueOnce({
    success: false,
    error: 'ไม่สามารถลบวัตถุดิบนี้ได้ เนื่องจากมีการใช้งานในระบบ'
   })

   render(<RawMaterialsPage />)

   await waitFor(() => {
    expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
   })

   // Click delete and confirm
   const deleteButtons = screen.getAllByRole('button', { name: '' })
   await user.click(deleteButtons[1])

   await waitFor(() => {
    expect(screen.getByText('ยืนยันการลบวัตถุดิบ')).toBeInTheDocument()
   })

   const confirmButton = screen.getByText('ยืนยันลบ')
   await user.click(confirmButton)

   // Should call service but show error
   await waitFor(() => {
    expect(mockService.deleteRawMaterial).toHaveBeenCalledWith('1')
   })

   // Dialog should close (error handling is done via toast)
   await waitFor(() => {
    expect(screen.queryByText('ยืนยันการลบวัตถุดิบ')).not.toBeInTheDocument()
   })
  })
 })

 describe('Error Handling', () => {
  it('should handle service errors gracefully', async () => {
   mockService.getRawMaterials.mockResolvedValueOnce({
    success: false,
    error: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
   })

   render(<RawMaterialsPage />)

   await waitFor(() => {
    expect(screen.getByText('เกิดข้อผิดพลาดในการดึงข้อมูล')).toBeInTheDocument()
    expect(screen.getByText('ลองใหม่')).toBeInTheDocument()
   })
  })

  it('should allow retry after error', async () => {
   const user = userEvent.setup()

   // First call fails
   mockService.getRawMaterials
    .mockResolvedValueOnce({
     success: false,
     error: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    })
    // Second call succeeds
    .mockResolvedValueOnce({
     success: true,
     data: {
      data: mockRawMaterials,
      pagination: mockPagination
     }
    })

   render(<RawMaterialsPage />)

   await waitFor(() => {
    expect(screen.getByText('เกิดข้อผิดพลาดในการดึงข้อมูล')).toBeInTheDocument()
   })

   // Click retry button
   const retryButton = screen.getByText('ลองใหม่')
   await user.click(retryButton)

   // Should load successfully on retry
   await waitFor(() => {
    expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
    expect(screen.getByText('น้ำมันพืช')).toBeInTheDocument()
   })
  })
 })

 describe('Empty State', () => {
  it('should show empty state when no materials exist', async () => {
   mockService.getRawMaterials.mockResolvedValueOnce({
    success: true,
    data: {
     data: [],
     pagination: { ...mockPagination, total: 0 }
    }
   })

   render(<RawMaterialsPage />)

   await waitFor(() => {
    expect(screen.getByText('ยังไม่มีวัตถุดิบในระบบ')).toBeInTheDocument()
    expect(screen.getByText('เพิ่มวัตถุดิบแรก')).toBeInTheDocument()
   })
  })

  it('should show search empty state when no results found', async () => {
   const user = userEvent.setup()

   // First call returns data
   mockService.getRawMaterials
    .mockResolvedValueOnce({
     success: true,
     data: {
      data: mockRawMaterials,
      pagination: mockPagination
     }
    })
    // Search call returns empty
    .mockResolvedValueOnce({
     success: true,
     data: {
      data: [],
      pagination: { ...mockPagination, total: 0 }
     }
    })

   render(<RawMaterialsPage />)

   await waitFor(() => {
    expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
   })

   // Type search that returns no results
   const searchInput = screen.getByPlaceholderText('ค้นหาวัตถุดิบ...')
   await user.type(searchInput, 'ไม่มีผลลัพธ์')

   await waitFor(() => {
    expect(screen.getByText('ไม่พบวัตถุดิบที่ค้นหา')).toBeInTheDocument()
    expect(screen.getByText('ลองเปลี่ยนคำค้นหาหรือเพิ่มวัตถุดิบใหม่')).toBeInTheDocument()
   })
  })
 })
})